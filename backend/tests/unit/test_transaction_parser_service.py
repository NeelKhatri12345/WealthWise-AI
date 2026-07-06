"""
WealthWise AI - Unit Tests: TransactionParserService

Tests orchestration logic with all collaborators mocked (statement repo,
transaction repo, processing service, parser):
  - Happy path: parse_statement persists transactions and completes the pipeline
  - Missing OCR text raises ValidationException and marks the statement FAILED
  - Parser exceptions mark the statement FAILED and re-raise
  - reparse_statement uses force_reparse() and replaces existing transactions
  - Duplicate extractions within one parse pass are collapsed before insert
  - get_transactions_for_statement enforces per-user ownership

No database, no real parser — everything is mocked.
"""

from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import NotFoundException, ValidationException
from app.parsers.result import ParsedTransaction, ParsingResult
from app.services.transaction_parser_service import TransactionParserService


def _make_statement(processing_metadata=None, status=StatementStatusEnum.OCR_COMPLETED):
    statement = MagicMock()
    statement.id = uuid4()
    statement.user_id = uuid4()
    statement.status = status
    statement.processing_metadata = processing_metadata
    return statement


def _make_service(statement=None):
    statement_repo = AsyncMock()
    transaction_repo = AsyncMock()
    processing_service = AsyncMock()
    parser = MagicMock()

    if statement is not None:
        statement_repo.get.return_value = statement
        statement_repo.get_by_id_and_user.return_value = statement

    completed_response = MagicMock()
    completed_response.status = StatementStatusEnum.COMPLETED
    processing_service.mark_completed.return_value = completed_response

    service = TransactionParserService(
        statement_repo=statement_repo,
        transaction_repo=transaction_repo,
        processing_service=processing_service,
        parser=parser,
    )
    return service, statement_repo, transaction_repo, processing_service, parser


def _sample_parsing_result(count: int = 1) -> ParsingResult:
    transactions = [
        ParsedTransaction(
            date=date(2024, 1, 5),
            description=f"MERCHANT {i}",
            amount=Decimal("10.00"),
            transaction_type="debit",
            merchant=f"MERCHANT {i}",
            balance=None,
            confidence=0.9,
            raw_line=f"raw line {i}",
        )
        for i in range(count)
    ]
    return ParsingResult(
        transactions=transactions,
        parser_name="regex",
        total_lines=count,
        parsed_lines=count,
        skipped_lines=0,
    )


# ── parse_statement: happy path ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_parse_statement_persists_transactions_and_completes() -> None:
    statement = _make_statement(processing_metadata={"raw_text": "01/05/2024 COFFEE -4.50"})
    service, statement_repo, transaction_repo, processing_service, parser = _make_service(
        statement
    )
    parser.parse.return_value = _sample_parsing_result(count=1)

    result = await service.parse_statement(statement.id)

    processing_service.mark_parsing.assert_awaited_once_with(statement.id)
    transaction_repo.delete_by_statement.assert_awaited_once_with(statement.id)
    transaction_repo.bulk_create.assert_awaited_once()
    processing_service.mark_completed.assert_awaited_once_with(statement.id)

    records = transaction_repo.bulk_create.call_args.args[0]
    assert len(records) == 1
    assert records[0]["statement_id"] == statement.id
    assert records[0]["user_id"] == statement.user_id
    assert records[0]["confidence_score"] == Decimal("0.9")

    assert result.transactions_created == 1
    assert result.status == StatementStatusEnum.COMPLETED
    assert result.parser_name == "regex"


@pytest.mark.asyncio
async def test_parse_statement_raises_not_found_for_missing_statement() -> None:
    service, statement_repo, _, _, _ = _make_service(statement=None)
    statement_repo.get.return_value = None

    with pytest.raises(NotFoundException):
        await service.parse_statement(uuid4())


# ── Missing OCR text ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_parse_statement_without_raw_text_fails_validation() -> None:
    statement = _make_statement(processing_metadata={})
    service, _, transaction_repo, processing_service, _ = _make_service(statement)

    with pytest.raises(ValidationException):
        await service.parse_statement(statement.id)

    processing_service.mark_failed.assert_awaited_once()
    transaction_repo.bulk_create.assert_not_awaited()


@pytest.mark.asyncio
async def test_parse_statement_with_none_processing_metadata_fails_validation() -> None:
    statement = _make_statement(processing_metadata=None)
    service, _, _, processing_service, _ = _make_service(statement)

    with pytest.raises(ValidationException):
        await service.parse_statement(statement.id)

    processing_service.mark_failed.assert_awaited_once()


# ── Parser exceptions ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_parser_exception_marks_statement_failed_and_reraises() -> None:
    statement = _make_statement(processing_metadata={"raw_text": "garbage"})
    service, _, transaction_repo, processing_service, parser = _make_service(statement)
    parser.parse.side_effect = RuntimeError("boom")

    with pytest.raises(RuntimeError):
        await service.parse_statement(statement.id)

    processing_service.mark_failed.assert_awaited_once()
    transaction_repo.bulk_create.assert_not_awaited()


# ── Re-run parser ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_reparse_statement_uses_force_reparse_and_replaces_transactions() -> None:
    statement = _make_statement(
        processing_metadata={"raw_text": "01/05/2024 COFFEE -4.50"},
        status=StatementStatusEnum.COMPLETED,
    )
    service, _, transaction_repo, processing_service, parser = _make_service(statement)
    parser.parse.return_value = _sample_parsing_result(count=1)

    await service.reparse_statement(statement.id)

    processing_service.force_reparse.assert_awaited_once_with(statement.id)
    processing_service.mark_parsing.assert_not_awaited()
    transaction_repo.delete_by_statement.assert_awaited_once_with(statement.id)
    transaction_repo.bulk_create.assert_awaited_once()


# ── Duplicate prevention within a statement ──────────────────────────────────


@pytest.mark.asyncio
async def test_duplicate_extractions_are_collapsed_before_insert() -> None:
    statement = _make_statement(processing_metadata={"raw_text": "dupe"})
    service, _, transaction_repo, _, parser = _make_service(statement)

    duplicate_txn = ParsedTransaction(
        date=date(2024, 1, 5),
        description="SAME LINE",
        amount=Decimal("10.00"),
        transaction_type="debit",
        merchant="SAME LINE",
        balance=None,
        confidence=0.9,
        raw_line="same raw line",
    )
    parser.parse.return_value = ParsingResult(
        transactions=[duplicate_txn, duplicate_txn],
        parser_name="regex",
        total_lines=2,
        parsed_lines=2,
        skipped_lines=0,
    )

    result = await service.parse_statement(statement.id)

    records = transaction_repo.bulk_create.call_args.args[0]
    assert len(records) == 1
    assert result.transactions_created == 1


# ── Read: get_transactions_for_statement ─────────────────────────────────────


@pytest.mark.asyncio
async def test_get_transactions_for_statement_returns_repo_results() -> None:
    statement = _make_statement()
    service, statement_repo, transaction_repo, _, _ = _make_service(statement)
    fake_transactions = [MagicMock(), MagicMock()]
    transaction_repo.get_by_statement.return_value = fake_transactions

    result = await service.get_transactions_for_statement(statement.id, statement.user_id)

    assert result == fake_transactions
    transaction_repo.get_by_statement.assert_awaited_once_with(statement.id)


@pytest.mark.asyncio
async def test_get_transactions_for_statement_raises_not_found_when_unowned() -> None:
    service, statement_repo, _, _, _ = _make_service(statement=None)
    statement_repo.get_by_id_and_user.return_value = None

    with pytest.raises(NotFoundException):
        await service.get_transactions_for_statement(uuid4(), uuid4())
