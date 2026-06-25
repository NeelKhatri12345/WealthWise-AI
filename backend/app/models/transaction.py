"""
WealthWise AI - Transaction ORM Model

Table: transactions
Extracted from bank statements via OCR pipeline.
"""

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class Transaction(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "transactions"

    statement_id: Mapped[UUID] = mapped_column(
        ForeignKey("statements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    transaction_type: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # 'debit' | 'credit'
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    merchant: Mapped[str | None] = mapped_column(String(255), nullable=True)
    balance: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Relationships
    statement: Mapped["Statement"] = relationship("Statement", back_populates="transactions")

    # Composite index for efficient user+date range queries
    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "date"),
        Index("ix_transactions_user_category", "user_id", "category"),
    )

    def __repr__(self) -> str:
        return f"<Transaction id={self.id} amount={self.amount} type={self.transaction_type}>"
