"""
WealthWise AI - Transaction Parser Result

Shared dataclasses returned by every TransactionParser implementation.
Downstream code (TransactionParserService) depends only on this contract,
never on parser-specific internals.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Optional


@dataclass(frozen=True)
class ParsedTransaction:
    """
    A single transaction extracted from raw OCR text by a TransactionParser.

    Attributes:
        date:             Transaction date.
        description:      Cleaned line text (date/amount tokens removed).
        amount:           Transaction magnitude (always positive; direction is
                           conveyed by ``transaction_type``).
        transaction_type: 'debit' or 'credit'.
        merchant:         Best-effort merchant name extracted from description.
        balance:          Running balance printed on the same line, if present.
        confidence:       Extraction confidence in [0.0, 1.0]. Lower values
                           indicate the parser had to guess (e.g. no explicit
                           debit/credit signal found on the line).
        raw_line:         Original source line/row, kept for logging/dedup only.
        reference_number: Bank-issued transaction reference (e.g. Docling's
                           "Transaction ID" column). Not persisted — the
                           Transaction model has no matching column.
    """

    date: date
    description: str
    amount: Decimal
    transaction_type: str
    merchant: Optional[str] = None
    balance: Optional[Decimal] = None
    confidence: float = 0.0
    raw_line: str = ""
    reference_number: Optional[str] = None


@dataclass(frozen=True)
class ParsingResult:
    """Aggregated output of parsing one statement's raw OCR text."""

    transactions: list[ParsedTransaction]
    parser_name: str
    total_lines: int
    parsed_lines: int
    skipped_lines: int
