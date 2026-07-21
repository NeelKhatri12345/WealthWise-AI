"""
WealthWise AI — Product Recommendation Pydantic Schemas

API response models for GET /api/v1/investments/product-suggestions.
Contract is frozen across Milestone 1, 2, and 3.

  market_data: null    → Milestone 1 (static catalog)
  market_data: {...}   → Milestone 2 (live provider)
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class MarketDataSchema(BaseModel):
    """Live market enrichment — null in Milestone 1."""
    nav: Optional[float] = None
    current_price: Optional[float] = None
    expected_return_1y: Optional[float] = None
    expected_return_3y: Optional[float] = None
    expense_ratio: Optional[float] = None
    aum_cr: Optional[float] = None
    rating: Optional[float] = None
    volatility: Optional[str] = None
    last_updated: Optional[str] = None

    # M2 Stock fields
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    analyst_rating: Optional[float] = None
    momentum_score: Optional[float] = None
    liquidity_score: Optional[float] = None
    market_cap_cr: Optional[float] = None

    # M2 Mutual Fund fields
    exit_load: Optional[str] = None
    riskometer: Optional[str] = None
    category_avg_return: Optional[float] = None
    tracking_error: Optional[float] = None

    # M2 ETF fields
    underlying_index: Optional[str] = None




class MarketScoresSchema(BaseModel):
    """Normalized market scores for M2+ engine evaluation."""
    overall_score: float
    valuation_score: float
    growth_score: float
    volatility_score: float
    liquidity_score: float
    quality_score: float
    cost_efficiency_score: float
    consistency_score: float


class ScoreBreakdownSchema(BaseModel):
    """Granular deterministic scoring breakdown for transparent product evaluation."""
    risk_match: float
    goal_match: float
    horizon_match: float
    market_score: float
    expense_ratio_score: float
    historical_performance_score: float
    diversification: float
    volatility_score: float
    liquidity_score: float
    health_score_compatibility: float
    investment_readiness_compatibility: float


class ProductRecommendation(BaseModel):
    """A single ranked product within a category."""
    id: str
    name: str
    product_type: str
    asset_class: str
    fund_house: Optional[str]
    sector: str
    investment_style: str
    risk_level: str
    symbol: Optional[str]
    isin: Optional[str]
    amfi_code: Optional[str]
    confidence_pct: float
    rank: int
    match_reasons: list[str]
    reason_tags: list[str]
    regulatory_note: str
    market_data: Optional[MarketDataSchema] = None
    market_scores: Optional[MarketScoresSchema] = None
    
    # New Phase 6 Fields for Transparency
    overall_fit_score: float
    score_breakdown: ScoreBreakdownSchema
    recommendation_reason: str



class CategorySuggestions(BaseModel):
    """Ranked products for a single allocation category."""
    category: str
    monthly_allocation: Optional[float]
    allocation_pct: Optional[float]
    products: list[ProductRecommendation]
    note: Optional[str] = None



class ProductSuggestionsResponse(BaseModel):
    """Top-level response for GET /investments/product-suggestions."""
    strategy: str
    investment_readiness: str
    health_score: float
    monthly_investable_amount: float
    generated_at: str
    data_source: str              # "static_catalog" | "live"
    categories: list[CategorySuggestions]
    supplementary_categories: list[CategorySuggestions] = []
    providers: list[str] = []
    companies: list[str] = []

