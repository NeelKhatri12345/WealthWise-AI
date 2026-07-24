"""WealthWise AI - Activity Log Service"""

from datetime import datetime
from uuid import UUID

from app.enums.activity_type_enum import ActivityTypeEnum
from app.repositories.activity_log_repository import ActivityLogRepository
from app.schemas.admin_schema import ActivityLogResponse


class ActivityLogService:

    def __init__(self, repo: ActivityLogRepository) -> None:
        self._repo = repo

    async def log(
        self,
        *,
        user_id: UUID,
        activity_type: ActivityTypeEnum,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        await self._repo.create_log(
            user_id=user_id,
            activity_type=activity_type.value,
            description=description,
            metadata=metadata,
        )

    async def get_logs(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        user_id: UUID | None = None,
        activity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[ActivityLogResponse], int]:
        logs = await self._repo.list_logs(
            skip=skip,
            limit=limit,
            user_id=user_id,
            activity_type=activity_type,
            date_from=date_from,
            date_to=date_to,
        )
        total = await self._repo.count_logs(
            user_id=user_id,
            activity_type=activity_type,
            date_from=date_from,
            date_to=date_to,
        )
        return [ActivityLogResponse.from_orm(log) for log in logs], total

    @staticmethod
    def activity_type_labels() -> list[dict[str, str]]:
        labels = {
            ActivityTypeEnum.LOGIN: "Login",
            ActivityTypeEnum.LOGOUT: "Logout",
            ActivityTypeEnum.STATEMENT_UPLOAD: "Statement Upload",
            ActivityTypeEnum.INVESTMENT_PLAN_GENERATION: "Investment Plan Generation",
            ActivityTypeEnum.AI_CHAT: "AI Chat",
            ActivityTypeEnum.PROFILE_UPDATE: "Profile Update",
        }
        return [
            {"value": activity.value, "label": labels[activity]}
            for activity in ActivityTypeEnum
        ]
