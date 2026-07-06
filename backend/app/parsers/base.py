"""
WealthWise AI - Transaction Parser Abstraction

Defines the interface every transaction parser must implement.
All business logic (TransactionParserService) depends ONLY on
TransactionParser, never on concrete implementations.

Adding a new parser requires:
  1. Subclass TransactionParser and implement `parse()`.
  2. Wire the new implementation wherever a TransactionParser is
     constructed (see app/core/dependencies.py::get_transaction_parser).
  No other code needs to change.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.parsers.result import ParsingResult


class TransactionParser(ABC):
    """Abstract base class for all transaction parsers."""

    @property
    @abstractmethod
    def parser_name(self) -> str:
        """Machine-readable name of this parser (e.g. "regex"). Used in logging."""

    @abstractmethod
    def parse(self, raw_text: str) -> ParsingResult:
        """
        Parse raw OCR text into structured transactions.

        Args:
            raw_text: Full OCR text for a statement (may span multiple pages,
                      separated by form-feed characters).

        Returns:
            ParsingResult containing every transaction the parser could
            extract, plus line-level stats for observability.

        Note:
            Parsing is CPU-bound and synchronous — callers running inside an
            async context call it directly; statement-sized text parses in
            well under a millisecond per line.
        """
