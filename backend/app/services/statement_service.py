"""
WealthWise AI - Statement Service

Orchestrates the full statement lifecycle:
1. Validate uploaded file (type, size, magic bytes)
2. Upload to S3 / MinIO
3. Create DB record (PENDING)
4. Trigger background processing pipeline:
   OCR → Transaction extraction → Feature engineering → Analytics
"""

from typing import Sequence
from uuid import UUID

from fastapi import UploadFile

from app.clients.ocr_client import OCRClient
from app.clients.s3_client import S3Client
from app.core.config import get_settings
from app.core.constants import PDF_MAGIC_BYTES, SUPPORTED_EXTENSIONS
from app.core.logger import logger
from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import (FileTooLargeException,
                                              NotFoundException,
                                              UnsupportedFileTypeException)
from app.repositories.statement_repository import StatementRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.statement_schema import (StatementStatusResponse,
                                          StatementUploadResponse)

settings = get_settings()


class StatementService:

    def __init__(
        self,
        statement_repo: StatementRepository,
        transaction_repo: TransactionRepository,
        s3_client: S3Client,
        ocr_client: OCRClient,
    ) -> None:
        self._statement_repo = statement_repo
        self._transaction_repo = transaction_repo
        self._s3 = s3_client
        self._ocr = ocr_client

    async def upload_statement(
        self, file: UploadFile, user_id: UUID
    ) -> StatementUploadResponse:
        """
        Validates and uploads a bank statement.
        Returns immediately with PENDING status — processing is async.
        """
        # 1. Read file content
        content = await file.read()

        # 2. Size validation
        if len(content) > settings.max_file_size_bytes:
            raise FileTooLargeException(
                f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
            )

        # 3. File type validation (extension + magic bytes)
        file_ext = self._get_extension(file.filename or "")
        if file_ext not in SUPPORTED_EXTENSIONS:
            raise UnsupportedFileTypeException(
                f"Unsupported file type '{file_ext}'. Accepted: {SUPPORTED_EXTENSIONS}"
            )

        # Magic byte check for PDFs (prevents MIME spoofing)
        if file_ext == ".pdf" and not content.startswith(PDF_MAGIC_BYTES):
            raise UnsupportedFileTypeException("File does not appear to be a valid PDF")

        # 4. Upload to S3
        s3_key = f"statements/{user_id}/{file.filename}"
        await self._s3.upload_file(
            key=s3_key,
            data=content,
            content_type=file.content_type or "application/octet-stream",
        )

        # 5. Create DB record
        statement = await self._statement_repo.create(
            {
                "user_id": user_id,
                "file_name": file.filename,
                "file_path": s3_key,
                "file_type": file_ext.lstrip("."),
                "file_size_bytes": len(content),
                "status": StatementStatusEnum.PENDING,
            }
        )

        logger.info(
            "Statement uploaded",
            extra={"statement_id": str(statement.id), "user_id": str(user_id)},
        )

        # 6. Enqueue background processing
        # TODO: Replace with Celery/ARQ task when queue is configured
        import asyncio

        asyncio.create_task(self._process_statement(statement.id, content, file_ext))

        return StatementUploadResponse.model_validate(statement)

    async def _process_statement(
        self, statement_id: UUID, content: bytes, file_ext: str
    ) -> None:
        """
        Background processing pipeline.
        Runs after upload returns to client — non-blocking.
        """
        from app.database.session import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            # Fresh repo instances for background context
            from app.repositories.statement_repository import \
                StatementRepository
            from app.repositories.transaction_repository import \
                TransactionRepository

            stmt_repo = StatementRepository(db)
            txn_repo = TransactionRepository(db)

            statement = await stmt_repo.get(statement_id)
            if not statement:
                return

            try:
                # Mark as processing
                await stmt_repo.update_status(statement, StatementStatusEnum.PROCESSING)
                await db.commit()

                # OCR Extraction
                if file_ext == ".pdf":
                    raw_transactions = await self._ocr.extract_from_pdf(content)
                else:
                    raw_transactions = await self._ocr.extract_from_csv(content)

                # Bulk insert transactions
                for txn in raw_transactions:
                    txn["user_id"] = statement.user_id
                    txn["statement_id"] = statement_id
                await txn_repo.bulk_create(raw_transactions)

                # Mark complete
                await stmt_repo.update_status(statement, StatementStatusEnum.COMPLETED)
                await db.commit()

                logger.info(
                    "Statement processed successfully",
                    extra={"statement_id": str(statement_id)},
                )

            except Exception as exc:
                await db.rollback()
                await stmt_repo.update_status(
                    statement,
                    StatementStatusEnum.FAILED,
                    error_message=str(exc)[:500],
                )
                await db.commit()
                logger.error(
                    "Statement processing failed",
                    extra={"statement_id": str(statement_id)},
                    exc_info=exc,
                )

    async def get_statements(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> Sequence[StatementStatusResponse]:
        statements = await self._statement_repo.get_by_user(user_id, skip, limit)
        return [StatementStatusResponse.model_validate(s) for s in statements]

    async def get_statement_detail(
        self, statement_id: UUID, user_id: UUID
    ) -> StatementStatusResponse:
        statement = await self._statement_repo.get_by_id_and_user(statement_id, user_id)
        if not statement:
            raise NotFoundException("Statement not found")
        return StatementStatusResponse.model_validate(statement)

    async def delete_statement(self, statement_id: UUID, user_id: UUID) -> None:
        statement = await self._statement_repo.get_by_id_and_user(statement_id, user_id)
        if not statement:
            raise NotFoundException("Statement not found")
        # Delete from S3
        await self._s3.delete_file(statement.file_path)
        # Delete from DB (cascade deletes transactions)
        await self._statement_repo.delete(statement)

    @staticmethod
    def _get_extension(filename: str) -> str:
        from pathlib import PurePosixPath

        return PurePosixPath(filename).suffix.lower()
