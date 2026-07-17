"""WealthWise AI - Portfolio Holding Repository"""

from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio_holding import PortfolioHolding
from app.repositories.base_repository import BaseRepository


class PortfolioHoldingRepository(BaseRepository[PortfolioHolding]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(PortfolioHolding, db)

    async def get_by_user(self, user_id: UUID) -> Sequence[PortfolioHolding]:
        stmt = (
            select(PortfolioHolding)
            .where(PortfolioHolding.user_id == user_id)
            .order_by(PortfolioHolding.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_id_and_user(
        self,
        holding_id: UUID,
        user_id: UUID,
    ) -> Optional[PortfolioHolding]:
        """Security-scoped fetch — ensures the holding belongs to the requesting user."""
        stmt = select(PortfolioHolding).where(
            PortfolioHolding.id == holding_id,
            PortfolioHolding.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
