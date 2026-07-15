"""WealthWise AI - Transaction Schemas"""

from datetime import date
from datetime import date as _date  # noqa: F401 — see TransactionUpdateRequest.date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.enums.statement_status_enum import StatementStatusEnum


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
    confidence_score: Optional[Decimal] = None


class TransactionFilterRequest(BaseModel):
    search: Optional[str] = None
    statement_id: Optional[UUID] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    category: Optional[str] = None
    transaction_type: Optional[str] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = None
    page: int = 1
    page_size: int = 20

datetime_date = date


class TransactionUpdateRequest(BaseModel):
<<<<<<< HEAD
    # Annotated with the aliased `_date` import, not `date`: a field literally
    # named "date" combined with an `Optional[date] = None` default makes
    # Pydantic v2 resolve the annotation against the class's own `date = None`
    # attribute instead of the `datetime.date` type, collapsing the field to
    # None-only (422 "Input should be None" on every value). Every other date
    # field in this file avoids the collision by using a different field name
    # (date_from/date_to) or having no default (required), so this is the only
    # one needing the aliased import. The field name itself is unchanged, so
    # the JSON API contract ("date": "...") stays the same.
    date: Optional[_date] = None
=======
    date: Optional[datetime_date] = None
>>>>>>> main
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    merchant: Optional[str] = None

class BulkCategoryUpdateRequest(BaseModel):
    transaction_ids: list[UUID]
    category: str

class BulkDeleteRequest(BaseModel):
    transaction_ids: list[UUID]


class MonthlySummary(BaseModel):
    year: int
    month: int
    total_credits: Decimal
    total_debits: Decimal
    net_flow: Decimal
    transaction_count: int
    top_categories: list[dict]


class ParseStatementResponse(BaseModel):
    """Returned after a (re-)parse run completes successfully."""

    model_config = ConfigDict(from_attributes=True)

    statement_id: UUID
    status: StatementStatusEnum
    transactions_created: int
    skipped_lines: int
    parser_name: str
    average_confidence: Optional[float] = None


class TransactionSyncItem(BaseModel):
    date: date
    description: str
    amount: Decimal
    transaction_type: str
    category: Optional[str] = None
    merchant: Optional[str] = None
    confidence_score: Optional[Decimal] = None


class TransactionSyncRequest(BaseModel):
    transactions: list[TransactionSyncItem]
