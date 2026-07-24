"""WealthWise AI - Analytics Repository

Handles persistence and retrieval for:
- HealthScore
- RiskProfile
- Portfolio
- AIConversation
"""

from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_conversation import AIConversation
from app.models.health_score import HealthScore
from app.models.portfolio import Portfolio
from app.models.risk_profile import RiskProfile


class AnalyticsRepository:
    """
    Composite repository for analytics domain.
    Delegates to model-specific helpers internally.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Health Score ──────────────────────────────────────────────────────────

    async def save_health_score(self, data: dict) -> HealthScore:
        instance = HealthScore(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_latest_health_score(self, user_id: UUID) -> Optional[HealthScore]:
        stmt = (
            select(HealthScore)
            .where(HealthScore.user_id == user_id)
            .order_by(HealthScore.calculated_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_health_score_history(
        self, user_id: UUID, limit: int = 10
    ) -> Sequence[HealthScore]:
        stmt = (
            select(HealthScore)
            .where(HealthScore.user_id == user_id)
            .order_by(HealthScore.calculated_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_health_score_by_statement(
        self, user_id: UUID, statement_id: UUID
    ) -> Optional[HealthScore]:
        stmt = select(HealthScore).where(
            HealthScore.user_id == user_id,
            HealthScore.statement_id == statement_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    # ── Risk Profile ──────────────────────────────────────────────────────────

    async def save_risk_profile(self, data: dict) -> RiskProfile:
        instance = RiskProfile(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_latest_risk_profile(self, user_id: UUID) -> Optional[RiskProfile]:
        stmt = (
            select(RiskProfile)
            .where(RiskProfile.user_id == user_id)
            .order_by(RiskProfile.calculated_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_risk_profile_history(
        self, user_id: UUID, limit: int = 10
    ) -> Sequence[RiskProfile]:
        stmt = (
            select(RiskProfile)
            .where(RiskProfile.user_id == user_id)
            .order_by(RiskProfile.calculated_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    # ── Portfolio ─────────────────────────────────────────────────────────────

    async def save_portfolio(self, data: dict) -> Portfolio:
        instance = Portfolio(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_latest_portfolio(self, user_id: UUID) -> Optional[Portfolio]:
        stmt = (
            select(Portfolio)
            .where(Portfolio.user_id == user_id)
            .order_by(Portfolio.generated_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    # ── AI Conversation ───────────────────────────────────────────────────────

    async def save_ai_message(self, data: dict) -> AIConversation:
        instance = AIConversation(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_conversation_history(
        self,
        user_id: UUID,
        session_id: UUID,
        limit: int = 20,
    ) -> Sequence[AIConversation]:
        stmt = (
            select(AIConversation)
            .where(
                AIConversation.user_id == user_id,
                AIConversation.session_id == session_id,
            )
            .order_by(AIConversation.created_at.asc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete_session(self, user_id: UUID, session_id: UUID) -> int:
        """Returns number of messages deleted."""
        stmt = delete(AIConversation).where(
            AIConversation.user_id == user_id,
            AIConversation.session_id == session_id,
        )
        result = await self.db.execute(stmt)
        return result.rowcount
