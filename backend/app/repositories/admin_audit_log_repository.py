"""WealthWise AI - Admin Audit Log Repository"""

from datetime import datetime
from typing import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.admin_audit_log import AdminAuditLog
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class AdminAuditLogRepository(BaseRepository[AdminAuditLog]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AdminAuditLog, db)

    async def create_log(
        self,
        *,
        admin_id: UUID,
        action: str,
        target_user_id: UUID | None = None,
        description: str | None = None,
        metadata: dict | None = None,
    ) -> AdminAuditLog:
        return await self.create(
            {
                "admin_id": admin_id,
                "action": action,
                "target_user_id": target_user_id,
                "description": description,
                "metadata_json": metadata,
            }
        )

    async def list_logs(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        admin_id: UUID | None = None,
        action: str | None = None,
        target_user_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> Sequence[AdminAuditLog]:
        stmt = (
            select(AdminAuditLog)
            .options(
                selectinload(AdminAuditLog.admin).selectinload(User.role),
                selectinload(AdminAuditLog.target_user).selectinload(User.role),
            )
            .order_by(AdminAuditLog.created_at.desc())
        )
        if admin_id:
            stmt = stmt.where(AdminAuditLog.admin_id == admin_id)
        if action:
            stmt = stmt.where(AdminAuditLog.action == action)
        if target_user_id:
            stmt = stmt.where(AdminAuditLog.target_user_id == target_user_id)
        if date_from:
            stmt = stmt.where(AdminAuditLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(AdminAuditLog.created_at <= date_to)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_logs(
        self,
        *,
        admin_id: UUID | None = None,
        action: str | None = None,
        target_user_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(AdminAuditLog)
        if admin_id:
            stmt = stmt.where(AdminAuditLog.admin_id == admin_id)
        if action:
            stmt = stmt.where(AdminAuditLog.action == action)
        if target_user_id:
            stmt = stmt.where(AdminAuditLog.target_user_id == target_user_id)
        if date_from:
            stmt = stmt.where(AdminAuditLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(AdminAuditLog.created_at <= date_to)
        result = await self.db.execute(stmt)
        return result.scalar_one()
