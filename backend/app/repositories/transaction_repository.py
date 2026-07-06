"""WealthWise AI - Transaction Repository"""

from datetime import date
from decimal import Decimal
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import and_, delete, func, select
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
        start_date = date(year, month, 1)
        next_month = month % 12 + 1
        next_year = year + 1 if month == 12 else year
        end_date = date(next_year, next_month, 1)

        stmt = (
            select(
                Transaction.transaction_type,
                Transaction.category,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.date >= start_date,
                Transaction.date < end_date,
            )
            .group_by(Transaction.transaction_type, Transaction.category)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return {"year": year, "month": month, "rows": [dict(r._mapping) for r in rows]}

    async def bulk_create(self, records: list[dict]) -> None:
        """Efficient bulk insert of extracted transactions."""
        from sqlalchemy.dialects.postgresql import insert
        stmt = insert(Transaction).values(records).on_conflict_do_nothing(
            constraint="uq_transaction_identity"
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def delete_by_statement(self, statement_id: UUID) -> int:
        """Remove all transactions for a statement (used before re-parsing)."""
        stmt = delete(Transaction).where(Transaction.statement_id == statement_id)
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0

    async def sync_statement_transactions(self, statement_id: UUID, records: list[dict]) -> None:
        """Replace all transactions for a statement with the given records."""
        await self.delete_by_statement(statement_id)
        if records:
            await self.bulk_create(records)
