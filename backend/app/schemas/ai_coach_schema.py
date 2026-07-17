"""
WealthWise AI - AI Coach Schemas (Pydantic v2)

Used by:
  POST   /api/v1/ai-coach/conversations
  GET    /api/v1/ai-coach/conversations
  GET    /api/v1/ai-coach/conversations/{conversation_id}
  POST   /api/v1/ai-coach/conversations/{conversation_id}/messages
  DELETE /api/v1/ai-coach/conversations/{conversation_id}
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Request Schemas ───────────────────────────────────────────────────────────


class CreateConversationRequest(BaseModel):
    """Body for POST /ai-coach/conversations"""

    title: str = Field(
        default="New Conversation",
        min_length=1,
        max_length=255,
    )


class SendMessageRequest(BaseModel):
    """Body for POST /ai-coach/conversations/{conversation_id}/messages"""

    content: str = Field(..., min_length=1, max_length=4000)


# ── Response Schemas ──────────────────────────────────────────────────────────


class AICoachMessageResponse(BaseModel):
    """Single message inside a conversation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    user_id: UUID
    role: str  # "user" | "assistant" | "system"
    content: str
    intent: Optional[str] = None
    created_at: datetime


class ConversationSummaryResponse(BaseModel):
    """Lightweight conversation listed in GET /ai-coach/conversations."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetailResponse(BaseModel):
    """Full conversation with all messages."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[AICoachMessageResponse] = []


class SendMessageResponse(BaseModel):
    """Returned after a user sends a message and the AI replies."""

    conversation_id: UUID
    user_message: AICoachMessageResponse
    assistant_message: AICoachMessageResponse


# ── Phase 2 Chat Schemas (AICoachService pipeline) ────────────────────────────


class AIChatRequest(BaseModel):
    """Body for the simplified chat endpoint used by the AI Coach service."""

    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[UUID] = None  # None → create a new conversation


class AIChatResponse(BaseModel):
    """Response returned by AICoachService.chat()."""

    reply: str
    conversation_id: UUID
    intent: Optional[str] = None           # classified intent
    tokens_used: Optional[int] = None
    model_version: Optional[str] = None
    provider: Optional[str] = None         # "gemini" | "disabled" (rule-based)


class ConversationMessageSchema(BaseModel):
    """Single message for conversation history view."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    content: str
    intent: Optional[str] = None
    created_at: datetime


class ConversationHistoryResponse(BaseModel):
    """Full message history for one conversation."""

    conversation_id: UUID
    messages: list[ConversationMessageSchema]
    total_messages: int


class ConversationListItem(BaseModel):
    """Lightweight item in the conversation list."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationListResponse(BaseModel):
    """Paginated list of conversations."""

    conversations: list[ConversationListItem]
    total: int
