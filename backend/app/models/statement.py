"""
WealthWise AI - Statement ORM Model

Table: statements
Tracks uploaded bank statement files and their processing lifecycle.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin
from app.enums.statement_status_enum import StatementStatusEnum


class Statement(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "statements"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)  # S3 object key
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'pdf' | 'csv'
    file_size_bytes: Mapped[int | None] = mapped_column(nullable=True)

    status: Mapped[StatementStatusEnum] = mapped_column(
        SAEnum(StatementStatusEnum, name="statementstatusenum", create_constraint=True),
        default=StatementStatusEnum.PENDING,
        nullable=False,
        index=True,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="statements")
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="statement", cascade="all, delete-orphan"
    )
    health_scores: Mapped[list["HealthScore"]] = relationship(
        "HealthScore", back_populates="statement"
    )
    risk_profiles: Mapped[list["RiskProfile"]] = relationship(
        "RiskProfile", back_populates="statement"
    )

    def __repr__(self) -> str:
        return f"<Statement id={self.id} status={self.status} user_id={self.user_id}>"
