"""WealthWise AI - Unit Tests for InvestmentRecommendationService Month Estimation & Surplus Calculation"""

from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.financial_metrics_schema import FinancialMetrics
from app.services.investment_recommendation_service import InvestmentRecommendationService


@pytest.fixture
def service() -> InvestmentRecommendationService:
    return InvestmentRecommendationService(
        snapshot_repo=AsyncMock(),
        analytics_repo=AsyncMock(),
        profile_repo=AsyncMock(),
        metrics_service=AsyncMock(),
        recommendation_repo=AsyncMock(),
    )


def test_estimate_months_one_month_statement(service: InvestmentRecommendationService):
    """1-month statement should use divisor = 1."""
    metrics = FinancialMetrics(
        total_income=Decimal("100000.0"),
        total_expenses=Decimal("50000.0"),
        net_cash_flow=Decimal("50000.0"),
        savings_rate=Decimal("50.0"),
        transaction_count=20,
        credit_count=2,
        debit_count=18,
        avg_transaction_amount=Decimal("5000.0"),
        largest_credit=Decimal("50000.0"),
        largest_debit=Decimal("10000.0"),
        spending_categories_count=4,
        income_months_count=1,
    )
    divisor = service._estimate_months(metrics)
    assert divisor == 1


def test_estimate_months_three_month_statement(service: InvestmentRecommendationService):
    """3-month statement should use divisor = 3."""
    metrics = FinancialMetrics(
        total_income=Decimal("300000.0"),
        total_expenses=Decimal("150000.0"),
        net_cash_flow=Decimal("150000.0"),
        savings_rate=Decimal("50.0"),
        transaction_count=60,
        credit_count=6,
        debit_count=54,
        avg_transaction_amount=Decimal("5000.0"),
        largest_credit=Decimal("50000.0"),
        largest_debit=Decimal("10000.0"),
        spending_categories_count=5,
        income_months_count=3,
    )
    divisor = service._estimate_months(metrics)
    assert divisor == 3


def test_estimate_months_six_month_statement(service: InvestmentRecommendationService):
    """6-month statement should use divisor = 6."""
    metrics = FinancialMetrics(
        total_income=Decimal("600000.0"),
        total_expenses=Decimal("300000.0"),
        net_cash_flow=Decimal("300000.0"),
        savings_rate=Decimal("50.0"),
        transaction_count=120,
        credit_count=12,
        debit_count=108,
        avg_transaction_amount=Decimal("5000.0"),
        largest_credit=Decimal("50000.0"),
        largest_debit=Decimal("10000.0"),
        spending_categories_count=6,
        income_months_count=6,
    )
    divisor = service._estimate_months(metrics)
    assert divisor == 6


def test_estimate_months_empty_statement(service: InvestmentRecommendationService):
    """Empty statement (no metrics or 0 transaction count) should fallback to divisor = 1."""
    metrics_empty = FinancialMetrics(
        total_income=Decimal("0.0"),
        total_expenses=Decimal("0.0"),
        net_cash_flow=Decimal("0.0"),
        savings_rate=Decimal("0.0"),
        transaction_count=0,
        credit_count=0,
        debit_count=0,
        avg_transaction_amount=Decimal("0.0"),
        largest_credit=Decimal("0.0"),
        largest_debit=Decimal("0.0"),
        spending_categories_count=0,
        income_months_count=0,
    )
    assert service._estimate_months(None) == 1
    assert service._estimate_months(metrics_empty) == 1


def test_estimate_months_no_income_transactions(service: InvestmentRecommendationService):
    """No income transactions (only debits over 1 month date span)."""
    metrics = FinancialMetrics(
        total_income=Decimal("0.0"),
        total_expenses=Decimal("40000.0"),
        net_cash_flow=Decimal("-40000.0"),
        savings_rate=Decimal("-100.0"),
        transaction_count=15,
        credit_count=0,
        debit_count=15,
        avg_transaction_amount=Decimal("2666.67"),
        largest_credit=Decimal("0.0"),
        largest_debit=Decimal("10000.0"),
        spending_categories_count=3,
        income_months_count=1,
    )
    divisor = service._estimate_months(metrics)
    assert divisor == 1


def test_estimate_months_fallback_from_dates(service: InvestmentRecommendationService):
    """When income_months_count is 0, fallback to transaction dates on metrics."""
    txn1 = MagicMock(date=date(2026, 1, 10))
    txn2 = MagicMock(date=date(2026, 2, 15))
    txn3 = MagicMock(date=date(2026, 3, 20))

    metrics = MagicMock()
    metrics.income_months_count = 0
    metrics.transactions = [txn1, txn2, txn3]

    divisor = service._estimate_months(metrics)
    assert divisor == 3


@pytest.mark.asyncio
async def test_monthly_investable_amount_calculation_one_month(service: InvestmentRecommendationService):
    """Verify that monthly_investable_amount is calculated correctly for 1-month statement."""
    user_id = pytest.importorskip("uuid").uuid4()

    # Mock health snapshot
    health_snap = MagicMock()
    health_snap.id = pytest.importorskip("uuid").uuid4()
    health_snap.score = 75.0  # buffer_pct = 0.10
    health_snap.health_score = 75.0
    health_snap.band = "GOOD"
    health_snap.risk_profile = "MODERATE"
    service._snapshot_repo.get_latest_by_user.return_value = health_snap

    # Mock profile
    profile = MagicMock()
    profile.monthly_income = Decimal("100000.0")
    profile.monthly_emi = Decimal("10000.0")
    profile.emergency_fund_months = 6.0
    profile.has_emergency_fund = True
    profile.employment_type = "salaried"
    profile.income_stability = "stable"
    profile.total_debt = 0.0
    profile.age_range = "26-35"
    profile.financial_goals = ["wealth_building"]
    service._profile_repo.get_by_user_id.return_value = profile

    # Mock metrics (1 month statement with 100k income, 50k expenses)
    metrics = FinancialMetrics(
        total_income=Decimal("100000.0"),
        total_expenses=Decimal("50000.0"),
        net_cash_flow=Decimal("50000.0"),
        savings_rate=Decimal("50.0"),
        transaction_count=20,
        credit_count=2,
        debit_count=18,
        avg_transaction_amount=Decimal("5000.0"),
        largest_credit=Decimal("50000.0"),
        largest_debit=Decimal("10000.0"),
        spending_categories_count=4,
        income_months_count=1,
    )
    service._metrics.get_metrics.return_value = metrics

    mock_saved_snapshot = MagicMock()
    mock_saved_snapshot.id = pytest.importorskip("uuid").uuid4()
    mock_saved_snapshot.user_id = user_id
    mock_saved_snapshot.health_score_snapshot_id = health_snap.id
    mock_saved_snapshot.risk_profile_snapshot_id = None
    mock_saved_snapshot.investment_readiness = "READY"
    mock_saved_snapshot.investment_readiness_score = Decimal("85.0")
    mock_saved_snapshot.recommended_strategy = "balanced"
    mock_saved_snapshot.monthly_investable_amount = Decimal("30000.0")
    mock_saved_snapshot.allocation_json = []
    mock_saved_snapshot.reasoning_json = {}
    mock_saved_snapshot.warnings_json = []
    mock_saved_snapshot.action_plan_json = {}
    mock_saved_snapshot.metadata_json = {}
    mock_saved_snapshot.created_at = pytest.importorskip("datetime").datetime.now()

    service._rec_repo.save_snapshot = AsyncMock(return_value=mock_saved_snapshot)

    result = await service.calculate(user_id=user_id)

    # 100,000 income - 50,000 expenses - 10,000 emi - 10,000 (10% safety buffer) = 30,000 investable
    assert result is not None
    save_call_arg = service._rec_repo.save_snapshot.call_args[0][0]
    assert save_call_arg["monthly_investable_amount"] == Decimal("30000.0")
