"""
WealthWise AI - Financial Profile Repository

Wraps CRUD operations for the financial_profiles table.
Uses BaseRepository for generic ops; adds upsert + get-by-user.
"""

from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_profile import FinancialProfile
from app.repositories.base_repository import BaseRepository


class FinancialProfileRepository(BaseRepository[FinancialProfile]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(FinancialProfile, db)

    async def get_by_user_id(self, user_id: UUID) -> Optional[FinancialProfile]:
        """Return the financial profile for a user, or None if not yet created."""
        stmt = select(FinancialProfile).where(FinancialProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert(self, user_id: UUID, data: dict[str, Any]) -> FinancialProfile:
        """
        Create a new profile or update all provided fields on the existing one.
        Always returns the up-to-date profile row.
        """
        profile = await self.get_by_user_id(user_id)
        if profile is None:
            profile = await self.create({"user_id": user_id, **data})
        else:
            profile = await self.update(profile, data)
        return profile

    async def update_fields(
        self, user_id: UUID, fields: dict[str, Any]
    ) -> Optional[FinancialProfile]:
        """
        Update specific fields on an existing profile.
        Returns None if the profile does not yet exist.
        """
        profile = await self.get_by_user_id(user_id)
        if profile is None:
            return None
        return await self.update(profile, fields)

    async def reset(self, user_id: UUID) -> Optional[FinancialProfile]:
        """Wipe all chat-derived fields and reset completion to 0%.

        The profile row itself is kept — deleting it would break FK references
        held by health-score snapshots and investment recommendations.
        Called exclusively by the retake-assessment flow.
        """
        profile = await self.get_by_user_id(user_id)
        if profile is None:
            return None
        return await self.update(
            profile,
            {
                "age_range": None,
                "employment_type": None,
                "monthly_income": None,
                "family_income": None,
                "earning_members": None,
                "dependents_count": None,
                "has_loans": None,
                "loan_types": None,
                "monthly_emi": None,
                "total_debt": None,
                "has_emergency_fund": None,
                "emergency_fund_months": None,
                "has_health_insurance": None,
                "has_life_insurance": None,
                "monthly_investment": None,
                "investment_types": None,
                "risk_comfort": None,
                "financial_goals": None,
                "income_stability": None,
                "profile_completion_percentage": 0.0,
            },
        )

