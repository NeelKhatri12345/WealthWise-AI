"""WealthWise AI - Health Score Routes"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_analytics_service, get_current_active_user
from app.schemas.base_schema import APIResponse
from app.schemas.health_score_schema import HealthScoreResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/latest", response_model=APIResponse[HealthScoreResponse], summary="Get latest health score")
async def get_latest_health_score(
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    score = await service.get_latest_health_score(current_user.id)
    return APIResponse(success=True, message="Health score retrieved", data=score)


@router.get("/history", response_model=APIResponse[List[HealthScoreResponse]], summary="Get health score history")
async def get_health_score_history(
    limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    history = await service.get_health_score_history(current_user.id, limit)
    return APIResponse(success=True, message="Health score history retrieved", data=history)


@router.get("/{statement_id}", response_model=APIResponse[HealthScoreResponse], summary="Get health score for a statement")
async def get_health_score_by_statement(
    statement_id: UUID,
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    score = await service.get_health_score_by_statement(current_user.id, statement_id)
    return APIResponse(success=True, message="Health score retrieved", data=score)
