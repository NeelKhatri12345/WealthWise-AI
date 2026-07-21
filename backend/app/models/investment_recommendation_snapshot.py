"""
WealthWise AI - InvestmentRecommendationSnapshot ORM Model

Table: investment_recommendation_snapshots
Persisted investment recommendation — computed from the Hybrid Health Score,
Risk Profile, Financial Profile, and Transaction metrics. Stores all three
strategies (Conservative / Balanced / Aggressive) plus the recommended one.
No crypto categories are included in this phase.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class InvestmentRecommendationSnapshot(UUIDMixin, Base):
    __tablename__ = "investment_recommendation_snapshots"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    health_score_snapshot_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("health_score_snapshots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    risk_profile_snapshot_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("risk_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Readiness ─────────────────────────────────────────────────────────────
    # READY | PARTIAL | NOT_READY
    investment_readiness: Mapped[str] = mapped_column(String(64), nullable=False)
    # 0–100 numeric readiness score
    investment_readiness_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )

    # ── Strategy ──────────────────────────────────────────────────────────────
    # conservative | balanced | aggressive
    recommended_strategy: Mapped[str] = mapped_column(String(64), nullable=False)

    # ── Investable Amount ──────────────────────────────────────────────────────
    monthly_investable_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )

    # ── Allocation (recommended strategy allocation) ───────────────────────────
    # List of: { category, percentage, monthly_amount, priority, rationale }
    allocation_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ── Reasoning ─────────────────────────────────────────────────────────────
    # { strategy_rationale, positive_signals, negative_signals, how_to_unlock }
    reasoning_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── Warnings ──────────────────────────────────────────────────────────────
    # List of warning strings
    warnings_json: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ── Action Plan ───────────────────────────────────────────────────────────
    # { now: [...], three_months: [...], six_months: [...], one_year: [...] }
    action_plan_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ── All Three Strategies + Calculation Inputs ──────────────────────────────
    # { conservative: {allocation, label}, balanced: {...}, aggressive: {...},
    #   calculation_inputs: { health_score, risk_profile, income, expenses, emi, ... } }
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="investment_recommendation_snapshots"
    )

    def __repr__(self) -> str:
        return (
            f"<InvestmentRecommendationSnapshot id={self.id} "
            f"user_id={self.user_id} strategy={self.recommended_strategy} "
            f"readiness={self.investment_readiness}>"
        )
