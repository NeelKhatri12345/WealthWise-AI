"""WealthWise AI - Admin Routes (ADMIN role required)"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_admin_service, get_admin_user
from app.schemas.base_schema import APIResponse
from app.schemas.user_schema import UserResponse
from app.services.admin_service import AdminService

router = APIRouter()


@router.get("/users", response_model=APIResponse[List[UserResponse]], summary="Admin: List all users")
async def list_all_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    role: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    users = await service.get_all_users(skip, limit, role, is_active)
    return APIResponse(success=True, message="Users retrieved", data=users)


@router.get("/users/{user_id}", response_model=APIResponse[UserResponse], summary="Admin: Get user detail")
async def get_user_detail(
    user_id: UUID,
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    user = await service.get_user_detail(user_id)
    return APIResponse(success=True, message="User retrieved", data=user)


@router.patch("/users/{user_id}/status", response_model=APIResponse[UserResponse], summary="Admin: Toggle user active status")
async def toggle_user_status(
    user_id: UUID,
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    user = await service.toggle_user_status(user_id)
    status = "activated" if user.is_active else "deactivated"
    return APIResponse(success=True, message=f"User {status}", data=user)


@router.get("/stats", response_model=APIResponse[dict], summary="Admin: System statistics")
async def get_stats(
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    stats = await service.get_system_stats()
    return APIResponse(success=True, message="Stats retrieved", data=stats)
