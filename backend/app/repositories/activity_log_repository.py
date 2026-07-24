"""WealthWise AI - Activity Log Repository"""

from datetime import datetime
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity_log import ActivityLog
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class ActivityLogRepository(BaseRepository[ActivityLog]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(ActivityLog, db)

    async def create_log(
        self,
        *,
        user_id: UUID,
        activity_type: str,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> ActivityLog:
        return await self.create(
            {
                "user_id": user_id,
                "activity_type": activity_type,
                "description": description,
                "metadata_json": metadata,
            }
        )

    async def list_logs(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        user_id: UUID | None = None,
        activity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> Sequence[ActivityLog]:
        stmt = (
            select(ActivityLog)
            .options(selectinload(ActivityLog.user).selectinload(User.role))
            .order_by(ActivityLog.created_at.desc())
        )
        if user_id:
            stmt = stmt.where(ActivityLog.user_id == user_id)
        if activity_type:
            stmt = stmt.where(ActivityLog.activity_type == activity_type)
        if date_from:
            stmt = stmt.where(ActivityLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(ActivityLog.created_at <= date_to)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_logs(
        self,
        *,
        user_id: UUID | None = None,
        activity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ActivityLog)
        if user_id:
            stmt = stmt.where(ActivityLog.user_id == user_id)
        if activity_type:
            stmt = stmt.where(ActivityLog.activity_type == activity_type)
        if date_from:
            stmt = stmt.where(ActivityLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(ActivityLog.created_at <= date_to)
        result = await self.db.execute(stmt)
        return result.scalar_one()
