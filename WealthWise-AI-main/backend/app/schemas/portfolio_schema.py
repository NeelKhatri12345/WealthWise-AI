"""WealthWise AI - Portfolio Schemas"""

from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AssetAllocationSchema(BaseModel):
    asset_class: str
    allocation_pct: float
    rationale: str
    example_instruments: List[str] = []


class PortfolioRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    risk_profile_id: UUID
    recommendations: Optional[List[AssetAllocationSchema]] = None
    rebalance_frequency: str
    narrative: Optional[Any] = None
    generated_at: datetime
