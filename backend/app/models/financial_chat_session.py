"""
WealthWise AI - FinancialChatSession ORM Model

Table: financial_chat_sessions
Tracks each user's guided financial profile chatbot session.
One active session per user at a time; completed sessions are archived.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class FinancialChatSession(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "financial_chat_sessions"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # "active" | "completed" | "abandoned"
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )

    # Which step the conversation is on (0-indexed, max 9 for 10 steps)
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="financial_chat_sessions")
    messages: Mapped[list["FinancialChatMessage"]] = relationship(
        "FinancialChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="FinancialChatMessage.created_at",
    )

    def __repr__(self) -> str:
        return f"<FinancialChatSession id={self.id} user_id={self.user_id} status={self.status} step={self.current_step}>"
