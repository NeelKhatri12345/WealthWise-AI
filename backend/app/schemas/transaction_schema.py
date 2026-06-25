"""WealthWise AI - Transaction Schemas"""

from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: date
    description: str
    amount: Decimal
    transaction_type: str
    category: Optional[str] = None
    merchant: Optional[str] = None
    balance: Optional[Decimal] = None


class TransactionFilterRequest(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    category: Optional[str] = None
    transaction_type: Optional[str] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    page: int = 1
    page_size: int = 20


class MonthlySummary(BaseModel):
    year: int
    month: int
    total_credits: Decimal
    total_debits: Decimal
    net_flow: Decimal
    transaction_count: int
    top_categories: list[dict]
