"""WealthWise AI - Health Score Schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ScoreBreakdownSchema(BaseModel):
    savings_rate: Optional[float] = None
    expense_ratio: Optional[float] = None
    debt_ratio: Optional[float] = None
    investment_score: Optional[float] = None
    liquidity_ratio: Optional[float] = None
    income_stability: Optional[float] = None


class HealthScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    statement_id: UUID
    overall_score: Decimal
    score_label: str = ""  # excellent / good / fair / poor / critical
    savings_rate: Optional[Decimal] = None
    expense_ratio: Optional[Decimal] = None
    debt_ratio: Optional[Decimal] = None
    investment_score: Optional[Decimal] = None
    score_breakdown: Optional[dict] = None
    calculated_at: datetime

    @classmethod
    def from_orm_with_label(cls, record) -> "HealthScoreResponse":
        from app.core.constants import HEALTH_SCORE_LABELS
        score = float(record.overall_score)
        label = "critical"
        for lbl, (low, high) in HEALTH_SCORE_LABELS.items():
            if low <= score < high:
                label = lbl
                break
        obj = cls.model_validate(record)
        obj.score_label = label
        return obj
