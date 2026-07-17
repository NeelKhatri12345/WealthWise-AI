"""
WealthWise AI - Statement Service

Orchestrates the statement upload lifecycle (storage only — no OCR/parsing):
  1. Read file content
  2. Validate: size limit (10 MB), extension, magic bytes
  3. Generate a unique MinIO object key  (UUID-prefixed, collision-free)
  4. Upload file bytes to MinIO / S3
  5. Persist metadata record in PostgreSQL (status=PENDING)
  6. Return immediately — downstream processing is handled separately

Supported formats: PDF, PNG, JPG, JPEG
"""

from pathlib import PurePosixPath
from typing import Sequence
from uuid import UUID, uuid4

from fastapi import UploadFile

from app.clients.s3_client import S3Client
from app.core.config import get_settings
from app.core.constants import (
    JPEG_MAGIC_BYTES,
    PDF_MAGIC_BYTES,
    PNG_MAGIC_BYTES,
    SUPPORTED_EXTENSIONS,
)
from app.core.logger import logger
from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import (
    FileTooLargeException,
    NotFoundException,
    UnsupportedFileTypeException,
)
from app.repositories.statement_repository import StatementRepository
from app.schemas.statement_schema import (
    StatementStatusResponse,
    StatementUploadResponse,
)

settings = get_settings()

# Mapping from extension → (magic_bytes, required_prefix_length)
# Used to verify the file's actual bytes match the claimed type.
_MAGIC_BYTE_MAP: dict[str, tuple[bytes, int]] = {
    ".pdf": (PDF_MAGIC_BYTES, len(PDF_MAGIC_BYTES)),
    ".png": (PNG_MAGIC_BYTES, len(PNG_MAGIC_BYTES)),
    ".jpg": (JPEG_MAGIC_BYTES, len(JPEG_MAGIC_BYTES)),
    ".jpeg": (JPEG_MAGIC_BYTES, len(JPEG_MAGIC_BYTES)),
}

# Extension → MIME type used when uploading to MinIO
_EXTENSION_CONTENT_TYPE: dict[str, str] = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def _get_extension(filename: str) -> str:
    """Return lower-cased file extension including the leading dot."""
    return PurePosixPath(filename).suffix.lower()


def _build_minio_key(user_id: UUID, original_filename: str, file_ext: str) -> str:
    """
    Build a collision-free MinIO object key.

    Pattern:
        statements/<user_id>/<uuid4><ext>

    The UUID prefix guarantees uniqueness even when the same user uploads
    the same file name multiple times.  The original file name is stored
    separately in the ``file_name`` DB column for display purposes.
    """
    unique_id = uuid4()
    return f"statements/{user_id}/{unique_id}{file_ext}"


class StatementService:

    def __init__(
        self,
        statement_repo: StatementRepository,
        s3_client: S3Client,
    ) -> None:
        self._statement_repo = statement_repo
        self._s3 = s3_client

    # ── Public API ────────────────────────────────────────────────────────────

    async def upload_statement(
        self, file: UploadFile, user_id: UUID
    ) -> StatementUploadResponse:
        """
        Validate, store in MinIO, and persist metadata.

        Returns a StatementUploadResponse with status=PENDING immediately.
        No OCR or parsing is triggered here.

        Raises:
            FileTooLargeException (413)  – content exceeds MAX_FILE_SIZE_MB
            UnsupportedFileTypeException (415) – bad extension or magic bytes
        """
        # 1. Read content (stream fully into memory; FastAPI UploadFile is async)
        content = await file.read()

        # 2. Size guard
        if len(content) > settings.max_file_size_bytes:
            raise FileTooLargeException(
                f"File size {len(content):,} bytes exceeds the "
                f"{settings.MAX_FILE_SIZE_MB} MB limit."
            )

        # 3. Extension validation
        original_name = file.filename or "upload"
        file_ext = _get_extension(original_name)
        if file_ext not in SUPPORTED_EXTENSIONS:
            raise UnsupportedFileTypeException(
                f"Extension '{file_ext}' is not supported. "
                f"Accepted: {sorted(SUPPORTED_EXTENSIONS)}"
            )

        # 4. Magic-byte validation (prevents MIME / extension spoofing)
        magic, length = _MAGIC_BYTE_MAP[file_ext]
        if not content[:length].startswith(magic):
            raise UnsupportedFileTypeException(
                f"File content does not match the declared type '{file_ext}'. "
                "Upload a valid PDF, PNG, JPG, or JPEG."
            )

        # 5. Build unique S3 key and resolve content type
        minio_key = _build_minio_key(user_id, original_name, file_ext)
        content_type = _EXTENSION_CONTENT_TYPE.get(
            file_ext, "application/octet-stream"
        )

        # 6. Upload to MinIO
        await self._s3.upload_file(
            key=minio_key,
            data=content,
            content_type=content_type,
        )
        logger.info(
            "File uploaded to MinIO",
            extra={
                "user_id": str(user_id),
                "key": minio_key,
                "size_bytes": len(content),
                "content_type": content_type,
            },
        )

        # 7. Persist metadata (status=PENDING — no processing yet)
        statement = await self._statement_repo.create(
            {
                "user_id": user_id,
                "file_name": original_name,   # original display name
                "file_path": minio_key,        # unique MinIO object key
                "file_type": file_ext.lstrip("."),
                "file_size_bytes": len(content),
                "status": StatementStatusEnum.PENDING,
            }
        )

        logger.info(
            "Statement record created",
            extra={
                "statement_id": str(statement.id),
                "user_id": str(user_id),
                "status": StatementStatusEnum.PENDING.value,
            },
        )

        return StatementUploadResponse.model_validate(statement)

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_statements(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> Sequence[StatementStatusResponse]:
        statements = await self._statement_repo.get_by_user(user_id, skip, limit)
        return [StatementStatusResponse.model_validate(s) for s in statements]

    async def get_statement_detail(
        self, statement_id: UUID, user_id: UUID
    ) -> StatementStatusResponse:
        statement = await self._statement_repo.get_by_id_and_user(
            statement_id, user_id
        )
        if not statement:
            raise NotFoundException("Statement not found")
        return StatementStatusResponse.model_validate(statement)

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete_statement(self, statement_id: UUID, user_id: UUID) -> None:
        statement = await self._statement_repo.get_by_id_and_user(
            statement_id, user_id
        )
        if not statement:
            raise NotFoundException("Statement not found")

        # Remove the file from MinIO first
        await self._s3.delete_file(statement.file_path)

        # Cascade deletes transactions via DB constraint
        await self._statement_repo.delete(statement)

        logger.info(
            "Statement deleted",
            extra={
                "statement_id": str(statement_id),
                "user_id": str(user_id),
                "minio_key": statement.file_path,
            },
        )
