"""WealthWise AI - AIConversation ORM Model"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class AIConversation(UUIDMixin, Base):
    __tablename__ = "ai_conversations"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Groups related messages into a chat session
    session_id: Mapped[UUID] = mapped_column(nullable=False, index=True)

    role: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # 'user' | 'assistant'
    message: Mapped[str] = mapped_column(Text, nullable=False)

    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="ai_conversations")

    def __repr__(self) -> str:
        return f"<AIConversation session={self.session_id} role={self.role}>"
