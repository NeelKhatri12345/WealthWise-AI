"""
WealthWise AI - Health Score Snapshot Schemas (Pydantic v2)

Used by:
  POST /api/v1/health-score/calculate
  GET  /api/v1/health-score/snapshot/latest
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ComponentScores(BaseModel):
    """Individual component scores — points-based, not percentages."""

    cash_flow_score: float = 0.0       # max 25 (combined savings + cash flow)
    savings_score: float = 0.0         # included in cash_flow_score
    spending_score: float = 0.0        # max 20
    debt_burden_score: float = 0.0     # max 20
    emergency_score: float = 0.0       # max 15
    income_stability_score: float = 0.0  # max 10
    investment_readiness_score: float = 0.0  # max 10


class HealthScoreSnapshotResponse(BaseModel):
    """Full health score snapshot response including all breakdown fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    financial_profile_id: Optional[UUID] = None

    score: Decimal
    band: str          # EXCELLENT | GOOD | FAIR | WEAK | CRITICAL
    risk_profile: Optional[str] = None  # CONSERVATIVE | MODERATE | AGGRESSIVE

    component_scores: ComponentScores

    positive_factors: list[str] = []
    negative_factors: list[str] = []
    suggestions: list[str] = []

    calculation_metadata: Optional[dict[str, Any]] = None
    created_at: datetime
