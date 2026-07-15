"""
WealthWise AI - HealthScoreSnapshot ORM Model

Table: health_score_snapshots
Persisted hybrid health score — computed from both transaction analytics
and the chatbot-collected financial profile. Separated from the legacy
health_scores table, which remains for backward compatibility.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class HealthScoreSnapshot(UUIDMixin, Base):
    __tablename__ = "health_score_snapshots"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    financial_profile_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("financial_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Top-level score ──────────────────────────────────────────────
    score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    # EXCELLENT | GOOD | FAIR | WEAK | CRITICAL
    band: Mapped[str] = mapped_column(String(20), nullable=False)
    # CONSERVATIVE | MODERATE | AGGRESSIVE
    risk_profile: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ── Component scores (raw points, not percentages) ───────────────
    cash_flow_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    savings_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    spending_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    debt_burden_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    emergency_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    income_stability_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    investment_readiness_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    # ── Explainability ───────────────────────────────────────────────
    positive_factors: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    negative_factors: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    suggestions: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Raw inputs / metadata for audit trail
    calculation_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="health_score_snapshots")
    financial_profile: Mapped["FinancialProfile"] = relationship(
        "FinancialProfile", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<HealthScoreSnapshot id={self.id} user_id={self.user_id} score={self.score} band={self.band}>"
