"""WealthWise AI - Financial Health Recommendations Engine"""

from decimal import Decimal
from typing import List

from app.schemas.financial_metrics_schema import FinancialMetrics


class HealthScoreRecommendationsGenerator:
    """Generates dynamic strengths and recommendations based on financial metrics."""

    @staticmethod
    def get_strengths(metrics: FinancialMetrics) -> List[str]:
        """Determine financial strengths from computed metrics."""
        strengths = []

        # 1. Savings Rate
        if metrics.savings_rate >= Decimal("20.0"):
            strengths.append("Healthy savings rate")

        # 2. Cash Flow
        if metrics.net_cash_flow > Decimal("0.0"):
            strengths.append("Positive cash flow")

        # 3. Expense to Income Ratio
        if metrics.total_income > Decimal("0.0"):
            ratio = metrics.total_expenses / metrics.total_income
            if ratio <= Decimal("0.6"):
                strengths.append("Low expense ratio")

        # 4. Spending Behaviour
        if (
            metrics.top_spending_category_ratio is not None
            and metrics.total_expenses > 0
            and metrics.top_spending_category_ratio <= Decimal("0.4")
        ):
            strengths.append("Balanced spending")

        # 5. Income Stability
        if (
            metrics.income_coefficient_of_variation is not None
            and metrics.income_coefficient_of_variation <= Decimal("0.15")
        ):
            strengths.append("Consistent income")

        # 6. Diversity
        if metrics.spending_categories_count >= 5:
            strengths.append("Diverse spending profile")

        # Fallback if no specific strength is identified
        if not strengths:
            strengths.append("Initial financial assessment completed")

        return strengths

    @staticmethod
    def get_recommendations(metrics: FinancialMetrics) -> List[str]:
        """Determine financial recommendations from computed metrics."""
        recommendations = []

        # 1. Cash Flow / Emergency Fund
        if metrics.net_cash_flow <= Decimal("0.0") or metrics.savings_rate < Decimal("0.0"):
            recommendations.append("Build an emergency fund.")

        # 2. Savings Rate
        if metrics.savings_rate < Decimal("10.0"):
            recommendations.append("Increase monthly savings.")

        # 3. Expense to Income Ratio
        if metrics.total_income > Decimal("0.0"):
            ratio = metrics.total_expenses / metrics.total_income
            if ratio > Decimal("0.75"):
                recommendations.append("Improve expense-to-income ratio.")
        elif metrics.total_expenses > Decimal("0.0"):
            recommendations.append("Improve expense-to-income ratio.")

        # 4. Spending Concentration
        if (
            metrics.top_spending_category_ratio is not None
            and metrics.top_spending_category_ratio > Decimal("0.6")
        ):
            recommendations.append("Reduce discretionary spending.")

        # 5. Spending Diversity
        if metrics.spending_categories_count < 3 and metrics.total_expenses > 0:
            recommendations.append("Diversify spending.")

        # Fallback if no recommendation generated
        if not recommendations:
            recommendations.append("Maintain your current financial discipline.")

        return recommendations
