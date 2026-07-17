"""WealthWise AI - Unit Tests for Health Score Tenant Isolation and Incomplete Profiles"""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.exceptions.custom_exceptions import NotFoundException
from app.schemas.financial_metrics_schema import FinancialMetrics
from app.schemas.health_score_schema import HealthScoreBreakdown, HealthScoreDetailResponse
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService


@pytest.mark.asyncio
async def test_analytics_service_blocks_incomplete_profile():
    """Verify that AnalyticsService queries raise NotFoundException for incomplete profiles."""
    user_id = uuid4()
    statement_id = uuid4()

    # Mock dependencies
    analytics_repo = MagicMock()
    # Store a mock DB session on the mock repo
    db_mock = MagicMock()
    analytics_repo.db = db_mock

    metrics_service = AsyncMock()
    health_score_service = MagicMock()

    # Mock profile repository database call
    mock_profile = MagicMock()
    mock_profile.profile_completion_percentage = 40.0  # Incomplete

    execute_result = MagicMock()
    execute_result.scalar_one_or_none = MagicMock(return_value=mock_profile)
    db_mock.execute = AsyncMock(return_value=execute_result)

    service = AnalyticsService(
        analytics_repo=analytics_repo,
        metrics_service=metrics_service,
        health_score_service=health_score_service,
    )

    # 1. get_latest_health_score should raise NotFoundException
    with pytest.raises(NotFoundException) as excinfo:
        await service.get_latest_health_score(user_id)
    assert "Please complete your Financial Profile first" in str(excinfo.value)

    # 2. get_health_score_by_statement should raise NotFoundException
    with pytest.raises(NotFoundException) as excinfo:
        await service.get_health_score_by_statement(user_id, statement_id)
    assert "Please complete your Financial Profile first" in str(excinfo.value)

    # 3. get_health_score_history should return empty list
    history = await service.get_health_score_history(user_id)
    assert history == []


@pytest.mark.asyncio
async def test_dashboard_service_sets_pending_for_incomplete_profile():
    """Verify that DashboardService returns Pending for users with incomplete profiles."""
    user_id = uuid4()

    # Mock repos and services
    txn_repo = AsyncMock()
    analytics_repo = AsyncMock()
    metrics_service = AsyncMock()
    health_score_service = MagicMock()
    snapshot_repo = AsyncMock()
    profile_repo = AsyncMock()

    # Mock profile query (return incomplete profile)
    mock_profile = MagicMock()
    mock_profile.profile_completion_percentage = 80.0  # Incomplete
    profile_repo.get_by_user_id = AsyncMock(return_value=mock_profile)

    # Setup dashboard service with injected profile_repo
    dashboard_service = DashboardService(
        transaction_repo=txn_repo,
        analytics_repo=analytics_repo,
        metrics_service=metrics_service,
        health_score_service=health_score_service,
        snapshot_repo=snapshot_repo,
        profile_repo=profile_repo,
    )

    # Return no snapshot (forces fallback calculation check)
    snapshot_repo.get_latest_by_user = AsyncMock(return_value=None)

    # Mock transaction aggregates and count
    txn_repo.get_monthly_aggregates = AsyncMock(return_value={"rows": []})
    txn_repo.get_by_user_filtered = AsyncMock(return_value=([], 0))
    txn_repo.get_total_aggregates = AsyncMock(return_value={"total_income": Decimal("0"), "total_expenses": Decimal("0")})

    metrics = FinancialMetrics(
        total_income=Decimal("50000"),
        total_expenses=Decimal("30000"),
        net_cash_flow=Decimal("20000"),
        savings_rate=Decimal("40.0"),
        transaction_count=10,
        credit_count=2,
        debit_count=8,
        avg_transaction_amount=Decimal("5000"),
        largest_credit=Decimal("50000"),
        largest_debit=Decimal("15000"),
        top_spending_category="Rent",
        top_spending_category_ratio=Decimal("0.3"),
        top_income_category="Salary",
        spending_categories_count=4,
        income_months_count=1,
        income_coefficient_of_variation=None,
    )
    metrics_service.get_metrics = AsyncMock(return_value=metrics)

    summary = await dashboard_service.get_summary(user_id)

    assert summary.health_score is None
    assert summary.health_score_label == "Pending"


@pytest.mark.asyncio
async def test_dashboard_service_calculates_preliminary_if_profile_complete():
    """Verify that DashboardService returns Preliminary if profile is complete but no snapshot exists."""
    user_id = uuid4()

    # Mock repos and services
    txn_repo = AsyncMock()
    analytics_repo = AsyncMock()
    metrics_service = AsyncMock()
    health_score_service = MagicMock()
    snapshot_repo = AsyncMock()
    profile_repo = AsyncMock()

    # Mock profile query (return complete profile)
    mock_profile = MagicMock()
    mock_profile.profile_completion_percentage = 100.0  # Complete
    profile_repo.get_by_user_id = AsyncMock(return_value=mock_profile)

    # Setup dashboard service with injected profile_repo
    dashboard_service = DashboardService(
        transaction_repo=txn_repo,
        analytics_repo=analytics_repo,
        metrics_service=metrics_service,
        health_score_service=health_score_service,
        snapshot_repo=snapshot_repo,
        profile_repo=profile_repo,
    )

    # Return no snapshot (forces fallback calculation check)
    snapshot_repo.get_latest_by_user = AsyncMock(return_value=None)

    # Mock transaction aggregates and count
    txn_repo.get_monthly_aggregates = AsyncMock(return_value={"rows": []})
    txn_repo.get_by_user_filtered = AsyncMock(return_value=([], 0))
    txn_repo.get_total_aggregates = AsyncMock(return_value={"total_income": Decimal("0"), "total_expenses": Decimal("0")})

    metrics = FinancialMetrics(
        total_income=Decimal("50000"),
        total_expenses=Decimal("30000"),
        net_cash_flow=Decimal("20000"),
        savings_rate=Decimal("40.0"),
        transaction_count=10,
        credit_count=2,
        debit_count=8,
        avg_transaction_amount=Decimal("5000"),
        largest_credit=Decimal("50000"),
        largest_debit=Decimal("15000"),
        top_spending_category="Rent",
        top_spending_category_ratio=Decimal("0.3"),
        top_income_category="Salary",
        spending_categories_count=4,
        income_months_count=1,
        income_coefficient_of_variation=None,
    )
    metrics_service.get_metrics = AsyncMock(return_value=metrics)

    # Mock health_score_service
    score_breakdown = HealthScoreBreakdown(
        savings_rate=25,
        expense_ratio=20,
        cash_flow=15,
        spending_behaviour=15,
        income_stability=10,
        transaction_diversity=3,
        financial_discipline=10,
    )
    score_detail = HealthScoreDetailResponse(
        score=98,
        grade="A+",
        status="Excellent",
        breakdown=score_breakdown,
        strengths=[],
        recommendations=[],
        notes=[],
    )
    health_score_service.calculate_health_score = MagicMock(return_value=score_detail)

    summary = await dashboard_service.get_summary(user_id)

    assert summary.health_score == Decimal("98")
    assert summary.health_score_label == "Preliminary"
