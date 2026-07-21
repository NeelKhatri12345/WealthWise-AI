"""
WealthWise AI — InvestmentProduct ORM Model

Table: investment_products
Stores the master product catalog in PostgreSQL.
Acts as the primary product catalog and recommendation source.
"""

from typing import Any, List, Optional
from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin
from app.providers.models import ProductRecord


class InvestmentProduct(TimestampMixin, Base):
    __tablename__ = "investment_products"

    # String slug ID as primary key (e.g. "uti-nifty50-index", "stock-reliance")
    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    symbol: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    isin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    amfi_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    product_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    asset_class: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    fund_house: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sector: Mapped[str] = mapped_column(String(100), nullable=False, default="General")
    investment_style: Mapped[str] = mapped_column(String(100), nullable=False, default="Growth")

    # Eligibility Gates
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    minimum_strategy: Mapped[str] = mapped_column(String(20), nullable=False)
    minimum_health_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    minimum_investable_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Suitability vectors & copy
    suitable_goals: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    suitable_age_ranges: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    suitable_horizons: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    suitable_income_stability: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    reason_tags: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    regulatory_note: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Stored Market Data (Fallback & Static values)
    nav: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    market_cap_cr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dividend_yield: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expected_return_1y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expected_return_3y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    expense_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    aum_cr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exit_load: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    riskometer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    category_avg_return: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tracking_error: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    underlying_index: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Metadata Governance
    metadata_version: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    last_reviewed: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    def to_product_record(self) -> ProductRecord:
        """Convert ORM model to ProductRecord dataclass used by recommendation engine."""
        return ProductRecord(
            id=self.id,
            name=self.name,
            product_type=self.product_type,
            asset_class=self.asset_class,
            category=self.category,
            fund_house=self.fund_house,
            sector=self.sector,
            investment_style=self.investment_style,
            symbol=self.symbol,
            isin=self.isin,
            amfi_code=self.amfi_code,
            risk_level=self.risk_level,
            minimum_strategy=self.minimum_strategy,
            minimum_health_score=self.minimum_health_score or 0.0,
            minimum_investable_amount=self.minimum_investable_amount or 0.0,
            suitable_goals=self.suitable_goals or [],
            suitable_age_ranges=self.suitable_age_ranges or [],
            suitable_horizons=self.suitable_horizons or [],
            suitable_income_stability=self.suitable_income_stability or [],
            reason_tags=self.reason_tags or [],
            regulatory_note=self.regulatory_note or "",
        )

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "InvestmentProduct":
        return cls(
            id=d["id"],
            name=d["name"],
            symbol=d.get("symbol"),
            isin=d.get("isin"),
            amfi_code=d.get("amfi_code"),
            product_type=d["product_type"],
            asset_class=d["asset_class"],
            category=d["category"],
            fund_house=d.get("fund_house"),
            sector=d.get("sector", "General"),
            investment_style=d.get("investment_style", "Growth"),
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
            nav=d.get("nav"),
            current_price=d.get("current_price"),
            market_cap_cr=d.get("market_cap_cr"),
            dividend_yield=d.get("dividend_yield"),
            expected_return_1y=d.get("expected_return_1y"),
            expected_return_3y=d.get("expected_return_3y"),
            expense_ratio=d.get("expense_ratio"),
            aum_cr=d.get("aum_cr"),
            rating=d.get("rating"),
            exit_load=d.get("exit_load"),
            riskometer=d.get("riskometer"),
            category_avg_return=d.get("category_avg_return"),
            tracking_error=d.get("tracking_error"),
            underlying_index=d.get("underlying_index"),
            metadata_version=d.get("metadata_version", 1),
            last_reviewed=d.get("last_reviewed"),
            source=d.get("source"),
        )

