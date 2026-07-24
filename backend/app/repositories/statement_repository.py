"""WealthWise AI - Statement Repository"""

from datetime import datetime
from typing import Any, Optional, Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.statement_status_enum import StatementStatusEnum
from app.models.statement import Statement
from app.repositories.base_repository import BaseRepository


class StatementRepository(BaseRepository[Statement]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Statement, db)

    async def get_by_user(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Statement]:
        stmt = (
            select(Statement)
            .where(Statement.user_id == user_id)
            .order_by(Statement.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_by_user(self, user_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Statement)
            .where(Statement.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_by_id_and_user(
        self,
        statement_id: UUID,
        user_id: UUID,
    ) -> Optional[Statement]:
        """Security-scoped fetch — ensures statement belongs to requesting user."""
        stmt = select(Statement).where(
            Statement.id == statement_id,
            Statement.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(
        self,
        statement: Statement,
        status: StatementStatusEnum,
        error_message: Optional[str] = None,
    ) -> Statement:
        data: dict[str, Any] = {"status": status}
        if error_message is not None:
            data["error_message"] = error_message
        if status == StatementStatusEnum.COMPLETED:
            from datetime import timezone

            data["processed_at"] = datetime.now(timezone.utc)
        return await self.update(statement, data)

    async def update_processing_state(
        self,
        statement: Statement,
        *,
        status: StatementStatusEnum,
        error_message: Optional[str] = None,
        processing_metadata: Optional[dict[str, Any]] = None,
        processing_started_at: Optional[datetime] = None,
        ocr_completed_at: Optional[datetime] = None,
        parsing_started_at: Optional[datetime] = None,
        processed_at: Optional[datetime] = None,
    ) -> Statement:
        """Apply a processing pipeline state change and related timestamps."""
        data: dict[str, Any] = {"status": status}

        if error_message is not None:
            data["error_message"] = error_message
        if processing_metadata is not None:
            data["processing_metadata"] = processing_metadata
        if processing_started_at is not None:
            data["processing_started_at"] = processing_started_at
        if ocr_completed_at is not None:
            data["ocr_completed_at"] = ocr_completed_at
        if parsing_started_at is not None:
            data["parsing_started_at"] = parsing_started_at
        if processed_at is not None:
            data["processed_at"] = processed_at

        return await self.update(statement, data)

    async def get_pending(self) -> Sequence[Statement]:
        """Background processor poll — legacy alias for queued statements."""
        return await self.get_queued_for_processing()

    async def get_queued_for_processing(self) -> Sequence[Statement]:
        """Return statements waiting to enter the processing pipeline."""
        stmt = select(Statement).where(
            Statement.status.in_(StatementStatusEnum.queued_statuses())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
