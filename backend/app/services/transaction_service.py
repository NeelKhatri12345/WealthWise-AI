"""
WealthWise AI - Transaction Service

Orchestrates business logic for Transaction operations.
"""

from uuid import UUID
from app.repositories.transaction_repository import TransactionRepository


class TransactionService:
    def __init__(self, transaction_repo: TransactionRepository) -> None:
        self._transaction_repo = transaction_repo

    async def delete_all_transactions(self, user_id: UUID) -> int:
        """Delete all transactions belonging to a specific user in bulk."""
        return await self._transaction_repo.delete_all_by_user(user_id)
