"""
WealthWise AI - FinancialChatMessage ORM Model

Table: financial_chat_messages
Individual messages within a financial profile chat session.
Stores both assistant prompts and user replies, plus extracted profile fields.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class FinancialChatMessage(UUIDMixin, Base):
    __tablename__ = "financial_chat_messages"

    session_id: Mapped[UUID] = mapped_column(
        ForeignKey("financial_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # "user" | "assistant" | "system"
    sender: Mapped[str] = mapped_column(String(15), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Structured fields extracted from this specific user message
    # e.g. {"employment_type": "salaried", "age_range": "26-35"}
    extracted_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    session: Mapped["FinancialChatSession"] = relationship(
        "FinancialChatSession", back_populates="messages"
    )

    def __repr__(self) -> str:
        return f"<FinancialChatMessage id={self.id} session_id={self.session_id} sender={self.sender}>"
