"""WealthWise AI - Risk Profile Schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.enums.risk_profile_enum import RiskProfileEnum


class RiskProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    statement_id: UUID
    risk_level: RiskProfileEnum
    risk_score: Decimal
    confidence: Optional[Decimal] = None
    feature_inputs: Optional[dict] = None
    calculated_at: datetime
