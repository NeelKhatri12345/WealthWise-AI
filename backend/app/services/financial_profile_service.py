"""
WealthWise AI - Financial Profile Service

Thin CRUD wrapper around FinancialProfileRepository.
Handles get-or-create, patching, and completion % calculation.
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from app.core.logger import logger
from app.exceptions.custom_exceptions import NotFoundException
from app.repositories.financial_profile_repository import FinancialProfileRepository
from app.schemas.financial_profile_schema import (
    FinancialProfileResponse,
    FinancialProfileUpdate,
)

# Ordered list of fields used to compute profile_completion_percentage.
# Each present (non-None) field contributes equally.
_COMPLETION_FIELDS: list[str] = [
    "age_range",
    "employment_type",
    "monthly_income",
    "earning_members",
    "dependents_count",
    "has_loans",
    "monthly_emi",
    "has_emergency_fund",
    "emergency_fund_months",
    "has_health_insurance",
    "has_life_insurance",
    "monthly_investment",
    "investment_types",
    "risk_comfort",
    "financial_goals",
]


def _compute_completion(profile) -> float:
    """Return profile completion as a 0–100 float (rounded to 1 decimal)."""
    if profile is None:
        return 0.0
    filled = sum(
        1
        for f in _COMPLETION_FIELDS
        if getattr(profile, f, None) is not None
    )
    pct = (filled / len(_COMPLETION_FIELDS)) * 100.0
    return round(pct, 1)


class FinancialProfileService:

    def __init__(self, profile_repo: FinancialProfileRepository) -> None:
        self._repo = profile_repo

    async def get_profile(self, user_id: UUID) -> Optional[FinancialProfileResponse]:
        """Return the user's financial profile, or None if not created yet."""
        profile = await self._repo.get_by_user_id(user_id)
        if profile is None:
            return None
        profile.profile_completion_percentage = _compute_completion(profile)
        return FinancialProfileResponse.model_validate(profile)

    async def get_or_create_profile(self, user_id: UUID):
        """Return the existing profile or create an empty one."""
        profile = await self._repo.get_by_user_id(user_id)
        if profile is None:
            profile = await self._repo.upsert(
                user_id, {"profile_completion_percentage": 0.0}
            )
        return profile

    async def patch_profile(
        self, user_id: UUID, data: FinancialProfileUpdate
    ) -> FinancialProfileResponse:
        """Apply partial updates to the user's profile and recalculate completion."""
        fields = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}

        profile = await self._repo.upsert(user_id, fields)

        # Recompute completion after update
        completion = _compute_completion(profile)
        profile = await self._repo.update(profile, {"profile_completion_percentage": completion})

        logger.info(
            "Financial profile updated",
            extra={"user_id": str(user_id), "completion": completion},
        )
        return FinancialProfileResponse.model_validate(profile)

    async def update_fields_from_chat(
        self, user_id: UUID, extracted_fields: dict
    ) -> float:
        """
        Apply extracted chat fields to the profile and return updated completion %.
        Called by FinancialChatService after each user message.
        """
        if not extracted_fields:
            profile = await self._repo.get_by_user_id(user_id)
            return _compute_completion(profile)

        profile = await self._repo.upsert(user_id, extracted_fields)
        completion = _compute_completion(profile)
        await self._repo.update(profile, {"profile_completion_percentage": completion})
        return completion
