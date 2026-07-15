"""
WealthWise AI - Financial Profile Schemas (Pydantic v2)

Used by:
  GET  /api/v1/financial-profile
  PATCH /api/v1/financial-profile
"""

from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FinancialProfileBase(BaseModel):
    """Shared fields editable via PATCH."""

    age_range: Optional[str] = None
    employment_type: Optional[str] = None
    monthly_income: Optional[Decimal] = None
    family_income: Optional[Decimal] = None
    earning_members: Optional[int] = Field(default=None, ge=0, le=20)
    dependents_count: Optional[int] = Field(default=None, ge=0, le=20)
    has_loans: Optional[bool] = None
    loan_types: Optional[list[str]] = None
    monthly_emi: Optional[Decimal] = None
    total_debt: Optional[Decimal] = None
    has_emergency_fund: Optional[bool] = None
    emergency_fund_months: Optional[float] = Field(default=None, ge=0.0)
    has_health_insurance: Optional[bool] = None
    has_life_insurance: Optional[bool] = None
    monthly_investment: Optional[Decimal] = None
    investment_types: Optional[list[str]] = None
    risk_comfort: Optional[str] = None
    financial_goals: Optional[list[str]] = None
    income_stability: Optional[str] = None


class FinancialProfileCreate(FinancialProfileBase):
    """Used internally when creating a new profile row."""
    user_id: UUID


class FinancialProfileUpdate(FinancialProfileBase):
    """Used by PATCH endpoint — all fields optional."""
    pass


class FinancialProfileResponse(FinancialProfileBase):
    """Response schema including system-generated fields."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    profile_completion_percentage: float
