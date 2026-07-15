"""WealthWise AI - Financial Metrics Schemas"""

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FinancialMetrics(BaseModel):
    """Encapsulates reusable financial metrics computed from transactions."""

    model_config = ConfigDict(from_attributes=True)

    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    savings_rate: Decimal
    transaction_count: int
    credit_count: int
    debit_count: int
    avg_transaction_amount: Decimal
    largest_credit: Decimal
    largest_debit: Decimal
    top_spending_category: Optional[str] = None
    top_spending_category_ratio: Optional[Decimal] = None
    top_income_category: Optional[str] = None
    spending_categories_count: int
    income_months_count: int
    income_coefficient_of_variation: Optional[Decimal] = None
