"""
WealthWise AI - Financial Context Builder

Collects a comprehensive snapshot of the user's financial situation
for use in AI coaching prompts. Gathers data from:

  - Transaction summary (total income/expenses/savings rate)
  - Category-level spending breakdown
  - Final Hybrid Health Score + component scores
  - Risk Profile
  - FinProfileBot chatbot answers (FinancialProfile record)
  - Goals
  - Loans / EMIs
  - Emergency fund status
  - Insurance coverage
  - Investment readiness

All fields are Optional so the builder never raises on missing data.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional
from uuid import UUID

from app.core.logger import logger
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.financial_profile_repository import FinancialProfileRepository
from app.repositories.health_score_snapshot_repository import (
    HealthScoreSnapshotRepository,
)
from app.repositories.transaction_repository import TransactionRepository
from app.services.financial_metrics_service import FinancialMetricsService


# ── Data class returned to callers ────────────────────────────────────────────


@dataclass
class UserFinancialContext:
    """
    Flat snapshot of all financial data for a user.
    Passed from FinancialContextBuilder → AIPromptBuilder.
    """

    user_id: UUID

    # ── Transaction Summary ──────────────────────────────────────────
    total_income: Optional[Decimal] = None
    total_expenses: Optional[Decimal] = None
    net_cash_flow: Optional[Decimal] = None
    savings_rate: Optional[Decimal] = None          # percentage (0–100)
    transaction_count: int = 0

    # ── Category Spending (top 5) ────────────────────────────────────
    category_spending: dict[str, Decimal] = field(default_factory=dict)
    top_spending_category: Optional[str] = None
    top_spending_category_ratio: Optional[Decimal] = None

    # ── Health Score ─────────────────────────────────────────────────
    health_score: Optional[Decimal] = None
    health_band: Optional[str] = None              # EXCELLENT/GOOD/FAIR/WEAK/CRITICAL
    component_scores: dict[str, float] = field(default_factory=dict)
    health_positive_factors: list[str] = field(default_factory=list)
    health_negative_factors: list[str] = field(default_factory=list)
    health_suggestions: list[str] = field(default_factory=list)

    # ── Risk Profile ─────────────────────────────────────────────────
    risk_profile: Optional[str] = None             # CONSERVATIVE/MODERATE/AGGRESSIVE
    risk_confidence: Optional[float] = None
    risk_comfort_self_reported: Optional[str] = None  # low/moderate/high from chatbot

    # ── FinProfileBot Answers (Demographics / Employment) ────────────
    age_range: Optional[str] = None
    employment_type: Optional[str] = None
    monthly_income_declared: Optional[Decimal] = None
    earning_members: Optional[int] = None
    dependents_count: Optional[int] = None

    # ── Loans / EMIs ─────────────────────────────────────────────────
    has_loans: Optional[bool] = None
    loan_types: list[str] = field(default_factory=list)
    monthly_emi: Optional[Decimal] = None
    total_debt: Optional[Decimal] = None

    # ── Emergency Fund ───────────────────────────────────────────────
    has_emergency_fund: Optional[bool] = None
    emergency_fund_months: Optional[float] = None

    # ── Insurance ────────────────────────────────────────────────────
    has_health_insurance: Optional[bool] = None
    has_life_insurance: Optional[bool] = None

    # ── Investment Readiness ─────────────────────────────────────────
    monthly_investment: Optional[Decimal] = None
    investment_types: list[str] = field(default_factory=list)
    investment_readiness_score: Optional[float] = None

    # ── Goals ────────────────────────────────────────────────────────
    financial_goals: list[str] = field(default_factory=list)

    # ── Profile Completion ───────────────────────────────────────────
    profile_completion_pct: float = 0.0


# ── Service ───────────────────────────────────────────────────────────────────


class FinancialContextBuilder:
    """
    Aggregates all user financial data into a single UserFinancialContext.

    Dependencies are injected; each data source is fetched independently
    with individual try/except so a failure in one domain never blocks others.
    """

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        analytics_repo: AnalyticsRepository,
        profile_repo: FinancialProfileRepository,
        snapshot_repo: HealthScoreSnapshotRepository,
        metrics_service: FinancialMetricsService,
    ) -> None:
        self._txn_repo = transaction_repo
        self._analytics_repo = analytics_repo
        self._profile_repo = profile_repo
        self._snapshot_repo = snapshot_repo
        self._metrics = metrics_service

    # ── Public API ────────────────────────────────────────────────────────────

    async def build(self, user_id: UUID) -> UserFinancialContext:
        """
        Build and return the complete financial context for *user_id*.
        Failures in individual data sources are logged and skipped gracefully.
        """
        ctx = UserFinancialContext(user_id=user_id)

        await self._load_transaction_summary(ctx)
        await self._load_category_spending(ctx)
        await self._load_health_score(ctx)
        await self._load_risk_profile(ctx)
        await self._load_financial_profile(ctx)

        logger.debug(
            "Financial context built",
            extra={"user_id": str(user_id), "health_band": ctx.health_band},
        )
        return ctx

    # ── Private loaders ───────────────────────────────────────────────────────

    async def _load_transaction_summary(self, ctx: UserFinancialContext) -> None:
        try:
            m = await self._metrics.get_metrics(ctx.user_id)
            ctx.total_income = m.total_income
            ctx.total_expenses = m.total_expenses
            ctx.net_cash_flow = m.net_cash_flow
            ctx.savings_rate = m.savings_rate
            ctx.transaction_count = m.transaction_count
            ctx.top_spending_category = m.top_spending_category
            ctx.top_spending_category_ratio = m.top_spending_category_ratio
        except Exception as exc:
            logger.warning(
                "ContextBuilder: failed to load transaction summary",
                exc_info=exc,
            )

    async def _load_category_spending(self, ctx: UserFinancialContext) -> None:
        """Compute per-category spending totals from all user transactions."""
        try:
            transactions, _ = await self._txn_repo.get_by_user_filtered(
                user_id=ctx.user_id, limit=100_000
            )
            cat_totals: dict[str, Decimal] = {}
            for txn in transactions:
                if txn.transaction_type == "debit" and txn.category:
                    cat_totals[txn.category] = cat_totals.get(
                        txn.category, Decimal("0")
                    ) + (txn.amount or Decimal("0"))
            # Keep top-5 categories sorted by spend descending
            sorted_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
            ctx.category_spending = dict(sorted_cats[:5])
        except Exception as exc:
            logger.warning(
                "ContextBuilder: failed to load category spending",
                exc_info=exc,
            )

    async def _load_health_score(self, ctx: UserFinancialContext) -> None:
        try:
            snap = await self._snapshot_repo.get_latest_by_user(ctx.user_id)
            if snap:
                ctx.health_score = snap.score
                ctx.health_band = snap.band
                ctx.risk_profile = snap.risk_profile
                comp = snap.component_scores
                if comp:
                    if hasattr(comp, "model_dump"):
                        ctx.component_scores = comp.model_dump()
                    elif isinstance(comp, dict):
                        ctx.component_scores = comp
                    else:
                        ctx.component_scores = {}
                # Extract investment readiness from component scores
                ctx.investment_readiness_score = ctx.component_scores.get(
                    "investment_readiness_score"
                )
                ctx.health_positive_factors = list(snap.positive_factors or [])
                ctx.health_negative_factors = list(snap.negative_factors or [])
                ctx.health_suggestions = list(snap.suggestions or [])
        except Exception as exc:
            logger.warning(
                "ContextBuilder: failed to load health score snapshot",
                exc_info=exc,
            )

    async def _load_risk_profile(self, ctx: UserFinancialContext) -> None:
        """Load legacy risk profile if no snapshot risk_profile was found."""
        if ctx.risk_profile:
            return  # already populated from snapshot
        try:
            risk = await self._analytics_repo.get_latest_risk_profile(ctx.user_id)
            if risk:
                ctx.risk_profile = (
                    risk.risk_level.value
                    if hasattr(risk.risk_level, "value")
                    else str(risk.risk_level)
                )
                ctx.risk_confidence = float(risk.confidence) if risk.confidence else None
        except Exception as exc:
            logger.warning(
                "ContextBuilder: failed to load risk profile",
                exc_info=exc,
            )

    async def _load_financial_profile(self, ctx: UserFinancialContext) -> None:
        """Load FinProfileBot chatbot answers from the financial_profiles table."""
        try:
            profile = await self._profile_repo.get_by_user_id(ctx.user_id)
            if not profile:
                return

            # Demographics / employment
            ctx.age_range = profile.age_range
            ctx.employment_type = profile.employment_type
            ctx.monthly_income_declared = profile.monthly_income
            ctx.earning_members = profile.earning_members
            ctx.dependents_count = profile.dependents_count

            # Loans / EMI
            ctx.has_loans = profile.has_loans
            ctx.loan_types = list(profile.loan_types or [])
            ctx.monthly_emi = profile.monthly_emi
            ctx.total_debt = profile.total_debt

            # Emergency fund
            ctx.has_emergency_fund = profile.has_emergency_fund
            ctx.emergency_fund_months = profile.emergency_fund_months

            # Insurance
            ctx.has_health_insurance = profile.has_health_insurance
            ctx.has_life_insurance = profile.has_life_insurance

            # Investments
            ctx.monthly_investment = profile.monthly_investment
            ctx.investment_types = list(profile.investment_types or [])

            # Risk comfort (self-reported via chatbot)
            ctx.risk_comfort_self_reported = profile.risk_comfort

            # Goals
            ctx.financial_goals = list(profile.financial_goals or [])

            # Profile completion
            ctx.profile_completion_pct = float(
                profile.profile_completion_percentage or 0.0
            )
        except Exception as exc:
            logger.warning(
                "ContextBuilder: failed to load financial profile",
                exc_info=exc,
            )
