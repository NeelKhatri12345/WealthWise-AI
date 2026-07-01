"""
WealthWise AI - Unit Tests: StatementService upload validation

Tests the pure validation logic inside StatementService.upload_statement():
  - File size guard
  - Extension validation
  - Magic byte validation (PDF, PNG, JPEG, JPG)
  - Happy path: valid file → MinIO upload + DB record

All external I/O (S3Client, StatementRepository) is mocked.
No database, no network, no MinIO required.
"""

import io
from typing import Optional
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import UploadFile

from app.core.constants import (
    JPEG_MAGIC_BYTES,
    PDF_MAGIC_BYTES,
    PNG_MAGIC_BYTES,
)
from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import (
    FileTooLargeException,
    UnsupportedFileTypeException,
)
from app.services.statement_service import StatementService


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_upload_file(
    filename: str,
    content: bytes,
    content_type: Optional[str] = None,
) -> UploadFile:
    """Build a FastAPI UploadFile backed by an in-memory buffer."""
    file_obj = io.BytesIO(content)
    return UploadFile(
        filename=filename,
        file=file_obj,  # type: ignore[arg-type]
        headers={"content-type": content_type or "application/octet-stream"},
    )


def _make_service() -> tuple[StatementService, AsyncMock, AsyncMock]:
    """
    Return a StatementService with mocked repo and S3 client.

    Returns:
        (service, mock_repo, mock_s3)
    """
    mock_repo = AsyncMock()
    mock_s3 = AsyncMock()

    # Default: create() returns a fake Statement ORM object
    fake_statement = MagicMock()
    fake_statement.id = uuid4()
    fake_statement.file_name = "bank.pdf"
    fake_statement.file_path = f"statements/{uuid4()}/{uuid4()}.pdf"
    fake_statement.file_type = "pdf"
    fake_statement.file_size_bytes = 100
    fake_statement.status = StatementStatusEnum.PENDING
    from datetime import datetime, timezone

    fake_statement.created_at = datetime.now(timezone.utc)
    fake_statement.updated_at = datetime.now(timezone.utc)
    mock_repo.create.return_value = fake_statement

    service = StatementService(
        statement_repo=mock_repo,
        s3_client=mock_s3,
    )
    return service, mock_repo, mock_s3


# ── Size Validation ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_upload_rejects_oversized_file() -> None:
    """Files exceeding MAX_FILE_SIZE_MB must raise FileTooLargeException (413)."""
    service, _, _ = _make_service()

    # 11 MB of valid PDF bytes (magic bytes at start, padded with zeros)
    oversized = PDF_MAGIC_BYTES + b"\x00" * (11 * 1024 * 1024)
    upload = _make_upload_file("statement.pdf", oversized, "application/pdf")

    with pytest.raises(FileTooLargeException) as exc_info:
        await service.upload_statement(upload, uuid4())

    assert exc_info.value.status_code == 413


# ── Extension Validation ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_extension() -> None:
    """A .csv file must raise UnsupportedFileTypeException (415)."""
    service, _, _ = _make_service()

    content = b"date,description,amount\n2024-01-01,Salary,5000"
    upload = _make_upload_file("transactions.csv", content, "text/csv")

    with pytest.raises(UnsupportedFileTypeException) as exc_info:
        await service.upload_statement(upload, uuid4())

    assert exc_info.value.status_code == 415
    assert ".csv" in str(exc_info.value.message)


@pytest.mark.asyncio
async def test_upload_rejects_exe_extension() -> None:
    """Arbitrary extensions must be rejected (415)."""
    service, _, _ = _make_service()

    upload = _make_upload_file("malware.exe", b"MZ\x90\x00", "application/octet-stream")

    with pytest.raises(UnsupportedFileTypeException):
        await service.upload_statement(upload, uuid4())


# ── Magic Byte Validation ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_upload_rejects_pdf_with_wrong_magic_bytes() -> None:
    """A .pdf file whose content is actually a JPEG must be rejected (MIME spoofing)."""
    service, _, _ = _make_service()

    # JPEG bytes with a .pdf filename — classic spoofing attempt
    spoofed = JPEG_MAGIC_BYTES + b"\x00" * 100
    upload = _make_upload_file("statement.pdf", spoofed, "application/pdf")

    with pytest.raises(UnsupportedFileTypeException) as exc_info:
        await service.upload_statement(upload, uuid4())

    assert exc_info.value.status_code == 415


@pytest.mark.asyncio
async def test_upload_rejects_png_with_wrong_magic_bytes() -> None:
    """A .png file with PDF bytes must be rejected."""
    service, _, _ = _make_service()

    spoofed = PDF_MAGIC_BYTES + b"\x00" * 100
    upload = _make_upload_file("image.png", spoofed, "image/png")

    with pytest.raises(UnsupportedFileTypeException):
        await service.upload_statement(upload, uuid4())


@pytest.mark.asyncio
async def test_upload_rejects_jpeg_with_wrong_magic_bytes() -> None:
    """A .jpeg file with PNG bytes must be rejected."""
    service, _, _ = _make_service()

    spoofed = PNG_MAGIC_BYTES + b"\x00" * 100
    upload = _make_upload_file("image.jpeg", spoofed, "image/jpeg")

    with pytest.raises(UnsupportedFileTypeException):
        await service.upload_statement(upload, uuid4())


# ── Happy Paths ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_upload_valid_pdf_calls_s3_and_repo() -> None:
    """A valid PDF must trigger one S3 upload and one repo.create call."""
    service, mock_repo, mock_s3 = _make_service()

    content = PDF_MAGIC_BYTES + b"\x00" * 1024  # small valid-looking PDF
    upload = _make_upload_file("bank_statement.pdf", content, "application/pdf")
    user_id = uuid4()

    result = await service.upload_statement(upload, user_id)

    mock_s3.upload_file.assert_awaited_once()
    mock_repo.create.assert_awaited_once()

    # Verify the S3 key is UUID-based and not the raw filename
    call_kwargs = mock_s3.upload_file.call_args.kwargs
    assert "bank_statement.pdf" not in call_kwargs["key"], (
        "MinIO key must not contain the raw filename — UUID prefix required"
    )
    assert call_kwargs["content_type"] == "application/pdf"

    assert result.status == StatementStatusEnum.PENDING


@pytest.mark.asyncio
async def test_upload_valid_png_calls_s3_and_repo() -> None:
    """A valid PNG must trigger one S3 upload and one repo.create call."""
    service, mock_repo, mock_s3 = _make_service()

    # Override repo to return a PNG-typed statement
    fake_statement = MagicMock()
    fake_statement.id = uuid4()
    fake_statement.file_name = "statement.png"
    fake_statement.file_path = f"statements/{uuid4()}/{uuid4()}.png"
    fake_statement.file_type = "png"
    fake_statement.file_size_bytes = 200
    fake_statement.status = StatementStatusEnum.PENDING
    from datetime import datetime, timezone
    fake_statement.created_at = datetime.now(timezone.utc)
    fake_statement.updated_at = datetime.now(timezone.utc)
    mock_repo.create.return_value = fake_statement

    content = PNG_MAGIC_BYTES + b"\x00" * 1024
    upload = _make_upload_file("statement.png", content, "image/png")
    user_id = uuid4()

    result = await service.upload_statement(upload, user_id)

    mock_s3.upload_file.assert_awaited_once()
    call_kwargs = mock_s3.upload_file.call_args.kwargs
    assert call_kwargs["content_type"] == "image/png"
    assert result.status == StatementStatusEnum.PENDING


@pytest.mark.asyncio
async def test_upload_valid_jpeg_jpg_extensions() -> None:
    """Both .jpg and .jpeg extensions with valid JPEG magic bytes must succeed."""
    for ext in (".jpg", ".jpeg"):
        service, mock_repo, mock_s3 = _make_service()

        # Adjust the fake statement file_type per extension
        fake_statement = MagicMock()
        fake_statement.id = uuid4()
        fake_statement.file_name = f"statement{ext}"
        fake_statement.file_path = f"statements/{uuid4()}/{uuid4()}{ext}"
        fake_statement.file_type = ext.lstrip(".")
        fake_statement.file_size_bytes = 150
        fake_statement.status = StatementStatusEnum.PENDING
        from datetime import datetime, timezone
        fake_statement.created_at = datetime.now(timezone.utc)
        fake_statement.updated_at = datetime.now(timezone.utc)
        mock_repo.create.return_value = fake_statement

        content = JPEG_MAGIC_BYTES + b"\x00" * 1024
        upload = _make_upload_file(f"statement{ext}", content, "image/jpeg")

        result = await service.upload_statement(upload, uuid4())
        assert result.status == StatementStatusEnum.PENDING, (
            f"Expected PENDING for extension {ext!r}"
        )


@pytest.mark.asyncio
async def test_upload_minio_key_is_unique_per_call() -> None:
    """Two uploads of the same filename must produce different MinIO keys."""
    service, mock_repo, mock_s3 = _make_service()

    content = PDF_MAGIC_BYTES + b"\x00" * 512
    user_id = uuid4()
    keys: list[str] = []

    for _ in range(2):
        upload = _make_upload_file("bank.pdf", content, "application/pdf")
        await service.upload_statement(upload, user_id)
        call_kwargs = mock_s3.upload_file.call_args.kwargs
        keys.append(call_kwargs["key"])

    assert keys[0] != keys[1], "Each upload must receive a unique MinIO object key"


# ── Repo Create Payload ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_upload_repo_create_receives_correct_payload() -> None:
    """The repo.create call must receive the expected metadata fields."""
    service, mock_repo, mock_s3 = _make_service()

    content = PDF_MAGIC_BYTES + b"\x00" * 512
    upload = _make_upload_file("my_statement.pdf", content, "application/pdf")
    user_id = uuid4()

    await service.upload_statement(upload, user_id)

    create_kwargs = mock_repo.create.call_args.args[0]

    assert create_kwargs["user_id"] == user_id
    assert create_kwargs["file_name"] == "my_statement.pdf"
    assert create_kwargs["file_type"] == "pdf"
    assert create_kwargs["file_size_bytes"] == len(content)
    assert create_kwargs["status"] == StatementStatusEnum.PENDING
    # MinIO key must be stored in file_path
    assert "statements/" in create_kwargs["file_path"]
    assert str(user_id) in create_kwargs["file_path"]
