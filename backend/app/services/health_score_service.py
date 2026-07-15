"""WealthWise AI - Financial Health Score Service"""

from decimal import Decimal
from typing import Optional

from app.core import constants
from app.schemas.financial_metrics_schema import FinancialMetrics
from app.schemas.health_score_schema import (
    HealthScoreBreakdown,
    HealthScoreDetailResponse,
)
from app.services.health_recommendations import HealthScoreRecommendationsGenerator


class HealthScoreService:
    """Computes a deterministic, explainable Financial Health Score from FinancialMetrics."""

    def __init__(self, recommendations_gen: HealthScoreRecommendationsGenerator) -> None:
        self._rec_gen = recommendations_gen

    def calculate_health_score(self, metrics: FinancialMetrics) -> HealthScoreDetailResponse:
        """Calculate health score, grade, status, breakdown, strengths, and recommendations."""
        notes = []

        # 1. Savings Rate (25 points)
        savings_rate_score = self._score_savings_rate(metrics.savings_rate)

        # 2. Expense-to-Income Ratio (20 points)
        expense_ratio_score = self._score_expense_ratio(metrics)

        # 3. Cash Flow (15 points)
        cash_flow_score = self._score_cash_flow(metrics)

        # 4. Spending Behaviour (15 points)
        spending_behaviour_score, spending_note = self._score_spending_behaviour(metrics)
        if spending_note:
            notes.append(spending_note)

        # 5. Income Stability (10 points)
        income_stability_score, stability_note = self._score_income_stability(metrics)
        if stability_note:
            notes.append(stability_note)

        # 6. Transaction Diversity (5 points)
        transaction_diversity_score = self._score_transaction_diversity(metrics)

        # 7. Financial Discipline (10 points)
        financial_discipline_score, discipline_note = self._score_financial_discipline(metrics)
        if discipline_note:
            notes.append(discipline_note)

        # Sum breakdown scores
        overall_score = (
            savings_rate_score
            + expense_ratio_score
            + cash_flow_score
            + spending_behaviour_score
            + income_stability_score
            + transaction_diversity_score
            + financial_discipline_score
        )

        # Bounded overall score [0, 100]
        overall_score = max(0, min(100, overall_score))

        # Determine Grade and Status
        grade = self._determine_grade(overall_score)
        status = self._determine_status(overall_score)

        # Generate dynamic strengths & recommendations
        strengths = self._rec_gen.get_strengths(metrics)
        recommendations = self._rec_gen.get_recommendations(metrics)

        breakdown = HealthScoreBreakdown(
            savings_rate=savings_rate_score,
            expense_ratio=expense_ratio_score,
            cash_flow=cash_flow_score,
            spending_behaviour=spending_behaviour_score,
            income_stability=income_stability_score,
            transaction_diversity=transaction_diversity_score,
            financial_discipline=financial_discipline_score,
        )

        return HealthScoreDetailResponse(
            score=overall_score,
            grade=grade,
            status=status,
            breakdown=breakdown,
            strengths=strengths,
            recommendations=recommendations,
            notes=notes,
        )

    # ── Component Scoring Helpers ─────────────────────────────────────────────

    def _score_savings_rate(self, rate: Decimal) -> int:
        """Calculate score for Savings Rate."""
        for threshold, points in constants.HEALTH_SCORE_SAVINGS_RATE_THRESHOLDS:
            if rate >= Decimal(str(threshold)):
                return points
        return 0

    def _score_expense_ratio(self, metrics: FinancialMetrics) -> int:
        """Calculate score for Expense-to-Income Ratio."""
        if metrics.total_income > Decimal("0.0"):
            ratio = (metrics.total_expenses / metrics.total_income) * Decimal("100.0")
        else:
            ratio = Decimal("0.0") if metrics.total_expenses == Decimal("0.0") else Decimal("999.0")

        for threshold, points in constants.HEALTH_SCORE_EXPENSE_RATIO_THRESHOLDS:
            if ratio <= Decimal(str(threshold)):
                return points
        return 0

    def _score_cash_flow(self, metrics: FinancialMetrics) -> int:
        """Calculate score for Cash Flow."""
        if metrics.net_cash_flow > Decimal("0.0"):
            return constants.HEALTH_SCORE_CASH_FLOW_POSITIVE_POINTS
        elif metrics.savings_rate >= Decimal(str(constants.HEALTH_SCORE_CASH_FLOW_SLIGHTLY_NEGATIVE_LIMIT)):
            return constants.HEALTH_SCORE_CASH_FLOW_SLIGHTLY_NEGATIVE_POINTS
        return 0

    def _score_spending_behaviour(self, metrics: FinancialMetrics) -> tuple[int, Optional[str]]:
        """Calculate score for Spending Behaviour using Top Spending Category."""
        if metrics.top_spending_category is None or metrics.total_expenses == Decimal("0.0"):
            return (
                constants.HEALTH_SCORE_SPENDING_BEHAVIOUR_WEIGHT,
                "Note: Insufficient category information.",
            )

        top_cat_pct = float(metrics.top_spending_category_ratio) * 100.0
        for max_pct, points in constants.HEALTH_SCORE_SPENDING_BEHAVIOUR_THRESHOLDS:
            if top_cat_pct <= max_pct:
                return points, None
        return 5, None  # default score if > 60%

    def _score_income_stability(self, metrics: FinancialMetrics) -> tuple[int, Optional[str]]:
        """Calculate score for Income Stability using monthly income variation."""
        if metrics.income_months_count <= 1:
            return (
                constants.HEALTH_SCORE_INCOME_STABILITY_WEIGHT,
                "Note: Insufficient historical data.",
            )

        cv = metrics.income_coefficient_of_variation
        if cv is None:
            return constants.HEALTH_SCORE_INCOME_STABILITY_WEIGHT, None

        float_cv = float(cv)
        for max_cv, points in constants.HEALTH_SCORE_INCOME_STABILITY_THRESHOLDS:
            if float_cv <= max_cv:
                return points, None
        return 4, None  # default score if CV > 0.40

    def _score_transaction_diversity(self, metrics: FinancialMetrics) -> int:
        """Calculate score for Transaction Diversity."""
        for min_cats, points in constants.HEALTH_SCORE_TRANSACTION_DIVERSITY_THRESHOLDS:
            if metrics.spending_categories_count >= min_cats:
                return points
        return 1

    def _score_financial_discipline(self, metrics: FinancialMetrics) -> tuple[int, Optional[str]]:
        """Calculate score for Financial Discipline."""
        if metrics.income_months_count < constants.HEALTH_SCORE_DISCIPLINE_MIN_MONTHS:
            return (
                constants.HEALTH_SCORE_FINANCIAL_DISCIPLINE_WEIGHT,
                "Note: Additional transaction history would improve accuracy.",
            )

        score = 0
        if metrics.net_cash_flow > Decimal("0.0"):
            score += constants.HEALTH_SCORE_DISCIPLINE_CASH_FLOW_BONUS

        if (
            metrics.income_coefficient_of_variation is not None
            and metrics.income_coefficient_of_variation <= Decimal("0.15")
        ):
            score += constants.HEALTH_SCORE_DISCIPLINE_INCOME_STABILITY_BONUS

        if (
            metrics.top_spending_category_ratio is not None
            and metrics.top_spending_category_ratio <= Decimal("0.40")
        ):
            score += constants.HEALTH_SCORE_DISCIPLINE_BALANCED_SPENDING_BONUS

        return score, None

    # ── Mappings ──────────────────────────────────────────────────────────────

    def _determine_grade(self, score: int) -> str:
        """Map score to grade."""
        for threshold, grade in constants.HEALTH_SCORE_GRADING_RULES:
            if score >= threshold:
                return grade
        return "F"

    def _determine_status(self, score: int) -> str:
        """Map score to status."""
        for threshold, status in constants.HEALTH_SCORE_STATUS_RULES:
            if score >= threshold:
                return status
        return "Poor"
