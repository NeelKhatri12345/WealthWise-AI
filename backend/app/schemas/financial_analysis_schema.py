"""
WealthWise AI - Financial Analysis Schema

Pydantic models for the FinancialAnalysisService response
returned by POST /api/v1/ai-coach/analyze and consumed by
POST /api/v1/ai-coach/chat.

This schema is intentionally kept separate from the existing
AI Coach conversation schemas so it can be reused by the
Dashboard, Reports, and Health Score modules in the future.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------


class CategoryExpense(BaseModel):
    """A single spending category with its total and percentage share."""
    category: str
    amount: float
    percentage: float


class TopIncomeSource(BaseModel):
    """A single income source grouped by merchant / description."""
    description: str
    amount: float
    count: int


class MonthlyCashFlow(BaseModel):
    """Income, expense, and net savings broken down by calendar month."""
    month: str          # "YYYY-MM"
    income: float
    expense: float
    savings: float


class RecurringPayment(BaseModel):
    """A recurring payment detected across multiple months."""
    description: str
    average_amount: float
    months_detected: int
    frequency: str      # "monthly" | "irregular"


class TransactionSummaryItem(BaseModel):
    """A lightweight representation of a notable transaction."""
    date: str
    description: str
    amount: float
    type: str           # "credit" | "debit"


class StatementPeriod(BaseModel):
    """Date range covered by the analyzed statement."""
    start: str          # ISO date string "YYYY-MM-DD"
    end: str            # ISO date string "YYYY-MM-DD"


class StructuredRecommendation(BaseModel):
    """A structured representation of a financial advice/recommendation."""
    title: str
    description: str
    emoji: str


# ---------------------------------------------------------------------------
# Main FinancialSummary
# ---------------------------------------------------------------------------


class FinancialSummary(BaseModel):
    """
    Single comprehensive financial summary produced by FinancialAnalysisService.

    Designed to be passed directly to the Gemini prompt without any raw
    transaction data, keeping the AI payload compact and focused.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    statement_id: str
    generated_at: str       # ISO 8601 timestamp

    # ── Core aggregates ───────────────────────────────────────────────────────
    total_income: float = 0.0
    total_expense: float = 0.0
    net_savings: float = 0.0
    savings_rate: float = 0.0       # percentage 0-100
    transaction_count: int = 0

    # ── Averages ──────────────────────────────────────────────────────────────
    average_credit: float = 0.0
    average_debit: float = 0.0

    # ── Extremes ──────────────────────────────────────────────────────────────
    highest_expense: Optional[TransactionSummaryItem] = None
    highest_income: Optional[TransactionSummaryItem] = None

    # ── Categorisation ────────────────────────────────────────────────────────
    top_expense_categories: list[CategoryExpense] = Field(default_factory=list)
    top_income_sources: list[TopIncomeSource] = Field(default_factory=list)
    most_frequent_merchant: Optional[str] = None

    # ── Trends ────────────────────────────────────────────────────────────────
    monthly_cash_flow: list[MonthlyCashFlow] = Field(default_factory=list)
    spending_trend: str = "stable"   # "increasing" | "decreasing" | "stable" | "insufficient data"
    income_trend: str = "stable"

    # ── Flags ─────────────────────────────────────────────────────────────────
    salary_detected: bool = False
    investment_detected: bool = False
    loan_detected: bool = False

    # ── Recurring payments ────────────────────────────────────────────────────
    recurring_payments: list[RecurringPayment] = Field(default_factory=list)

    # ── Special transaction categories ────────────────────────────────────────
    atm_withdrawals_total: float = 0.0
    upi_transactions_total: float = 0.0
    neft_transactions_total: float = 0.0
    imps_transactions_total: float = 0.0
    rtgs_transactions_total: float = 0.0
    bank_charges_total: float = 0.0
    weekend_spending_total: float = 0.0

    # ── Notable transactions ───────────────────────────────────────────────────
    large_transactions: list[TransactionSummaryItem] = Field(default_factory=list)

    # ── Health ────────────────────────────────────────────────────────────────
    health_score: int = 0           # 0-100

    # ── Statement period ──────────────────────────────────────────────────────
    statement_period: Optional[StatementPeriod] = None

    # ── Recommendations (deterministic, backend-generated) ────────────────────
    recommendations: list[str] = Field(default_factory=list)
    structured_recommendations: list[StructuredRecommendation] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Request / Response DTOs for routes
# ---------------------------------------------------------------------------


class AnalyzeStatementRequest(BaseModel):
    """Request body for POST /ai-coach/analyze."""
    statement_id: UUID = Field(..., description="ID of a completed statement to analyze")


class AnalyzeStatementResponse(BaseModel):
    """Response from POST /ai-coach/analyze."""
    summary: FinancialSummary


class ChatRequest(BaseModel):
    """Request body for POST /ai-coach/chat."""
    financial_summary: dict[str, Any] = Field(
        ..., description="FinancialSummary dict as returned by /analyze"
    )
    user_question: str = Field(..., min_length=1, max_length=2000)
    currency: str = Field(default="INR", max_length=10)


class ChatResponse(BaseModel):
    """Response from POST /ai-coach/chat."""
    reply: str
    tokens_used: Optional[int] = None
