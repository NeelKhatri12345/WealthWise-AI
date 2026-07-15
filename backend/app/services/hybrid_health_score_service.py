"""
WealthWise AI - Hybrid Health Score Service

Deterministic scoring engine combining:
  A) Transaction analytics (from FinancialMetricsService)
  B) Chatbot-collected financial profile (from FinancialProfileRepository)

Formula weights (total = 100 points):
  25% — Savings & Cash Flow        (max 25 pts)
  20% — Spending Discipline        (max 20 pts)
  20% — Debt Burden                (max 20 pts)
  15% — Emergency Preparedness     (max 15 pts)
  10% — Income Stability           (max 10 pts)
  10% — Investment Readiness       (max 10 pts)

Score bands:
  85-100 → EXCELLENT
  70-84  → GOOD
  55-69  → FAIR
  40-54  → WEAK
  0-39   → CRITICAL

Risk profile determination:
  CONSERVATIVE / MODERATE / AGGRESSIVE
  Based on risk_comfort, investment types, emergency fund, debt burden, income stability.
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from app.core.logger import logger
from app.exceptions.custom_exceptions import NotFoundException, ValidationException
from app.models.financial_profile import FinancialProfile
from app.repositories.financial_profile_repository import FinancialProfileRepository
from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.financial_metrics_schema import FinancialMetrics
from app.schemas.health_score_snapshot_schema import (
    ComponentScores,
    HealthScoreSnapshotResponse,
)
from app.services.financial_metrics_service import FinancialMetricsService
from app.services.health_score_service import HealthScoreService


# ── Band thresholds ────────────────────────────────────────────────────────────

def _score_to_band(score: float) -> str:
    if score >= 85:
        return "EXCELLENT"
    if score >= 70:
        return "GOOD"
    if score >= 55:
        return "FAIR"
    if score >= 40:
        return "WEAK"
    return "CRITICAL"


# ── Component scorers ──────────────────────────────────────────────────────────

def _score_savings_cashflow(metrics: FinancialMetrics) -> float:
    """
    Max 25 points.
    Based on savings_rate from transactions.
    Bonus/penalty adjusted by profile-reported monthly_investment.
    """
    sr = float(metrics.savings_rate)
    if sr >= 30:
        return 25.0
    if sr >= 20:
        return 20.0
    if sr >= 10:
        return 14.0
    if sr >= 0:
        return 8.0
    if sr >= -10:
        return 3.0
    return 0.0


def _score_spending_discipline(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
) -> float:
    """
    Max 20 points.
    Based on expense ratio and top spending category concentration.
    """
    score = 0.0

    # Expense-to-income ratio (max 12 pts)
    if metrics.total_income and metrics.total_income > 0:
        ratio = float(metrics.total_expenses / metrics.total_income)
        if ratio <= 0.60:
            score += 12.0
        elif ratio <= 0.75:
            score += 9.0
        elif ratio <= 0.90:
            score += 6.0
        elif ratio <= 1.00:
            score += 3.0
        else:
            score += 0.0

    # Spending concentration (max 8 pts)
    if metrics.top_spending_category_ratio is not None and metrics.total_expenses > 0:
        tsr = float(metrics.top_spending_category_ratio)
        if tsr <= 0.35:
            score += 8.0
        elif tsr <= 0.50:
            score += 5.0
        elif tsr <= 0.65:
            score += 2.0
        else:
            score += 0.0
    else:
        score += 4.0  # benefit of doubt when category data is unavailable

    return min(20.0, score)


def _score_debt_burden(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
) -> float:
    """
    Max 20 points.
    Uses profile emi/income ratio and total_debt when available,
    falls back to transaction debit/credit ratio.
    """
    score = 20.0

    if profile and profile.has_loans is False:
        return 20.0  # debt-free

    if profile and profile.monthly_emi and profile.monthly_income and float(profile.monthly_income) > 0:
        emi_ratio = float(profile.monthly_emi) / float(profile.monthly_income)
        if emi_ratio <= 0.10:
            score = 20.0
        elif emi_ratio <= 0.20:
            score = 16.0
        elif emi_ratio <= 0.35:
            score = 10.0
        elif emi_ratio <= 0.50:
            score = 5.0
        else:
            score = 0.0
    elif metrics.total_income and metrics.total_income > 0:
        # Fallback: high debit/credit ratio suggests high spending
        dc_ratio = float(metrics.total_expenses / metrics.total_income)
        if dc_ratio <= 0.5:
            score = 18.0
        elif dc_ratio <= 0.75:
            score = 12.0
        elif dc_ratio <= 1.0:
            score = 6.0
        else:
            score = 0.0

    return min(20.0, score)


def _score_emergency_preparedness(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
) -> float:
    """
    Max 15 points.
    Emergency fund months from profile (primary),
    insurance coverage as bonus.
    """
    score = 0.0

    # Emergency fund (max 10 pts)
    months = 0.0
    if profile and profile.emergency_fund_months is not None:
        months = float(profile.emergency_fund_months)

    if months >= 9:
        score += 10.0
    elif months >= 6:
        score += 8.0
    elif months >= 3:
        score += 5.0
    elif months >= 1:
        score += 2.0
    else:
        score += 0.0

    # Health insurance (max 3 pts)
    if profile and profile.has_health_insurance:
        score += 3.0

    # Life insurance (max 2 pts)
    if profile and profile.has_life_insurance:
        score += 2.0

    return min(15.0, score)


def _score_income_stability(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
) -> float:
    """
    Max 10 points.
    Uses profile income_stability field (primary),
    transaction income CV as corroborating signal.
    """
    score = 0.0

    # Profile-reported stability (max 7 pts)
    if profile and profile.income_stability:
        stability_map = {
            "very_stable": 7.0,
            "stable": 5.5,
            "variable": 3.0,
            "irregular": 1.0,
        }
        score += stability_map.get(profile.income_stability, 3.0)
    else:
        score += 3.5  # neutral default

    # Transaction CV corroboration (max 3 pts)
    cv = metrics.income_coefficient_of_variation
    if cv is not None:
        fcv = float(cv)
        if fcv <= 0.15:
            score += 3.0
        elif fcv <= 0.30:
            score += 1.5
        # else 0 — consistent with low stability

    return min(10.0, score)


def _score_investment_readiness(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
) -> float:
    """
    Max 10 points.
    Uses monthly_investment / monthly_income ratio and investment diversity.
    """
    score = 0.0

    monthly_income = 0.0
    if profile and profile.monthly_income:
        monthly_income = float(profile.monthly_income)
    elif metrics.total_income and metrics.income_months_count > 0:
        monthly_income = float(metrics.total_income) / metrics.income_months_count

    monthly_investment = 0.0
    if profile and profile.monthly_investment:
        monthly_investment = float(profile.monthly_investment)

    # Investment rate relative to income (max 7 pts)
    if monthly_income > 0:
        inv_rate = monthly_investment / monthly_income
        if inv_rate >= 0.20:
            score += 7.0
        elif inv_rate >= 0.10:
            score += 5.0
        elif inv_rate >= 0.05:
            score += 3.0
        elif inv_rate > 0:
            score += 1.5
        else:
            score += 0.0

    # Investment diversity (max 3 pts)
    inv_types = profile.investment_types if profile else None
    if inv_types:
        if len(inv_types) >= 3:
            score += 3.0
        elif len(inv_types) == 2:
            score += 2.0
        elif len(inv_types) == 1:
            score += 1.0

    return min(10.0, score)


# ── Risk profile determination ────────────────────────────────────────────────

def _determine_risk_profile(
    profile: Optional[FinancialProfile],
    debt_score: float,
    emergency_score: float,
) -> str:
    """
    CONSERVATIVE / MODERATE / AGGRESSIVE
    Primarily driven by user's stated risk_comfort; modulated by financial reality.
    """
    stated = (profile.risk_comfort if profile and profile.risk_comfort else "moderate").lower()

    # Financial readiness score (0-10)
    readiness = (
        (emergency_score / 15.0) * 5.0  # emergency score normalized to 5
        + (debt_score / 20.0) * 5.0      # debt score normalized to 5
    )

    if stated == "high" and readiness >= 7:
        return "AGGRESSIVE"
    if stated == "high" and readiness >= 4:
        return "MODERATE"
    if stated == "low" or readiness < 3:
        return "CONSERVATIVE"
    if stated == "moderate" and readiness >= 6:
        return "MODERATE"
    return "MODERATE"


# ── Explainability builders ────────────────────────────────────────────────────

def _build_positive_factors(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
    component_scores: ComponentScores,
) -> list[str]:
    factors = []
    if component_scores.cash_flow_score >= 20:
        factors.append("Strong savings rate and positive cash flow")
    elif component_scores.cash_flow_score >= 14:
        factors.append("Healthy savings rate")

    if component_scores.spending_score >= 16:
        factors.append("Well-controlled expenses and diversified spending")
    elif component_scores.spending_score >= 10:
        factors.append("Reasonable expense-to-income ratio")

    if component_scores.debt_burden_score >= 18:
        factors.append("Low or zero debt burden")
    elif component_scores.debt_burden_score >= 12:
        factors.append("Manageable EMI-to-income ratio")

    if component_scores.emergency_score >= 10:
        factors.append("Solid emergency fund coverage")
    if profile and profile.has_health_insurance and profile.has_life_insurance:
        factors.append("Fully insured (health + life)")

    if component_scores.income_stability_score >= 8:
        factors.append("Very stable income stream")

    if component_scores.investment_readiness_score >= 7:
        factors.append("Active investor with diversified portfolio")

    if not factors:
        factors.append("Financial assessment completed — building baseline score")

    return factors


def _build_negative_factors(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
    component_scores: ComponentScores,
) -> list[str]:
    factors = []
    if component_scores.cash_flow_score < 8:
        factors.append("Savings rate is below the recommended 10% threshold")

    if component_scores.spending_score < 8:
        factors.append("High expense ratio or concentrated spending in one category")

    if component_scores.debt_burden_score < 8:
        factors.append("High EMI-to-income ratio (above 35%) is straining finances")

    if component_scores.emergency_score < 5:
        factors.append("Insufficient emergency fund (less than 3 months of expenses)")

    if profile and not profile.has_health_insurance:
        factors.append("No health insurance — high financial risk in medical emergencies")

    if component_scores.income_stability_score < 4:
        factors.append("Irregular or variable income increases financial vulnerability")

    if component_scores.investment_readiness_score < 2:
        factors.append("No active investment strategy identified")

    return factors


def _build_suggestions(
    metrics: FinancialMetrics,
    profile: Optional[FinancialProfile],
    component_scores: ComponentScores,
    risk_profile: str,
) -> list[str]:
    suggestions = []

    if component_scores.cash_flow_score < 14:
        suggestions.append(
            "Target saving at least 20% of your monthly income using the 50-30-20 rule."
        )

    if component_scores.debt_burden_score < 10:
        suggestions.append(
            "Consider debt consolidation or the avalanche method to reduce high-interest loans faster."
        )

    if component_scores.emergency_score < 10:
        suggestions.append(
            "Build an emergency fund covering 3–6 months of expenses in a liquid savings account."
        )

    if profile and not profile.has_health_insurance:
        suggestions.append(
            "Purchase a family health insurance plan immediately — medical expenses are the #1 cause of financial distress."
        )

    if component_scores.investment_readiness_score < 5:
        if risk_profile == "CONSERVATIVE":
            suggestions.append(
                "Start with PPF, FD, or debt mutual funds for safe, tax-efficient returns."
            )
        elif risk_profile == "AGGRESSIVE":
            suggestions.append(
                "Consider SIPs in diversified equity mutual funds or index funds for long-term wealth creation."
            )
        else:
            suggestions.append(
                "Start a monthly SIP in balanced mutual funds to build wealth systematically."
            )

    if component_scores.spending_score < 10:
        suggestions.append(
            "Track discretionary spending and identify top 3 expense categories to optimise first."
        )

    if not suggestions:
        suggestions.append(
            "Excellent financial health! Review your investment allocation annually to stay on track."
        )

    return suggestions


# ── Main service class ─────────────────────────────────────────────────────────


class HybridHealthScoreService:
    """
    Calculates a hybrid Financial Health Score from transaction analytics
    and chatbot-collected financial profile data.
    Persists the result as a HealthScoreSnapshot.
    """

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        profile_repo: FinancialProfileRepository,
        snapshot_repo: HealthScoreSnapshotRepository,
        metrics_service: FinancialMetricsService,
        health_score_service: HealthScoreService,
    ) -> None:
        self._txn_repo = transaction_repo
        self._profile_repo = profile_repo
        self._snapshot_repo = snapshot_repo
        self._metrics_svc = metrics_service
        self._health_score_service = health_score_service

    async def calculate_and_save(self, user_id: UUID) -> HealthScoreSnapshotResponse:
        """
        Run the full hybrid scoring engine and persist the snapshot.
        Raises ValidationException if transactions missing or profile incomplete.
        """
        # Load metrics from transactions
        metrics = await self._metrics_svc.get_metrics(user_id)
        if metrics.transaction_count == 0:
            raise ValidationException(
                "Upload and accept a bank statement before generating Health Score."
            )

        # Load profile
        profile = await self._profile_repo.get_by_user_id(user_id)
        if not profile or profile.profile_completion_percentage < 100.0:
            raise ValidationException(
                "Complete Financial Profile to generate your Final Hybrid Health Score."
            )

        # 1. Compute bank_statement_score from existing transaction analysis.
        legacy_score = self._health_score_service.calculate_health_score(metrics)
        bank_statement_score = float(legacy_score.score)

        # 2. Compute profile_score from financial profile/chatbot data.
        profile_savings = 5.0
        monthly_income = float(profile.monthly_income) if profile.monthly_income else 0.0
        monthly_investment = float(profile.monthly_investment) if profile.monthly_investment else 0.0
        if monthly_income > 0:
            ratio = monthly_investment / monthly_income
            if ratio >= 0.20:
                profile_savings = 25.0
            elif ratio >= 0.10:
                profile_savings = 20.0
            elif ratio >= 0.05:
                profile_savings = 15.0
            elif ratio > 0:
                profile_savings = 10.0

        dependents = profile.dependents_count if profile.dependents_count is not None else 0
        if dependents == 0:
            profile_spending = 20.0
        elif dependents <= 2:
            profile_spending = 16.0
        elif dependents <= 4:
            profile_spending = 12.0
        else:
            profile_spending = 8.0

        profile_debt = 10.0
        if profile.has_loans is False:
            profile_debt = 20.0
        elif profile.monthly_emi and profile.monthly_income and float(profile.monthly_income) > 0:
            emi_ratio = float(profile.monthly_emi) / float(profile.monthly_income)
            if emi_ratio <= 0.10:
                profile_debt = 20.0
            elif emi_ratio <= 0.20:
                profile_debt = 16.0
            elif emi_ratio <= 0.35:
                profile_debt = 10.0
            elif emi_ratio <= 0.50:
                profile_debt = 5.0
            else:
                profile_debt = 0.0

        months = float(profile.emergency_fund_months) if profile.emergency_fund_months is not None else 0.0
        profile_emergency = 0.0
        if months >= 9:
            profile_emergency += 10.0
        elif months >= 6:
            profile_emergency += 8.0
        elif months >= 3:
            profile_emergency += 5.0
        elif months >= 1:
            profile_emergency += 2.0

        if profile.has_health_insurance:
            profile_emergency += 3.0
        if profile.has_life_insurance:
            profile_emergency += 2.0
        profile_emergency = min(15.0, profile_emergency)

        stability_map = {
            "very_stable": 10.0,
            "stable": 8.0,
            "variable": 5.0,
            "irregular": 2.0,
        }
        profile_stability = stability_map.get(profile.income_stability, 5.0)

        profile_investment = 0.0
        if monthly_income > 0:
            inv_rate = monthly_investment / monthly_income
            if inv_rate >= 0.20:
                profile_investment += 7.0
            elif inv_rate >= 0.10:
                profile_investment += 5.0
            elif inv_rate >= 0.05:
                profile_investment += 3.0
            elif inv_rate > 0:
                profile_investment += 1.5

        inv_types = profile.investment_types
        if inv_types:
            if len(inv_types) >= 3:
                profile_investment += 3.0
            elif len(inv_types) == 2:
                profile_investment += 2.0
            elif len(inv_types) == 1:
                profile_investment += 1.0
        profile_investment = min(10.0, profile_investment)

        profile_score = profile_savings + profile_spending + profile_debt + profile_emergency + profile_stability + profile_investment
        profile_score = max(0.0, min(100.0, profile_score))

        # 3. Final combined score: 60% Bank Statement Score + 40% Financial Profile Score
        final_score = round((bank_statement_score * 0.60) + (profile_score * 0.40), 1)

        # Compute component scores
        bank_savings = float(legacy_score.breakdown.savings_rate)
        bank_spending = float(legacy_score.breakdown.expense_ratio)
        bank_debt = float(_score_debt_burden(metrics, None))
        bank_emergency = float(_score_emergency_preparedness(metrics, None))
        bank_stability = float(legacy_score.breakdown.income_stability)
        bank_investment = float(_score_investment_readiness(metrics, None))

        cash_flow = round(bank_savings * 0.60 + profile_savings * 0.40, 1)
        spending = round(bank_spending * 0.60 + profile_spending * 0.40, 1)
        debt = round(bank_debt * 0.60 + profile_debt * 0.40, 1)
        emergency = round(bank_emergency * 0.60 + profile_emergency * 0.40, 1)
        stability = round(bank_stability * 0.60 + profile_stability * 0.40, 1)
        investment = round(bank_investment * 0.60 + profile_investment * 0.40, 1)

        band = _score_to_band(final_score)
        risk_profile = _determine_risk_profile(profile, debt, emergency)

        component_scores = ComponentScores(
            cash_flow_score=cash_flow,
            savings_score=cash_flow,
            spending_score=spending,
            debt_burden_score=debt,
            emergency_score=emergency,
            income_stability_score=stability,
            investment_readiness_score=investment,
        )

        positive = _build_positive_factors(metrics, profile, component_scores)
        negative = _build_negative_factors(metrics, profile, component_scores)
        suggestions = _build_suggestions(metrics, profile, component_scores, risk_profile)

        # 5. Store both component scores in calculation_metadata
        metadata = {
            "transaction_count": metrics.transaction_count,
            "total_income": str(metrics.total_income),
            "total_expenses": str(metrics.total_expenses),
            "savings_rate": str(metrics.savings_rate),
            "income_months_count": metrics.income_months_count,
            "profile_completion": float(profile.profile_completion_percentage),
            "bank_statement_score": bank_statement_score,
            "financial_profile_score": profile_score,
            "bank_statement_weight": 60,
            "profile_weight": 40,
            "component_raw": {
                "cash_flow": cash_flow,
                "spending": spending,
                "debt": debt,
                "emergency": emergency,
                "stability": stability,
                "investment": investment,
            },
        }

        # 4. Store in health_score_snapshots as final score.
        snapshot_data = {
            "user_id": user_id,
            "financial_profile_id": profile.id,
            "score": round(Decimal(str(final_score)), 2),
            "band": band,
            "risk_profile": risk_profile,
            "cash_flow_score": round(Decimal(str(cash_flow)), 2),
            "savings_score": round(Decimal(str(cash_flow)), 2),
            "spending_score": round(Decimal(str(spending)), 2),
            "debt_burden_score": round(Decimal(str(debt)), 2),
            "emergency_score": round(Decimal(str(emergency)), 2),
            "income_stability_score": round(Decimal(str(stability)), 2),
            "investment_readiness_score": round(Decimal(str(investment)), 2),
            "positive_factors": positive,
            "negative_factors": negative,
            "suggestions": suggestions,
            "calculation_metadata": metadata,
        }

        snapshot = await self._snapshot_repo.save_snapshot(snapshot_data)

        logger.info(
            "Hybrid health score calculated",
            extra={
                "user_id": str(user_id),
                "score": final_score,
                "band": band,
                "risk_profile": risk_profile,
            },
        )

        return HealthScoreSnapshotResponse(
            id=snapshot.id,
            user_id=snapshot.user_id,
            financial_profile_id=snapshot.financial_profile_id,
            score=snapshot.score,
            band=snapshot.band,
            risk_profile=snapshot.risk_profile,
            component_scores=component_scores,
            positive_factors=positive,
            negative_factors=negative,
            suggestions=suggestions,
            calculation_metadata=metadata,
            created_at=snapshot.created_at,
        )

    async def get_latest_snapshot(self, user_id: UUID) -> HealthScoreSnapshotResponse:
        """Return the most recent persisted snapshot, raising 404 if none exists."""
        snapshot = await self._snapshot_repo.get_latest_by_user(user_id)
        if snapshot is None:
            raise NotFoundException(
                "No health score calculated yet. "
                "Complete your financial profile and click Generate Health Score."
            )

        cs = ComponentScores(
            cash_flow_score=float(snapshot.cash_flow_score or 0),
            savings_score=float(snapshot.savings_score or 0),
            spending_score=float(snapshot.spending_score or 0),
            debt_burden_score=float(snapshot.debt_burden_score or 0),
            emergency_score=float(snapshot.emergency_score or 0),
            income_stability_score=float(snapshot.income_stability_score or 0),
            investment_readiness_score=float(snapshot.investment_readiness_score or 0),
        )

        return HealthScoreSnapshotResponse(
            id=snapshot.id,
            user_id=snapshot.user_id,
            financial_profile_id=snapshot.financial_profile_id,
            score=snapshot.score,
            band=snapshot.band,
            risk_profile=snapshot.risk_profile,
            component_scores=cs,
            positive_factors=snapshot.positive_factors or [],
            negative_factors=snapshot.negative_factors or [],
            suggestions=snapshot.suggestions or [],
            calculation_metadata=snapshot.calculation_metadata,
            created_at=snapshot.created_at,
        )
