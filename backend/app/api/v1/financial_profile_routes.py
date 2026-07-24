"""
WealthWise AI - Financial Profile Routes

Endpoints:
  GET   /api/v1/financial-profile  — Get the current user's financial profile
  PATCH /api/v1/financial-profile  — Update profile fields directly
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.dependencies import (
    get_current_active_user,
    get_activity_log_service,
    get_financial_profile_service,
)
from app.enums.activity_type_enum import ActivityTypeEnum
from app.schemas.base_schema import APIResponse
from app.schemas.financial_profile_schema import (
    FinancialProfileResponse,
    FinancialProfileUpdate,
)
from app.services.financial_profile_service import FinancialProfileService
from app.services.activity_log_service import ActivityLogService

router = APIRouter()


@router.get(
    "",
    response_model=APIResponse[FinancialProfileResponse],
    summary="Get the authenticated user's financial profile",
    description=(
        "Returns the structured financial profile collected through the chatbot. "
        "Returns null data if the profile has not been started yet."
    ),
)
async def get_financial_profile(
    current_user=Depends(get_current_active_user),
    service: FinancialProfileService = Depends(get_financial_profile_service),
):
    profile = await service.get_profile(current_user.id)
    return APIResponse(
        success=True,
        message="Financial profile retrieved" if profile else "No profile created yet",
        data=profile,
    )


@router.patch(
    "",
    response_model=APIResponse[FinancialProfileResponse],
    summary="Update financial profile fields",
    description=(
        "Directly updates one or more financial profile fields. "
        "All fields are optional — only provided fields are changed. "
        "profile_completion_percentage is recalculated automatically."
    ),
)
async def patch_financial_profile(
    body: FinancialProfileUpdate,
    current_user=Depends(get_current_active_user),
    service: FinancialProfileService = Depends(get_financial_profile_service),
    activity_log: ActivityLogService = Depends(get_activity_log_service),
):
    profile = await service.patch_profile(
        user_id=current_user.id, data=body
    )
    await activity_log.log(
        user_id=current_user.id,
        activity_type=ActivityTypeEnum.PROFILE_UPDATE,
        description="Updated financial profile",
        metadata={
            "completion_pct": profile.profile_completion_percentage if profile else None,
        },
    )
    return APIResponse(
        success=True,
        message="Financial profile updated",
        data=profile,
    )
