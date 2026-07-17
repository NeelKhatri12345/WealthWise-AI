"""WealthWise AI - Portfolio Holding Schemas"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PortfolioHoldingCreateRequest(BaseModel):
    asset_name: str = Field(..., min_length=1, max_length=255)
    asset_type: str = Field(..., min_length=1, max_length=50)
    symbol: Optional[str] = Field(default=None, max_length=50)
    quantity: Decimal = Field(..., gt=0)
    average_buy_price: Decimal = Field(..., gt=0)
    current_price: Decimal = Field(..., gt=0)
    purchase_date: date
    notes: Optional[str] = Field(default=None, max_length=2000)


class PortfolioHoldingUpdateRequest(BaseModel):
    asset_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    asset_type: Optional[str] = Field(default=None, min_length=1, max_length=50)
    symbol: Optional[str] = Field(default=None, max_length=50)
    quantity: Optional[Decimal] = Field(default=None, gt=0)
    average_buy_price: Optional[Decimal] = Field(default=None, gt=0)
    current_price: Optional[Decimal] = Field(default=None, gt=0)
    purchase_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class PortfolioHoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    asset_name: str
    asset_type: str
    symbol: Optional[str] = None
    quantity: Decimal
    average_buy_price: Decimal
    current_price: Decimal
    current_value: Decimal
    invested_value: Decimal
    profit_loss: Decimal
    profit_loss_percentage: Decimal
    purchase_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
