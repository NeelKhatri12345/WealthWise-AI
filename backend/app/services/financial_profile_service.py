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

# Ordered list of ONE representative field per chat step (steps 0-9).
# This must ALWAYS contain exactly TOTAL_STEPS entries so that:
#   profile_completion_percentage = (filled / TOTAL_STEPS) * 100
# ─────────────────────────────────────────────────────────────────────
# Step 0  → age_range
# Step 1  → employment_type
# Step 2  → monthly_income        (representative for income step)
# Step 3  → earning_members       (representative for household step)
# Step 4  → has_loans             (representative for loans step)
# Step 5  → has_emergency_fund    (representative for emergency fund step)
# Step 6  → has_health_insurance  (representative for insurance step)
# Step 7  → monthly_investment    (representative for investments step)
# Step 8  → risk_comfort
# Step 9  → financial_goals
_COMPLETION_FIELDS: list[str] = [
    "age_range",             # step 0
    "employment_type",       # step 1
    "monthly_income",        # step 2
    "earning_members",       # step 3
    "has_loans",             # step 4
    "has_emergency_fund",    # step 5
    "has_health_insurance",  # step 6
    "monthly_investment",    # step 7
    "risk_comfort",          # step 8
    "financial_goals",       # step 9
]

# Sanity-check: must equal TOTAL_STEPS (10)
_TOTAL_CHAT_STEPS = 10
assert len(_COMPLETION_FIELDS) == _TOTAL_CHAT_STEPS, (
    f"_COMPLETION_FIELDS must have exactly {_TOTAL_CHAT_STEPS} entries, got {len(_COMPLETION_FIELDS)}"
)


def _compute_completion(profile) -> float:
    """Return profile completion as a 0–100 float (rounded to 1 decimal).
    
    Formula: (number of answered steps / TOTAL_CHAT_STEPS) * 100
    Each entry in _COMPLETION_FIELDS represents exactly one chat step.
    """
    if profile is None:
        return 0.0
    filled = sum(
        1
        for f in _COMPLETION_FIELDS
        if getattr(profile, f, None) is not None
    )
    pct = (filled / _TOTAL_CHAT_STEPS) * 100.0
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
