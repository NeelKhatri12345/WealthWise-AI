"""WealthWise AI - Transaction Repository"""

from datetime import date
from decimal import Decimal
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.repositories.base_repository import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Transaction, db)

    async def get_by_statement(self, statement_id: UUID) -> Sequence[Transaction]:
        stmt = (
            select(Transaction)
            .where(Transaction.statement_id == statement_id)
            .order_by(Transaction.date.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_by_user_filtered(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        category: Optional[str] = None,
        transaction_type: Optional[str] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
    ) -> Sequence[Transaction]:
        conditions = [Transaction.user_id == user_id]
        if date_from:
            conditions.append(Transaction.date >= date_from)
        if date_to:
            conditions.append(Transaction.date <= date_to)
        if category:
            conditions.append(Transaction.category == category)
        if transaction_type:
            conditions.append(Transaction.transaction_type == transaction_type)
        if min_amount is not None:
            conditions.append(Transaction.amount >= min_amount)
        if max_amount is not None:
            conditions.append(Transaction.amount <= max_amount)

        stmt = (
            select(Transaction)
            .where(and_(*conditions))
            .order_by(Transaction.date.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_monthly_aggregates(
        self, user_id: UUID, year: int, month: int
    ) -> dict:
        """Aggregate credits, debits, and category totals for a month."""
        stmt = (
            select(
                Transaction.transaction_type,
                Transaction.category,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .where(
                Transaction.user_id == user_id,
                func.extract("year", Transaction.date) == year,
                func.extract("month", Transaction.date) == month,
            )
            .group_by(Transaction.transaction_type, Transaction.category)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return {"year": year, "month": month, "rows": [dict(r._mapping) for r in rows]}

    async def bulk_create(self, records: list[dict]) -> None:
        """Efficient bulk insert of extracted transactions."""
        self.db.add_all([Transaction(**r) for r in records])
        await self.db.flush()
