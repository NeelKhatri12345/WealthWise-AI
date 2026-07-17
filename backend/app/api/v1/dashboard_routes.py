"""WealthWise AI - Dashboard Routes

Provides aggregated dashboard endpoints for the frontend:
- GET /dashboard/summary    → KPI stats
- GET /dashboard/recent-transactions → Latest transactions
- GET /dashboard/insights   → AI-generated insights
- GET /dashboard/notifications → User notifications
"""

from typing import List

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_active_user, get_dashboard_service
from app.schemas.base_schema import APIResponse
from app.schemas.dashboard_schema import (
    DashboardInsightResponse,
    DashboardNotificationResponse,
    DashboardSummaryResponse,
    DashboardTransactionResponse,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get(
    "/summary",
    response_model=APIResponse[DashboardSummaryResponse],
    summary="Get dashboard KPI summary",
)
async def get_dashboard_summary(
    current_user=Depends(get_current_active_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    summary = await service.get_summary(current_user.id)
    return APIResponse(
        success=True, message="Dashboard summary retrieved", data=summary
    )


@router.get(
    "/recent-transactions",
    response_model=APIResponse[List[DashboardTransactionResponse]],
    summary="Get recent transactions for dashboard",
)
async def get_recent_transactions(
    limit: int = Query(default=7, ge=1, le=20),
    current_user=Depends(get_current_active_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    transactions = await service.get_recent_transactions(current_user.id, limit)
    return APIResponse(
        success=True, message="Recent transactions retrieved", data=transactions
    )


@router.get(
    "/insights",
    response_model=APIResponse[List[DashboardInsightResponse]],
    summary="Get AI-powered financial insights",
)
async def get_dashboard_insights(
    current_user=Depends(get_current_active_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    insights = await service.get_insights(current_user.id)
    return APIResponse(
        success=True, message="Dashboard insights retrieved", data=insights
    )


@router.get(
    "/notifications",
    response_model=APIResponse[List[DashboardNotificationResponse]],
    summary="Get dashboard notifications",
)
async def get_dashboard_notifications(
    current_user=Depends(get_current_active_user),
    service: DashboardService = Depends(get_dashboard_service),
):
    notifications = await service.get_notifications(current_user.id)
    return APIResponse(
        success=True, message="Notifications retrieved", data=notifications
    )
