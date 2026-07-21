"""
WealthWise AI — Product Provider Data Models

Shared data structures used across all product providers and the
recommendation engine. Kept in a single module to avoid circular imports.

These are pure Python dataclasses — no SQLAlchemy, no Pydantic.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


# ── Catalog Record ─────────────────────────────────────────────────────────────


@dataclass
class ProductRecord:
    """
    Represents a single product entry from the master catalog.
    Contains identity and suitability fields ONLY.
    No live market data (returns, AUM, ratings, NAV).
    """

    id: str
    name: str
    product_type: str           # MF_INDEX | MF_EQUITY | MF_DEBT | ETF | STOCK | FD | GOLD_ETF | GOLD_MF | SGB | LIQUID_FUND | OVERNIGHT_FUND
    asset_class: str            # Equity | Debt | Gold | Cash | Hybrid
    category: str               # Exact match to allocation category name
    fund_house: Optional[str]
    sector: str
    investment_style: str

    # Identifiers
    symbol: Optional[str]
    isin: Optional[str]
    amfi_code: Optional[str]

    # Eligibility gates
    risk_level: str             # LOW | MEDIUM | HIGH
    minimum_strategy: str       # conservative | balanced | aggressive
    minimum_health_score: float
    minimum_investable_amount: float

    # Suitability vectors (for multi-signal scoring)
    suitable_goals: list[str]
    suitable_age_ranges: list[str]
    suitable_horizons: list[str]   # short_term | medium_term | long_term
    suitable_income_stability: list[str]

    # UI copy
    reason_tags: list[str]
    regulatory_note: str

    @classmethod
    def from_dict(cls, d: dict) -> "ProductRecord":
        return cls(
            id=d["id"],
            name=d["name"],
            product_type=d["product_type"],
            asset_class=d["asset_class"],
            category=d["category"],
            fund_house=d.get("fund_house"),
            sector=d["sector"],
            investment_style=d["investment_style"],
            symbol=d.get("symbol"),
            isin=d.get("isin"),
            amfi_code=d.get("amfi_code"),
            risk_level=d["risk_level"],
            minimum_strategy=d["minimum_strategy"],
            minimum_health_score=float(d.get("minimum_health_score", 0)),
            minimum_investable_amount=float(d.get("minimum_investable_amount", 0)),
            suitable_goals=d.get("suitable_goals", []),
            suitable_age_ranges=d.get("suitable_age_ranges", []),
            suitable_horizons=d.get("suitable_horizons", []),
            suitable_income_stability=d.get("suitable_income_stability", []),
            reason_tags=d.get("reason_tags", []),
            regulatory_note=d.get("regulatory_note", ""),
        )


# ── Live Market Metadata (Milestone 2+) ────────────────────────────────────────


@dataclass
class MarketMetadata:
    """
    Live enrichment data for a product — populated by Milestone 2 providers.
    In Milestone 1, providers always return None for this object.
    """

    product_id: str
    nav: Optional[float] = None                  # Latest NAV (Mutual Funds)
    current_price: Optional[float] = None        # Current Price (Stocks & ETFs)
    expected_return_1y: Optional[float] = None   # annual % trailing
    expected_return_3y: Optional[float] = None
    expense_ratio: Optional[float] = None        # annual %
    aum_cr: Optional[float] = None               # AUM in crores
    rating: Optional[float] = None              # 1-5 composite
    volatility: Optional[str] = None            # LOW | MEDIUM | HIGH
    last_updated: Optional[datetime] = None

    # M2 — Stocks
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

    # M2 — Mutual Funds
    exit_load: Optional[str] = None
    riskometer: Optional[str] = None
    category_avg_return: Optional[float] = None
    tracking_error: Optional[float] = None

    # M2 — ETF / Shared
    underlying_index: Optional[str] = None



# ── User Context ───────────────────────────────────────────────────────────────


@dataclass
class UserContext:
    """
    Aggregated user profile consumed by the scoring engine.
    Built from InvestmentRecommendationSnapshot + FinancialProfile.
    Immutable during a single recommendation run.
    """

    # From InvestmentRecommendationSnapshot
    recommended_strategy: str           # conservative | balanced | aggressive
    investment_readiness: str           # READY | PARTIAL | NOT_READY
    health_score: float                 # 0-100
    monthly_investable_amount: float    # ₹/month
    investment_readiness_score: float

    # From FinancialProfile
    age_range: Optional[str]            # "18-25" | "26-35" | "36-45" | "46-55" | "55+"
    risk_level: str                     # CONSERVATIVE | MODERATE | AGGRESSIVE
    financial_goals: list[str]          # ["retirement", "house", ...]
    income_stability: Optional[str]     # "very_stable" | "stable" | "variable" | "irregular"
    emergency_fund_months: float        # months covered
    has_emergency_fund: bool
    monthly_emi: float                  # ₹/month
    monthly_income: float               # ₹/month
    investment_types: list[str]         # existing investment experience

    # Derived (computed post-construction)
    debt_burden_ratio: float = field(init=False)
    investable_ratio: float = field(init=False)
    goal_horizon_tag: str = field(init=False)      # short_term | medium_term | long_term
    experience_level: str = field(init=False)      # beginner | intermediate | experienced

    def __post_init__(self) -> None:
        self.debt_burden_ratio = (
            self.monthly_emi / self.monthly_income if self.monthly_income > 0 else 0.0
        )
        self.investable_ratio = (
            self.monthly_investable_amount / self.monthly_income
            if self.monthly_income > 0
            else 0.0
        )
        self.goal_horizon_tag = self._derive_horizon()
        self.experience_level = self._derive_experience()

    def _derive_horizon(self) -> str:
        """
        Derive investment horizon from age range and financial goals.
        Priority: long-term goals + young age → long_term.
        Near-term goals → short_term.
        """
        long_term_goals = {"retirement", "wealth_creation"}
        medium_term_goals = {"house", "education"}
        short_term_goals = {"travel", "emergency_fund"}

        goals = set(self.financial_goals or [])
        age = self.age_range or ""

        if goals & long_term_goals and age in ("18-25", "26-35", "36-45"):
            return "long_term"
        if goals & medium_term_goals:
            return "medium_term"
        if goals & short_term_goals:
            return "short_term"
        if age in ("46-55", "55+"):
            return "medium_term"
        return "long_term"

    def _derive_experience(self) -> str:
        """
        Derive investment experience from declared investment types.
        """
        exp = set(self.investment_types or [])
        if len(exp) >= 4:
            return "experienced"
        if len(exp) >= 2:
            return "intermediate"
        return "beginner"
