"""
WealthWise AI - Portfolio Holding ORM Model

Table: portfolio_holdings
Manually entered investment holdings (Portfolio Module Milestone 1).
Independent of the OCR/statement pipeline and the AI-driven Portfolio
recommendation feature (see app/models/portfolio.py).
"""

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class PortfolioHolding(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "portfolio_holdings"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    asset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    symbol: Mapped[str | None] = mapped_column(String(50), nullable=True)

    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    average_buy_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    current_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Server-calculated (see PortfolioHoldingService._calculate)
    invested_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    current_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    profit_loss: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    profit_loss_percentage: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)

    purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolio_holdings")

    def __repr__(self) -> str:
        return f"<PortfolioHolding id={self.id} asset={self.asset_name} symbol={self.symbol}>"
