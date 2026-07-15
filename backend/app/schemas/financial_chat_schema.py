"""
WealthWise AI - Financial Chat Schemas (Pydantic v2)

Used by:
  POST /api/v1/financial-chat/start
  POST /api/v1/financial-chat/{session_id}/message
  GET  /api/v1/financial-chat/{session_id}
"""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Request Schemas ───────────────────────────────────────────────────────────


class SendMessageRequest(BaseModel):
    """Body for POST /financial-chat/{session_id}/message"""

    message: str


# ── Response Schemas ──────────────────────────────────────────────────────────


class ChatMessageResponse(BaseModel):
    """Single message in a chat session."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sender: str  # "user" | "assistant" | "system"
    message: str
    extracted_fields: Optional[dict[str, Any]] = None
    created_at: datetime


class StartChatResponse(BaseModel):
    """Returned when a new session is successfully created."""

    session_id: UUID
    status: str
    current_step: int
    first_message: str
    # UI hints for first question
    quick_replies: Optional[list[str]] = None
    input_type: Literal["chips", "amount", "text"] = "chips"
    allow_free_text: bool = False


class SendMessageResponse(BaseModel):
    """Returned after the user sends a message."""

    session_id: UUID
    status: str  # "active" | "completed"
    current_step: int
    assistant_message: str
    extracted_fields: Optional[dict[str, Any]] = None
    profile_completion_percentage: float
    is_complete: bool

    # Validation
    is_valid_answer: bool = True
    validation_message: Optional[str] = None

    # UI hints for next question
    quick_replies: Optional[list[str]] = None
    allow_free_text: bool = False
    input_type: Literal["chips", "amount", "text"] = "chips"

    # Kept for backwards compat with existing frontend code
    suggested_choices: Optional[list[str]] = None


class ChatSessionResponse(BaseModel):
    """Full session details including all messages."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: str
    current_step: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    messages: list[ChatMessageResponse] = []
    profile_completion_percentage: float = 0.0
