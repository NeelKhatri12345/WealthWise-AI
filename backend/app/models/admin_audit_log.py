"""
WealthWise AI - AdminAuditLog ORM Model

Table: admin_audit_logs
Tracks administrator actions for compliance and security auditing.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class AdminAuditLog(UUIDMixin, Base):
    __tablename__ = "admin_audit_logs"

    admin_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    target_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    admin: Mapped["User"] = relationship(
        "User",
        foreign_keys=[admin_id],
        lazy="selectin",
    )
    target_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[target_user_id],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<AdminAuditLog id={self.id} admin_id={self.admin_id} action={self.action}>"
