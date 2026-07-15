"""
WealthWise AI - Health Score Snapshot Repository

Persists and retrieves hybrid health score snapshots from
the health_score_snapshots table.
"""

from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_score_snapshot import HealthScoreSnapshot
from app.repositories.base_repository import BaseRepository


class HealthScoreSnapshotRepository(BaseRepository[HealthScoreSnapshot]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(HealthScoreSnapshot, db)

    async def save_snapshot(self, data: dict[str, Any]) -> HealthScoreSnapshot:
        """Persist a new health score snapshot row."""
        return await self.create(data)

    async def get_latest_by_user(self, user_id: UUID) -> Optional[HealthScoreSnapshot]:
        """Return the most recently calculated snapshot for a user."""
        stmt = (
            select(HealthScoreSnapshot)
            .where(HealthScoreSnapshot.user_id == user_id)
            .order_by(HealthScoreSnapshot.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
