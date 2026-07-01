"""WealthWise AI - Dashboard Schemas

Pydantic V2 schemas for the dashboard summary, insight, and notification endpoints.
"""

# from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DashboardSummaryResponse(BaseModel):
    """Aggregated KPI data for the dashboard."""

    total_balance: Decimal
    monthly_income: Decimal
    monthly_expenses: Decimal
    savings_rate: Decimal
    health_score: Decimal
    health_score_label: str
    net_worth: Decimal
    transaction_count: int


class DashboardTransactionResponse(BaseModel):
    """Slim transaction representation for dashboard recent-transactions list."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: str
    merchant: Optional[str] = None
    description: str
    category: Optional[str] = None
    amount: Decimal
    transaction_type: str


class DashboardInsightResponse(BaseModel):
    """AI-generated financial insight for dashboard display."""

    id: str
    title: str
    description: str
    category: str
    severity: str  # "info" | "warning" | "success"


class DashboardNotificationResponse(BaseModel):
    """Notification item for the dashboard."""

    id: str
    title: str
    message: str
    type: str  # "info" | "alert" | "success"
    read: bool
    created_at: str
