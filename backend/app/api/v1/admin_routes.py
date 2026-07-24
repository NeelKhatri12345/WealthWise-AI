"""WealthWise AI - Admin Routes (ADMIN role required)"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_admin_service, get_admin_user, get_system_monitoring_service
from app.schemas.admin_schema import (
    ActivityLogResponse,
    ActivityTypeOption,
    AdminAnalyticsResponse,
    AdminAuditActionOption,
    AdminAuditLogResponse,
    AdminStatsResponse,
    AdminUserDetailResponse,
    SystemMonitoringResponse,
)
from app.schemas.base_schema import APIResponse
from app.schemas.user_schema import UserResponse
from app.services.admin_service import AdminService
from app.services.system_monitoring_service import SystemMonitoringService

router = APIRouter()


@router.get(
    "/users",
    response_model=APIResponse[List[UserResponse]],
    summary="Admin: List all users",
)
async def list_all_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, min_length=1, max_length=100),
    role: Optional[str] = Query(default=None),
    is_active: Optional[bool] = Query(default=None),
    include_deleted: bool = Query(default=False),
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    users, total = await service.get_all_users(
        skip, limit, role, is_active, search, include_deleted
    )
    return APIResponse(
        success=True,
        message="Users retrieved",
        data=users,
        meta={"total": total, "skip": skip, "limit": limit},
    )


@router.get(
    "/users/{user_id}",
    response_model=APIResponse[AdminUserDetailResponse],
    summary="Admin: Get user detail",
)
async def get_user_detail(
    user_id: UUID,
    admin=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    user = await service.get_user_detail(user_id, admin_id=admin.id)
    return APIResponse(success=True, message="User retrieved", data=user)


@router.patch(
    "/users/{user_id}/status",
    response_model=APIResponse[UserResponse],
    summary="Admin: Toggle user active status",
)
async def toggle_user_status(
    user_id: UUID,
    admin=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    user = await service.toggle_user_status(user_id, admin_id=admin.id)
    status_label = "activated" if user.is_active else "deactivated"
    return APIResponse(success=True, message=f"User {status_label}", data=user)


@router.delete(
    "/users/{user_id}",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Admin: Soft delete user",
)
async def soft_delete_user(
    user_id: UUID,
    admin=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    user = await service.soft_delete_user(user_id, admin_id=admin.id)
    return APIResponse(success=True, message="User deleted", data=user)


@router.get(
    "/stats",
    response_model=APIResponse[AdminStatsResponse],
    summary="Admin: System statistics",
)
async def get_stats(
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    stats = await service.get_system_stats()
    return APIResponse(success=True, message="Stats retrieved", data=stats)


@router.get(
    "/analytics",
    response_model=APIResponse[AdminAnalyticsResponse],
    summary="Admin: Platform analytics",
)
async def get_analytics(
    days: int = Query(default=7, ge=1, le=90),
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    analytics = await service.get_analytics(days=days)
    return APIResponse(success=True, message="Analytics retrieved", data=analytics)


@router.get(
    "/system-monitoring",
    response_model=APIResponse[SystemMonitoringResponse],
    summary="Admin: External service health status",
)
async def get_system_monitoring(
    _=Depends(get_admin_user),
    service: SystemMonitoringService = Depends(get_system_monitoring_service),
):
    status = await service.get_monitoring_status()
    return APIResponse(success=True, message="System monitoring retrieved", data=status)


@router.get(
    "/activity-logs",
    response_model=APIResponse[List[ActivityLogResponse]],
    summary="Admin: List activity logs",
)
async def list_activity_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: Optional[UUID] = Query(default=None),
    activity_type: Optional[str] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    logs, total = await service.get_activity_logs(
        skip=skip,
        limit=limit,
        user_id=user_id,
        activity_type=activity_type,
        date_from=date_from,
        date_to=date_to,
    )
    return APIResponse(
        success=True,
        message="Activity logs retrieved",
        data=logs,
        meta={"total": total, "skip": skip, "limit": limit},
    )


@router.get(
    "/activity-logs/types",
    response_model=APIResponse[List[ActivityTypeOption]],
    summary="Admin: Activity type filter options",
)
async def list_activity_types(
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    types = service.get_activity_types()
    return APIResponse(success=True, message="Activity types retrieved", data=types)


@router.get(
    "/audit-logs",
    response_model=APIResponse[List[AdminAuditLogResponse]],
    summary="Admin: List admin audit logs",
)
async def list_audit_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    admin_id: Optional[UUID] = Query(default=None),
    action: Optional[str] = Query(default=None),
    target_user_id: Optional[UUID] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    logs, total = await service.get_audit_logs(
        skip=skip,
        limit=limit,
        admin_id=admin_id,
        action=action,
        target_user_id=target_user_id,
        date_from=date_from,
        date_to=date_to,
    )
    return APIResponse(
        success=True,
        message="Audit logs retrieved",
        data=logs,
        meta={"total": total, "skip": skip, "limit": limit},
    )


@router.get(
    "/audit-logs/actions",
    response_model=APIResponse[List[AdminAuditActionOption]],
    summary="Admin: Audit action filter options",
)
async def list_audit_actions(
    _=Depends(get_admin_user),
    service: AdminService = Depends(get_admin_service),
):
    actions = service.get_audit_actions()
    return APIResponse(success=True, message="Audit actions retrieved", data=actions)
