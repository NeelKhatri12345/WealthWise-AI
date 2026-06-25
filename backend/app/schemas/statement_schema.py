"""WealthWise AI - Statement Schemas"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.enums.statement_status_enum import StatementStatusEnum


class StatementUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    file_name: str
    file_type: str
    status: StatementStatusEnum
    created_at: datetime


class StatementStatusResponse(StatementUploadResponse):
    error_message: Optional[str] = None
    processed_at: Optional[datetime] = None
    file_size_bytes: Optional[int] = None
