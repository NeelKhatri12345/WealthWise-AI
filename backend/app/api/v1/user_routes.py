"""WealthWise AI - User Routes"""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_active_user, get_user_service
from app.schemas.auth_schema import ChangePasswordRequest
from app.schemas.base_schema import APIResponse
from app.schemas.user_schema import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=APIResponse[UserResponse], summary="Get current user profile")
async def get_profile(
    current_user=Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    profile = await service.get_profile(current_user.id)
    return APIResponse(success=True, message="Profile retrieved", data=profile)


@router.patch("/me", response_model=APIResponse[UserResponse], summary="Update current user profile")
async def update_profile(
    data: UserUpdate,
    current_user=Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    updated = await service.update_profile(current_user.id, data)
    return APIResponse(success=True, message="Profile updated", data=updated)


@router.post("/me/change-password", response_model=APIResponse[None], summary="Change password")
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    await service.change_password(current_user.id, data.current_password, data.new_password)
    return APIResponse(success=True, message="Password changed successfully")
