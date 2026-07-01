"""WealthWise AI - Statement Pydantic Schemas

Response shapes for the statement upload and status endpoints.
All schemas use ``from_attributes=True`` so they can be constructed
directly from SQLAlchemy ORM instances.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.enums.statement_status_enum import StatementStatusEnum


class StatementUploadResponse(BaseModel):
    """
    Returned immediately after a successful upload (HTTP 202).

    ``minio_key`` is the object key in the MinIO/S3 bucket — useful for
    debugging and for future signed-URL generation.
    """

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    file_name: str = Field(description="Original file name as supplied by the client")
    file_type: str = Field(description="File extension without dot (pdf | png | jpg | jpeg)")
    file_size_bytes: Optional[int] = Field(
        default=None, description="Size in bytes of the uploaded file"
    )
    minio_key: str = Field(
        alias="file_path",
        description="Object key inside the MinIO/S3 bucket",
        serialization_alias="minio_key",
    )
    status: StatementStatusEnum
    created_at: datetime


class StatementStatusResponse(BaseModel):
    """Full statement detail including processing status and timestamps."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    file_name: str
    file_type: str
    file_size_bytes: Optional[int] = None
    minio_key: str = Field(alias="file_path", serialization_alias="minio_key")
    status: StatementStatusEnum
    error_message: Optional[str] = None
    processing_metadata: Optional[dict[str, Any]] = None
    processing_started_at: Optional[datetime] = None
    ocr_completed_at: Optional[datetime] = None
    parsing_started_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class StatementOcrCompletedRequest(BaseModel):
    """Payload for recording OCR extraction results."""

    ocr_text: Optional[str] = Field(
        default=None,
        description="Raw text extracted by the OCR engine",
    )
    ocr_engine: Optional[str] = Field(
        default=None,
        description="OCR engine identifier (e.g. easyocr, paddleocr)",
    )
    page_count: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of pages processed",
    )
    extra: Optional[dict[str, Any]] = Field(
        default=None,
        description="Additional OCR metadata",
    )

    def to_processing_metadata(self) -> dict[str, Any]:
        metadata: dict[str, Any] = {}
        if self.ocr_text is not None:
            metadata["ocr_text"] = self.ocr_text
        if self.ocr_engine is not None:
            metadata["ocr_engine"] = self.ocr_engine
        if self.page_count is not None:
            metadata["page_count"] = self.page_count
        if self.extra:
            metadata.update(self.extra)
        return metadata


class StatementProcessingFailRequest(BaseModel):
    """Payload for recording a processing failure."""

    error_message: str = Field(..., min_length=1, max_length=2000)
