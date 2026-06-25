"""WealthWise AI - Risk Profile Routes"""

from typing import List

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (get_analytics_service,
                                   get_current_active_user)
from app.schemas.base_schema import APIResponse
from app.schemas.risk_profile_schema import RiskProfileResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/latest",
    response_model=APIResponse[RiskProfileResponse],
    summary="Get latest risk profile",
)
async def get_latest_risk_profile(
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    profile = await service.get_latest_risk_profile(current_user.id)
    return APIResponse(success=True, message="Risk profile retrieved", data=profile)


@router.get(
    "/history",
    response_model=APIResponse[List[RiskProfileResponse]],
    summary="Get risk profile history",
)
async def get_risk_profile_history(
    limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_active_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    history = await service.get_risk_profile_history(current_user.id, limit)
    return APIResponse(
        success=True, message="Risk profile history retrieved", data=history
    )
