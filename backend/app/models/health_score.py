"""WealthWise AI - HealthScore ORM Model"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class HealthScore(UUIDMixin, Base):
    __tablename__ = "health_scores"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    statement_id: Mapped[UUID] = mapped_column(
        ForeignKey("statements.id", ondelete="CASCADE"), nullable=False
    )

    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    savings_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    expense_ratio: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    debt_ratio: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    investment_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    score_breakdown: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="health_scores")
    statement: Mapped["Statement"] = relationship(
        "Statement", back_populates="health_scores"
    )
