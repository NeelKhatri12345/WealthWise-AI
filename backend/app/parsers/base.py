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
    def parse(self, extracted_data: str) -> ParsingResult:
        """
        Parse a statement's serialized extraction output into transactions.

        Args:
            extracted_data: Serialized output from the document extraction
                            stage — Docling's structured table JSON for
                            DoclingTransactionMapper (the active pipeline),
                            or legacy free-text OCR output for
                            RegexTransactionParser (not called by the active
                            pipeline; kept for backward compatibility only).

        Returns:
            ParsingResult containing every transaction the parser could
            extract, plus row/line-level stats for observability.

        Note:
            Parsing is CPU-bound and synchronous — callers running inside an
            async context call it directly; statement-sized input parses in
            well under a millisecond per row/line.
        """
