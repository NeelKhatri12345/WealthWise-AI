"""
WealthWise AI - Transaction Parser Service

Converts a statement's raw OCR text into normalized Transaction rows.

Pipeline position
──────────────────
  OCR_COMPLETED ──► [this service] ──► PARSING ──► COMPLETED
                                              └──► FAILED (on error)

Separation of concerns
───────────────────────
- StatementProcessingService owns pure state-machine transitions.
- TransactionParser (regex/default) owns line-level text → transaction extraction.
- TransactionRepository owns persistence.
- TransactionParserService is the single seam that connects all three, mirroring
  OCROrchestrationService's role for the OCR step.

This service is called by background workers or admin endpoints for
parse/re-parse; regular users only read results via get_transactions_for_statement().
"""

from __future__ import annotations

from decimal import Decimal
from typing import Sequence
from uuid import UUID

from app.core.logger import logger
from app.exceptions.custom_exceptions import NotFoundException, ValidationException
from app.models.statement import Statement
from app.models.transaction import Transaction
from app.parsers.base import TransactionParser
from app.parsers.result import ParsedTransaction
from app.repositories.statement_repository import StatementRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction_schema import ParseStatementResponse
from app.services.statement_processing_service import StatementProcessingService


class TransactionParserService:
    def __init__(
        self,
        statement_repo: StatementRepository,
        transaction_repo: TransactionRepository,
        processing_service: StatementProcessingService,
        parser: TransactionParser,
    ) -> None:
        self._statement_repo = statement_repo
        self._transaction_repo = transaction_repo
        self._processing_service = processing_service
        self._parser = parser

    # ── Public entry points ───────────────────────────────────────────────────

    async def parse_statement(self, statement_id: UUID) -> ParseStatementResponse:
        """
        First-time parse. Statement must currently be OCR_COMPLETED.

        Transitions: OCR_COMPLETED → PARSING → COMPLETED (success)
                     OCR_COMPLETED → PARSING → FAILED     (error)
        """
        statement = await self._get_statement_or_raise(statement_id)
        await self._processing_service.mark_parsing(statement_id)
        return await self._run(statement)

    async def reparse_statement(self, statement_id: UUID) -> ParseStatementResponse:
        """
        Re-run the parser for a statement that already left OCR_COMPLETED
        (e.g. COMPLETED or FAILED). Replaces any previously parsed transactions.
        """
        statement = await self._get_statement_or_raise(statement_id)
        await self._processing_service.force_reparse(statement_id)
        return await self._run(statement)

    async def get_transactions_for_statement(
        self, statement_id: UUID, user_id: UUID
    ) -> Sequence[Transaction]:
        """User-scoped read of parsed transactions for one statement."""
        statement = await self._statement_repo.get_by_id_and_user(statement_id, user_id)
        if not statement:
            raise NotFoundException("Statement not found")
        return await self._transaction_repo.get_by_statement(statement_id)

    # ── Core parse + persist ──────────────────────────────────────────────────

    async def _run(self, statement: Statement) -> ParseStatementResponse:
        raw_text = (statement.processing_metadata or {}).get("raw_text")
        if not raw_text or not raw_text.strip():
            error_msg = "No OCR text available to parse. Run OCR first."
            await self._processing_service.mark_failed(statement.id, error_message=error_msg)
            raise ValidationException(error_msg)

        try:
            result = self._parser.parse(raw_text)
            deduped = self._deduplicate(result.transactions)

            await self._transaction_repo.delete_by_statement(statement.id)

            records = [
                {
                    "statement_id": statement.id,
                    "user_id": statement.user_id,
                    "date": t.date,
                    "description": t.description,
                    "amount": t.amount,
                    "transaction_type": t.transaction_type,
                    "merchant": t.merchant,
                    "balance": t.balance,
                    "confidence_score": Decimal(str(round(t.confidence, 3))),
                }
                for t in deduped
            ]
            if records:
                await self._transaction_repo.bulk_create(records)

            status_response = await self._processing_service.mark_completed(statement.id)

            average_confidence = (
                round(sum(t.confidence for t in deduped) / len(deduped), 2)
                if deduped
                else None
            )

            logger.info(
                "Transaction parsing completed",
                extra={
                    "statement_id": str(statement.id),
                    "parser": result.parser_name,
                    "transactions_created": len(records),
                    "skipped_lines": result.skipped_lines,
                },
            )

            return ParseStatementResponse(
                statement_id=statement.id,
                status=status_response.status,
                transactions_created=len(records),
                skipped_lines=result.skipped_lines,
                parser_name=result.parser_name,
                average_confidence=average_confidence,
            )
        except ValidationException:
            raise
        except Exception as exc:
            error_msg = f"[{type(exc).__name__}] {exc}"
            logger.error(
                "Transaction parsing failed",
                extra={"statement_id": str(statement.id), "error": error_msg},
                exc_info=exc,
            )
            # Clear any aborted transaction state (e.g., failed bulk insert)
            await self._transaction_repo.db.rollback()
            # Persist the failure state immediately
            await self._processing_service.mark_failed(statement.id, error_message=error_msg)
            await self._transaction_repo.db.commit()
            raise

    # ── Helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def _deduplicate(transactions: list[ParsedTransaction]) -> list[ParsedTransaction]:
        """Drop exact-duplicate extractions (e.g. the same source line matched twice)."""
        seen: set[tuple] = set()
        unique: list[ParsedTransaction] = []
        for t in transactions:
            key = (t.date, t.amount, t.transaction_type, t.description)
            if key in seen:
                continue
            seen.add(key)
            unique.append(t)
        return unique

    async def _get_statement_or_raise(self, statement_id: UUID) -> Statement:
        statement = await self._statement_repo.get(statement_id)
        if not statement:
            raise NotFoundException("Statement not found")
        return statement
