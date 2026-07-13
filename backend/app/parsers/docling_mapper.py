"""
WealthWise AI - Docling Transaction Mapper

Maps Docling's structured document JSON (produced by
DocumentExtractionService via DoclingExtractor) directly into
ParsedTransaction. This is a field mapping only — no regex, no line
parsing, no amount-extraction heuristics, no OCR cleanup — because Docling
has already segmented the statement into rows with named fields.

Implements the TransactionParser interface so it plugs into
TransactionParserService via app/core/dependencies.py::get_transaction_parser()
with no changes to the parsing/persistence pipeline.

Field mapping — Case A (Transaction Amount schema)
───────────────────────────────────────────────────
  Value Date          → date
  Description         → description
  Transaction Amount  → amount
  CrIDr               → transaction_type (debit/credit)
  Available Balance   → balance
  Transaction ID      → reference_number
  Merchant            → derived from Description via extract_merchant()

Field mapping — Case B (Debit / Credit column schema)
──────────────────────────────────────────────────────
  Value Date          → date
  Description         → description
  Debit (non-empty)   → amount, transaction_type = "debit"
  Credit (non-empty)  → amount, transaction_type = "credit"
  Available Balance   → balance
  Transaction ID      → reference_number
  Merchant            → derived from Description via extract_merchant()

  Cheque No. and Txn Posted Date are present on raw rows but have no
  corresponding Transaction column and are intentionally not mapped.
"""

from __future__ import annotations

import json
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

from dateutil import parser as dateutil_parser

from app.core.logger import logger
from app.parsers.base import TransactionParser
from app.parsers.merchant_utils import extract_merchant
from app.parsers.result import ParsedTransaction, ParsingResult

_CREDIT_MARKERS = {"cr", "credit", "c"}
_DEBIT_MARKERS = {"dr", "debit", "d"}


class DoclingTransactionMapper(TransactionParser):
    """Maps Docling's structured table rows directly to ParsedTransaction."""

    @property
    def parser_name(self) -> str:
        return "docling"

    def parse(self, extracted_data: str) -> ParsingResult:
        rows = self._load_rows(extracted_data)
        total_rows = len(rows)

        transactions: list[ParsedTransaction] = []
        skipped = 0

        for row in rows:
            mapped = self._map_row(row)
            if mapped is None:
                skipped += 1
                continue
            transactions.append(mapped)

        logger.info(
            "DoclingTransactionMapper: mapping complete",
            extra={
                "total_rows": total_rows,
                "mapped_rows": len(transactions),
                "skipped_rows": skipped,
            },
        )

        logger.info(
            "DoclingTransactionMapper produced %d ParsedTransaction objects",
            len(transactions),
        )
        return ParsingResult(
            transactions=transactions,
            parser_name=self.parser_name,
            total_lines=total_rows,
            parsed_lines=len(transactions),
            skipped_lines=skipped,
        )

    # ── Internal ───────────────────────────────────────────────────────────────

    @staticmethod
    def _load_rows(extracted_data: str) -> list[dict[str, Any]]:
        if not extracted_data or not extracted_data.strip():
            return []
        try:
            data = json.loads(extracted_data)
        except (json.JSONDecodeError, TypeError):
            logger.warning("DoclingTransactionMapper: extracted_data is not valid JSON")
            return []
        return data if isinstance(data, list) else []

    def _map_row(self, row: dict[str, Any]) -> Optional[ParsedTransaction]:
        # ── Date (required) ───────────────────────────────────────────────────
        date_value = self._parse_date(row.get("Value Date"))
        if date_value is None:
            return None

        # ── Amount + transaction_type (schema-agnostic) ───────────────────────
        # Case A: single signed/unsigned amount column with explicit Cr/Dr flag.
        if "Transaction Amount" in row:
            amount_value = self._parse_amount(row.get("Transaction Amount"))
            if amount_value is None:
                return None
            transaction_type = self._detect_type(row.get("CrIDr"), amount_value)

        # Case B: separate Debit / Credit columns.
        else:
            raw_debit = row.get("Debit")
            raw_credit = row.get("Credit")
            debit_value = self._parse_amount(raw_debit)
            credit_value = self._parse_amount(raw_credit)

            if debit_value is not None:
                amount_value = debit_value
                transaction_type = "debit"
            elif credit_value is not None:
                amount_value = credit_value
                transaction_type = "credit"
            else:
                # Both columns absent or unparseable — skip row.
                return None

        # ── Remaining fields ──────────────────────────────────────────────────
        description = str(row.get("Description") or "").strip() or "Unknown transaction"
        balance_value = self._parse_amount(row.get("Available Balance"))
        merchant = extract_merchant(description)
        reference_number = self._clean_str(row.get("Transaction ID"))
        # Cheque No. and Txn Posted Date are present on the raw row but have
        # no corresponding Transaction column, so they are intentionally not
        # mapped further (database schema is not modified by this pipeline).

        return ParsedTransaction(
            date=date_value,
            description=description,
            amount=abs(amount_value),
            transaction_type=transaction_type,
            merchant=merchant,
            balance=abs(balance_value) if balance_value is not None else None,
            confidence=1.0,
            raw_line=json.dumps(row, default=str),
            reference_number=reference_number,
        )

    @staticmethod
    def _clean_str(value: Any) -> Optional[str]:
        text = str(value).strip() if value is not None else ""
        return text or None

    @staticmethod
    def _parse_date(value: Any):
        if not value:
            return None
        try:
            return dateutil_parser.parse(str(value), fuzzy=False, dayfirst=True).date()
        except (ValueError, OverflowError):
            return None

    @staticmethod
    def _parse_amount(value: Any) -> Optional[Decimal]:
        if value is None or value == "":
            return None
        cleaned = str(value).strip()
        negative = cleaned.startswith("-") or (
            cleaned.startswith("(") and cleaned.endswith(")")
        )
        cleaned = (
            cleaned.replace("₹", "")
            .replace("Rs.", "")
            .replace("Rs", "")
            .replace(",", "")
            .replace(" ", "")
            .strip("()")
            .lstrip("-")
        )
        if not cleaned:
            return None
        try:
            amount = Decimal(cleaned)
        except InvalidOperation:
            return None
        return -amount if negative else amount

    @staticmethod
    def _detect_type(cridr_value: Any, amount_value: Decimal) -> str:
        if cridr_value:
            token = str(cridr_value).strip().lower()
            if token in _CREDIT_MARKERS:
                return "credit"
            if token in _DEBIT_MARKERS:
                return "debit"
        if amount_value < 0:
            return "debit"
        # No explicit CrIDr indicator on a non-negative amount — default to
        # debit (statements skew debit-heavy).
        return "debit"
