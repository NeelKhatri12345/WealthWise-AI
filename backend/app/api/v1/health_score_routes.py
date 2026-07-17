"""WealthWise AI - Health Score Routes"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import (
    get_analytics_service,
    get_current_active_user,
    get_hybrid_health_score_service,
)
from app.schemas.base_schema import APIResponse
from app.schemas.health_score_schema import HealthScoreDetailResponse
from app.schemas.health_score_snapshot_schema import HealthScoreSnapshotResponse
from app.services.analytics_service import AnalyticsService
from app.services.hybrid_health_score_service import HybridHealthScoreService

router = APIRouter()


@router.get(
    "/latest",
    response_model=APIResponse[HealthScoreDetailResponse],
    summary="Get latest health score",
)
async def get_latest_health_score(
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    score = await service.get_latest_health_score(current_user.id)
    return APIResponse(success=True, message="Health score retrieved", data=score)


@router.get(
    "/history",
    response_model=APIResponse[List[HealthScoreDetailResponse]],
    summary="Get health score history",
)
async def get_health_score_history(
    limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    history = await service.get_health_score_history(current_user.id, limit)
    return APIResponse(
        success=True, message="Health score history retrieved", data=history
    )


# ── NEW: Hybrid score endpoints (Stage 2 implementation) ─────────────────────


@router.post(
    "/calculate",
    response_model=APIResponse[HealthScoreSnapshotResponse],
    summary="Calculate and persist a hybrid health score",
    description=(
        "Runs the deterministic hybrid scoring engine combining transaction analytics "
        "and the chatbot-collected financial profile. Persists the result as a snapshot. "
        "Requires at least one accepted transaction."
    ),
)
async def calculate_health_score_snapshot(
    current_user=Depends(get_current_active_user),
    service: HybridHealthScoreService = Depends(get_hybrid_health_score_service),
):
    result = await service.calculate_and_save(user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Health score calculated and saved",
        data=result,
    )


@router.get(
    "/snapshot/latest",
    response_model=APIResponse[HealthScoreSnapshotResponse],
    summary="Get the latest persisted hybrid health score snapshot",
    description=(
        "Returns the most recently persisted snapshot from POST /calculate. "
        "Returns 404 if no snapshot has been calculated yet."
    ),
)
async def get_latest_snapshot(
    current_user=Depends(get_current_active_user),
    service: HybridHealthScoreService = Depends(get_hybrid_health_score_service),
):
    result = await service.get_latest_snapshot(user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Health score snapshot retrieved",
        data=result,
    )


# ── Existing: Score by statement (unchanged) ──────────────────────────────────


@router.get(
    "/{statement_id}",
    response_model=APIResponse[HealthScoreDetailResponse],
    summary="Get health score for a statement",
)
async def get_health_score_by_statement(
    statement_id: UUID,
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    score = await service.get_health_score_by_statement(current_user.id, statement_id)
    return APIResponse(success=True, message="Health score retrieved", data=score)
