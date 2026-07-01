"""WealthWise AI - AI Coach Schemas"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[UUID] = None  # None = start a new session


class AIChatResponse(BaseModel):
    reply: str
    session_id: UUID
    tokens_used: Optional[int] = None
    model_version: Optional[str] = None


class ConversationMessageSchema(BaseModel):
    id: UUID
    role: str
    message: str
    created_at: datetime


class ConversationHistoryResponse(BaseModel):
    session_id: UUID
    messages: List[ConversationMessageSchema]
    total_messages: int
