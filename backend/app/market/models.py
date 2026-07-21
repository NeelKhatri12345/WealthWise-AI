"""
WealthWise AI — Market Intelligence Data Models

Defines the structure for raw asset-specific metadata (Stock, Mutual Fund, ETF)
and the UnifiedMarketMetadata that normalises them into a single structure
stored in cache and consumed by the JSONProductProvider.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Any


@dataclass
class StockRawMetadata:
    symbol: str
    company_name: str
    market_cap_cr: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    volatility_score: Optional[float] = None
    analyst_rating: Optional[float] = None
    momentum_score: Optional[float] = None
    liquidity_score: Optional[float] = None
    expected_return: Optional[float] = None
    last_updated: Optional[datetime] = None


@dataclass
class MutualFundRawMetadata:
    amfi_code: str
    fund_house: str
    aum_cr: Optional[float] = None
    expense_ratio: Optional[float] = None
    exit_load: Optional[str] = None
    riskometer: Optional[str] = None
    return_3y: Optional[float] = None
    return_5y: Optional[float] = None
    category_avg_return: Optional[float] = None
    fund_rating: Optional[float] = None
    tracking_error: Optional[float] = None
    last_updated: Optional[datetime] = None


@dataclass
class ETFRawMetadata:
    symbol: str
    underlying_index: Optional[str] = None
    tracking_error: Optional[float] = None
    expense_ratio: Optional[float] = None
    aum_cr: Optional[float] = None
    liquidity_score: Optional[float] = None
    volatility: Optional[str] = None
    return_5y: Optional[float] = None
    last_updated: Optional[datetime] = None


@dataclass
class StaticInvestmentMetadata:
    product_id: str
    expected_return_1y: Optional[float] = None
    expected_return_3y: Optional[float] = None
    expense_ratio: Optional[float] = None
    aum_cr: Optional[float] = None
    rating: Optional[float] = None
    exit_load: Optional[str] = None
    riskometer: Optional[str] = None
    category_avg_return: Optional[float] = None
    tracking_error: Optional[float] = None
    underlying_index: Optional[str] = None
    metadata_version: Optional[int] = 1
    last_reviewed: Optional[str] = None
    source: Optional[str] = None


@dataclass
class LiveMarketMetadata:
    product_id: str
    nav: Optional[float] = None
    current_price: Optional[float] = None
    market_cap_cr: Optional[float] = None
    dividend_yield: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    beta: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    analyst_rating: Optional[float] = None
    last_updated: Optional[datetime] = None

    def to_dict(self) -> dict[str, Any]:
        res = asdict(self)
        if self.last_updated:
            res["last_updated"] = self.last_updated.isoformat()
        return res

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> LiveMarketMetadata:
        last_updated_raw = d.get("last_updated")
        last_updated = None
        if last_updated_raw:
            try:
                last_updated = datetime.fromisoformat(last_updated_raw)
            except ValueError:
                pass
        clean_d = {k: v for k, v in d.items() if k != "last_updated"}
        return cls(last_updated=last_updated, **clean_d)


@dataclass
class UnifiedMarketMetadata:
    product_id: str
    product_type: str

    # Common metrics & Live prices
    nav: Optional[float] = None                  # Latest NAV (Mutual Funds)
    current_price: Optional[float] = None        # Current Price (Stocks & ETFs)
    expected_return_1y: Optional[float] = None
    expected_return_3y: Optional[float] = None
    expense_ratio: Optional[float] = None
    aum_cr: Optional[float] = None
    rating: Optional[float] = None
    volatility: Optional[str] = None
    last_updated: Optional[datetime] = None

    # Stock-specific
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

    # Mutual Fund specific
    exit_load: Optional[str] = None
    riskometer: Optional[str] = None
    category_avg_return: Optional[float] = None
    tracking_error: Optional[float] = None

    # ETF specific
    underlying_index: Optional[str] = None

    # Governance metadata
    metadata_version: Optional[int] = 1
    last_reviewed: Optional[str] = None
    source: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Serialize metadata helper."""
        res = asdict(self)
        if self.last_updated:
            res["last_updated"] = self.last_updated.isoformat()
        return res

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> UnifiedMarketMetadata:
        """Deserialize metadata helper."""
        last_updated_raw = d.get("last_updated")
        last_updated = None
        if last_updated_raw:
            try:
                last_updated = datetime.fromisoformat(last_updated_raw)
            except ValueError:
                pass

        # Clean dict to match constructor signatures
        clean_d = {k: v for k, v in d.items() if k != "last_updated"}
        return cls(last_updated=last_updated, **clean_d)

    @classmethod
    def merge(
        cls,
        static_meta: StaticInvestmentMetadata,
        live_meta: Optional[LiveMarketMetadata] = None,
        product_type: str = "",
    ) -> UnifiedMarketMetadata:
        """Combine static investment metadata from PostgreSQL with live price metadata from cache."""
        return cls(
            product_id=static_meta.product_id,
            product_type=product_type,
            expected_return_1y=static_meta.expected_return_1y,
            expected_return_3y=static_meta.expected_return_3y,
            expense_ratio=static_meta.expense_ratio,
            aum_cr=static_meta.aum_cr,
            rating=static_meta.rating,
            exit_load=static_meta.exit_load,
            riskometer=static_meta.riskometer,
            category_avg_return=static_meta.category_avg_return,
            tracking_error=static_meta.tracking_error,
            underlying_index=static_meta.underlying_index,
            metadata_version=static_meta.metadata_version,
            last_reviewed=static_meta.last_reviewed,
            source=static_meta.source,
            # Live fields (only overridden if live_meta is present)
            nav=live_meta.nav if live_meta else None,
            current_price=live_meta.current_price if live_meta else None,
            market_cap_cr=live_meta.market_cap_cr if (live_meta and live_meta.market_cap_cr) else static_meta.aum_cr,
            dividend_yield=live_meta.dividend_yield if live_meta else None,
            pe_ratio=live_meta.pe_ratio if live_meta else None,
            pb_ratio=live_meta.pb_ratio if live_meta else None,
            beta=live_meta.beta if live_meta else None,
            week_52_high=live_meta.week_52_high if live_meta else None,
            week_52_low=live_meta.week_52_low if live_meta else None,
            analyst_rating=live_meta.analyst_rating if live_meta else None,
            last_updated=live_meta.last_updated if live_meta else None,
        )

