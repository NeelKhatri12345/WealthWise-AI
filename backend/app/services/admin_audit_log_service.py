"""WealthWise AI - Admin Audit Log Service"""

from datetime import datetime
from uuid import UUID

from app.enums.admin_audit_action_enum import AdminAuditActionEnum
from app.repositories.admin_audit_log_repository import AdminAuditLogRepository
from app.schemas.admin_schema import AdminAuditActionOption, AdminAuditLogResponse


class AdminAuditLogService:

    def __init__(self, repo: AdminAuditLogRepository) -> None:
        self._repo = repo

    async def log(
        self,
        *,
        admin_id: UUID,
        action: AdminAuditActionEnum,
        target_user_id: UUID | None = None,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        await self._repo.create_log(
            admin_id=admin_id,
            action=action.value,
            target_user_id=target_user_id,
            description=description,
            metadata=metadata,
        )

    async def get_logs(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        admin_id: UUID | None = None,
        action: str | None = None,
        target_user_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AdminAuditLogResponse], int]:
        logs = await self._repo.list_logs(
            skip=skip,
            limit=limit,
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            date_from=date_from,
            date_to=date_to,
        )
        total = await self._repo.count_logs(
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            date_from=date_from,
            date_to=date_to,
        )
        return [AdminAuditLogResponse.from_orm(log) for log in logs], total

    @staticmethod
    def action_labels() -> list[dict[str, str]]:
        labels = {
            AdminAuditActionEnum.ADMIN_LOGIN: "Admin Login",
            AdminAuditActionEnum.VIEWED_USER: "Viewed User",
            AdminAuditActionEnum.DISABLED_USER: "Disabled User",
            AdminAuditActionEnum.ENABLED_USER: "Enabled User",
            AdminAuditActionEnum.DELETED_USER: "Deleted User",
        }
        return [
            {"value": action.value, "label": labels[action]}
            for action in AdminAuditActionEnum
        ]

    @staticmethod
    def get_action_options() -> list[AdminAuditActionOption]:
        return [
            AdminAuditActionOption(**item)
            for item in AdminAuditLogService.action_labels()
        ]
