"""
WealthWise AI - AICoachMessage ORM Model

Table: ai_coach_messages
Individual messages within an AI Coach conversation.
Stores user/assistant/system turns with optional intent classification
and a context snapshot of the user financial state at the time.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class AICoachMessage(UUIDMixin, Base):
    __tablename__ = "ai_coach_messages"

    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("ai_coach_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # "user" | "assistant" | "system"
    role: Mapped[str] = mapped_column(String(15), nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Classified intent, e.g. "health_score_query", "budget_advice", "off_topic"
    intent: Mapped[str | None] = mapped_column(String(80), nullable=True)

    # Snapshot of user financial context (health score, profile, risk) at send time
    context_snapshot_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    conversation: Mapped["AICoachConversation"] = relationship(
        "AICoachConversation", back_populates="messages"
    )

    def __repr__(self) -> str:
        return (
            f"<AICoachMessage id={self.id} "
            f"conversation_id={self.conversation_id} role={self.role}>"
        )
