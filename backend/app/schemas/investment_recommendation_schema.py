"""
WealthWise AI - Investment Recommendation Schemas (Pydantic v2)
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AllocationItem(BaseModel):
    """Single category allocation within a strategy."""
    category: str
    percentage: float = Field(ge=0.0, le=100.0)
    monthly_amount: float
    priority: str  # "HIGH" | "MEDIUM" | "LOW"
    rationale: str


class InvestmentStrategy(BaseModel):
    """One of the three generated strategies."""
    name: str           # conservative | balanced | aggressive
    label: str          # "Conservative", "Balanced", "Aggressive"
    description: str
    allocation: list[AllocationItem]
    total_investable: float


class ReasoningDetail(BaseModel):
    strategy_rationale: str
    positive_signals: list[str]
    negative_signals: list[str]
    how_to_unlock: list[str]


class ActionPlanPhase(BaseModel):
    phase: str
    label: str
    tasks: list[str]


class InvestmentRecommendationSnapshotResponse(BaseModel):
    id: UUID
    user_id: UUID
    health_score_snapshot_id: Optional[UUID]
    risk_profile_snapshot_id: Optional[UUID]
    investment_readiness: str
    investment_readiness_score: Optional[float]
    recommended_strategy: str
    monthly_investable_amount: Optional[float]
    allocation_json: Optional[list[dict]]
    reasoning_json: Optional[dict]
    warnings_json: Optional[list[str]]
    action_plan_json: Optional[dict]
    metadata_json: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class InvestmentRecommendationHistoryItem(BaseModel):
    id: UUID
    investment_readiness: str
    investment_readiness_score: Optional[float]
    recommended_strategy: str
    monthly_investable_amount: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}
