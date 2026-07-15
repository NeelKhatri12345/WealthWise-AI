"""WealthWise AI - Unit Tests for HealthScoreService and FinancialMetricsService"""

from decimal import Decimal
from typing import List
from uuid import uuid4

import pytest

from app.schemas.financial_metrics_schema import FinancialMetrics
from app.services.health_recommendations import HealthScoreRecommendationsGenerator
from app.services.health_score_service import HealthScoreService


@pytest.fixture
def recommendations_generator() -> HealthScoreRecommendationsGenerator:
    return HealthScoreRecommendationsGenerator()


@pytest.fixture
def health_score_service(
    recommendations_generator: HealthScoreRecommendationsGenerator,
) -> HealthScoreService:
    return HealthScoreService(recommendations_gen=recommendations_generator)


def test_calculate_health_score_single_month_limited_data(
    health_score_service: HealthScoreService,
):
    """Test health score calculation with only a single month of data.

    Should award full scores for Income Stability and Financial Discipline
    with appropriate notes, and handle other categories deterministically.
    """
    metrics = FinancialMetrics(
        total_income=Decimal("100000.0"),
        total_expenses=Decimal("60000.0"),
        net_cash_flow=Decimal("40000.0"),
        savings_rate=Decimal("40.0"),  # Savings rate >= 30% -> 25 points
        transaction_count=10,
        credit_count=2,
        debit_count=8,
        avg_transaction_amount=Decimal("10000.0"),
        largest_credit=Decimal("50000.0"),
        largest_debit=Decimal("15000.0"),
        top_spending_category="Shopping",
        top_spending_category_ratio=Decimal("0.35"),  # ratio <= 40% -> 15 points
        top_income_category="Salary",
        spending_categories_count=4,  # 3-4 categories -> 3 points
        income_months_count=1,  # <= 1 month of data -> 10 points (Income Stability)
        income_coefficient_of_variation=None,
    )

    # 1. Savings Rate: 40% >= 30% -> 25 pts
    # 2. Expense-to-Income: 60% <= 60% -> 20 pts
    # 3. Cash Flow: Positive (40000.0 > 0) -> 15 pts
    # 4. Spending Behaviour: 35% <= 40% -> 15 pts
    # 5. Income Stability: Single month -> 10 pts
    # 6. Transaction Diversity: 4 categories -> 3 pts
    # 7. Financial Discipline: Single month (< 3 months) -> 10 pts
    # Total Score = 25 + 20 + 15 + 15 + 10 + 3 + 10 = 98 -> Grade A+, Status Excellent

    result = health_score_service.calculate_health_score(metrics)

    assert result.score == 98
    assert result.grade == "A+"
    assert result.status == "Excellent"
    assert result.breakdown.savings_rate == 25
    assert result.breakdown.expense_ratio == 20
    assert result.breakdown.cash_flow == 15
    assert result.breakdown.spending_behaviour == 15
    assert result.breakdown.income_stability == 10
    assert result.breakdown.transaction_diversity == 3
    assert result.breakdown.financial_discipline == 10

    # Verify warnings notes are generated
    assert "Note: Insufficient historical data." in result.notes
    assert (
        "Note: Additional transaction history would improve accuracy." in result.notes
    )


def test_calculate_health_score_poor_financials_multi_month(
    health_score_service: HealthScoreService,
):
    """Test scoring for multi-month scenario with negative savings rate and high expense ratio."""
    metrics = FinancialMetrics(
        total_income=Decimal("50000.0"),
        total_expenses=Decimal("75000.0"),
        net_cash_flow=Decimal("-25000.0"),
        savings_rate=Decimal("-50.0"),  # Negative savings -> 0 points
        transaction_count=25,
        credit_count=3,
        debit_count=22,
        avg_transaction_amount=Decimal("5000.0"),
        largest_credit=Decimal("20000.0"),
        largest_debit=Decimal("30000.0"),
        top_spending_category="Rent",
        top_spending_category_ratio=Decimal("0.65"),  # ratio > 60% -> 5 points
        top_income_category="Freelance",
        spending_categories_count=2,  # < 3 categories -> 1 point
        income_months_count=3,  # Multi-month
        income_coefficient_of_variation=Decimal("0.55"),  # CV > 0.40 -> 4 points
    )

    # 1. Savings Rate: -50.0% < 0 -> 0 pts
    # 2. Expense-to-Income: 150% > 100% -> 0 pts
    # 3. Cash Flow: Strongly negative (-25000.0) -> 0 pts
    # 4. Spending Behaviour: 65% > 60% -> 5 pts
    # 5. Income Stability: CV = 0.55 > 0.40 -> 4 pts
    # 6. Transaction Diversity: 2 categories -> 1 pt
    # 7. Financial Discipline: >= 3 months, net cash flow <= 0, CV > 0.15, ratio > 0.40 -> 0 pts
    # Total Score = 0 + 0 + 0 + 5 + 4 + 1 + 0 = 10 -> Grade F, Status Poor

    result = health_score_service.calculate_health_score(metrics)

    assert result.score == 10
    assert result.grade == "F"
    assert result.status == "Poor"
    assert result.breakdown.savings_rate == 0
    assert result.breakdown.expense_ratio == 0
    assert result.breakdown.cash_flow == 0
    assert result.breakdown.spending_behaviour == 5
    assert result.breakdown.income_stability == 4
    assert result.breakdown.transaction_diversity == 1
    assert result.breakdown.financial_discipline == 0


def test_calculate_health_score_missing_category_info(
    health_score_service: HealthScoreService,
):
    """Test Spending Behaviour fallback when category info is unavailable."""
    metrics = FinancialMetrics(
        total_income=Decimal("80000.0"),
        total_expenses=Decimal("40000.0"),
        net_cash_flow=Decimal("40000.0"),
        savings_rate=Decimal("50.0"),
        transaction_count=5,
        credit_count=2,
        debit_count=3,
        avg_transaction_amount=Decimal("16000.0"),
        largest_credit=Decimal("40000.0"),
        largest_debit=Decimal("20000.0"),
        top_spending_category=None,  # Missing category info
        top_spending_category_ratio=None,
        top_income_category="Salary",
        spending_categories_count=0,
        income_months_count=3,
        income_coefficient_of_variation=Decimal("0.05"),  # CV <= 0.15 -> 10 points
    )

    result = health_score_service.calculate_health_score(metrics)

    # Spending behaviour should receive full score (15) and record warning note
    assert result.breakdown.spending_behaviour == 15
    assert "Note: Insufficient category information." in result.notes


def test_recommendation_and_strength_generation(
    health_score_service: HealthScoreService,
):
    """Verify that strengths and recommendations adapt dynamically to metrics."""
    metrics_good = FinancialMetrics(
        total_income=Decimal("200000.0"),
        total_expenses=Decimal("80000.0"),
        net_cash_flow=Decimal("120000.0"),
        savings_rate=Decimal("60.0"),
        transaction_count=30,
        credit_count=5,
        debit_count=25,
        avg_transaction_amount=Decimal("9333.33"),
        largest_credit=Decimal("50000.0"),
        largest_debit=Decimal("10000.0"),
        top_spending_category="Shopping",
        top_spending_category_ratio=Decimal("0.20"),
        top_income_category="Salary",
        spending_categories_count=6,
        income_months_count=3,
        income_coefficient_of_variation=Decimal("0.05"),
    )

    result_good = health_score_service.calculate_health_score(metrics_good)

    # Strengths should be populated
    assert "Healthy savings rate" in result_good.strengths
    assert "Positive cash flow" in result_good.strengths
    assert "Low expense ratio" in result_good.strengths
    assert "Balanced spending" in result_good.strengths
    assert "Consistent income" in result_good.strengths

    # Recommendations should have fallback
    assert "Maintain your current financial discipline." in result_good.recommendations

    # Test underperforming scenario
    metrics_poor = FinancialMetrics(
        total_income=Decimal("10000.0"),
        total_expenses=Decimal("15000.0"),
        net_cash_flow=Decimal("-5000.0"),
        savings_rate=Decimal("-50.0"),
        transaction_count=5,
        credit_count=1,
        debit_count=4,
        avg_transaction_amount=Decimal("5000.0"),
        largest_credit=Decimal("10000.0"),
        largest_debit=Decimal("12000.0"),
        top_spending_category="Dining Out",
        top_spending_category_ratio=Decimal("0.80"),
        top_income_category="Salary",
        spending_categories_count=1,
        income_months_count=1,
        income_coefficient_of_variation=None,
    )

    result_poor = health_score_service.calculate_health_score(metrics_poor)

    # Recommendations should suggest actionable steps
    assert "Build an emergency fund." in result_poor.recommendations
    assert "Increase monthly savings." in result_poor.recommendations
    assert "Reduce discretionary spending." in result_poor.recommendations
    assert "Diversify spending." in result_poor.recommendations
