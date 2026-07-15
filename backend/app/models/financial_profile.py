"""
WealthWise AI - FinancialProfile ORM Model

Table: financial_profiles
Stores the structured financial profile built through the AI chatbot.
One-to-one with users; upserted on each profile update.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class FinancialProfile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "financial_profiles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,  # one profile per user
    )

    # ── Demographic / Employment ─────────────────────────────────────
    age_range: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # e.g. "18-25", "26-35", "36-45", "46-55", "55+"
    employment_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # e.g. "salaried", "self_employed", "business_owner", "freelancer", "student", "retired"

    # ── Income ───────────────────────────────────────────────────────
    monthly_income: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    family_income: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    earning_members: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dependents_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Debt ─────────────────────────────────────────────────────────
    has_loans: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    loan_types: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # e.g. ["home_loan", "car_loan", "personal_loan", "education_loan"]
    monthly_emi: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_debt: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)

    # ── Emergency Fund ───────────────────────────────────────────────
    has_emergency_fund: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    emergency_fund_months: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Number of months of expenses covered

    # ── Insurance ────────────────────────────────────────────────────
    has_health_insurance: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_life_insurance: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # ── Investments ──────────────────────────────────────────────────
    monthly_investment: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    investment_types: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # e.g. ["mutual_funds", "stocks", "fd", "ppf", "nps", "real_estate", "crypto"]

    # ── Risk & Goals ─────────────────────────────────────────────────
    risk_comfort: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # e.g. "low", "moderate", "high"
    financial_goals: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # e.g. ["retirement", "house", "education", "travel", "emergency_fund"]
    income_stability: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # e.g. "very_stable", "stable", "variable", "irregular"

    # ── Completion ───────────────────────────────────────────────────
    profile_completion_percentage: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="financial_profile")

    def __repr__(self) -> str:
        return f"<FinancialProfile user_id={self.user_id} completion={self.profile_completion_percentage}%>"
