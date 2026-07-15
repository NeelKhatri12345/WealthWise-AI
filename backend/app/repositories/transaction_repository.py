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

    async def get_categories(self, user_id: UUID) -> list[str]:
        """Return distinct non-null category values for a user, sorted alphabetically."""
        stmt = (
            select(Transaction.category)
            .where(Transaction.user_id == user_id, Transaction.category.isnot(None))
            .distinct()
            .order_by(Transaction.category.asc())
        )
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_by_user_filtered(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        statement_id: Optional[UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        category: Optional[str] = None,
        transaction_type: Optional[str] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
    ) -> tuple[Sequence[Transaction], int]:
        from sqlalchemy import or_
        conditions = [Transaction.user_id == user_id]
        
        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    Transaction.description.ilike(search_term),
                    Transaction.merchant.ilike(search_term),
                )
            )
        if statement_id:
            conditions.append(Transaction.statement_id == statement_id)
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

        # Count total
        count_stmt = select(func.count(Transaction.id)).where(and_(*conditions))
        total_count = (await self.db.execute(count_stmt)).scalar() or 0

        # Build query
        stmt = select(Transaction).where(and_(*conditions))
        
        # Sorting
        sort_col = getattr(Transaction, sort_by) if sort_by and hasattr(Transaction, sort_by) else Transaction.date
        if sort_order == "asc":
            stmt = stmt.order_by(sort_col.asc())
        else:
            stmt = stmt.order_by(sort_col.desc())

        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total_count

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

    async def get_total_aggregates(self, user_id: UUID) -> dict:
        """Calculate total sum of credit and debit transaction amounts for a user."""
        stmt = (
            select(
                Transaction.transaction_type,
                func.sum(Transaction.amount).label("total")
            )
            .where(Transaction.user_id == user_id)
            .group_by(Transaction.transaction_type)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        
        total_income = Decimal("0")
        total_expenses = Decimal("0")
        for row in rows:
            if row.transaction_type == "credit":
                total_income = Decimal(str(row.total or 0))
            elif row.transaction_type == "debit":
                total_expenses = Decimal(str(row.total or 0))
        return {
            "total_income": total_income,
            "total_expenses": total_expenses
        }

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

    async def bulk_update_categories(self, user_id: UUID, transaction_ids: list[UUID], new_category: str) -> int:
        from sqlalchemy import update
        stmt = (
            update(Transaction)
            .where(Transaction.user_id == user_id, Transaction.id.in_(transaction_ids))
            .values(category=new_category)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0

    async def bulk_delete(self, user_id: UUID, transaction_ids: list[UUID]) -> int:
        stmt = (
            delete(Transaction)
            .where(Transaction.user_id == user_id, Transaction.id.in_(transaction_ids))
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0

    async def delete_all_by_user(self, user_id: UUID) -> int:
        """Remove every transaction belonging to the given user."""
        stmt = delete(Transaction).where(Transaction.user_id == user_id)
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount or 0
