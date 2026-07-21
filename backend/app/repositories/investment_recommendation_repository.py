"""
WealthWise AI - Investment Recommendation Repository
"""
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.investment_recommendation_snapshot import InvestmentRecommendationSnapshot
from app.repositories.base_repository import BaseRepository


class InvestmentRecommendationRepository(BaseRepository[InvestmentRecommendationSnapshot]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(InvestmentRecommendationSnapshot, db)

    async def save_snapshot(self, data: dict) -> InvestmentRecommendationSnapshot:
        """Persist a new investment recommendation snapshot row."""
        return await self.create(data)

    async def get_latest_by_user(
        self, user_id: UUID
    ) -> Optional[InvestmentRecommendationSnapshot]:
        """Return the most recently calculated recommendation for a user."""
        stmt = (
            select(InvestmentRecommendationSnapshot)
            .where(InvestmentRecommendationSnapshot.user_id == user_id)
            .order_by(InvestmentRecommendationSnapshot.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_history(
        self, user_id: UUID, limit: int = 10
    ) -> Sequence[InvestmentRecommendationSnapshot]:
        """Return paginated history of recommendations for a user."""
        stmt = (
            select(InvestmentRecommendationSnapshot)
            .where(InvestmentRecommendationSnapshot.user_id == user_id)
            .order_by(InvestmentRecommendationSnapshot.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
