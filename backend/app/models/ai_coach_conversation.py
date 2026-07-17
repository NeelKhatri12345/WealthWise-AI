"""
WealthWise AI - AICoachConversation ORM Model

Table: ai_coach_conversations
Groups messages into named AI Coach conversations.
Each user can have multiple conversations.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class AICoachConversation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "ai_coach_conversations"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Short label shown in conversation list; defaults to "New Conversation"
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="New Conversation",
        server_default="New Conversation",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="ai_coach_conversations")
    messages: Mapped[list["AICoachMessage"]] = relationship(
        "AICoachMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AICoachMessage.created_at",
    )

    def __repr__(self) -> str:
        return f"<AICoachConversation id={self.id} user_id={self.user_id} title={self.title!r}>"
