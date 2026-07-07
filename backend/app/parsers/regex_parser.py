"""
WealthWise AI - Regex-Based Transaction Parser

Default TransactionParser implementation. Extracts transactions from raw
OCR text using line-by-line regex heuristics — no ML/LLM dependency.

Assumptions
───────────
- Each transaction occupies exactly one line of OCR text.
- A line is a transaction candidate only if it contains both a date and at
  least one currency amount; anything else (headers, footers, disclaimers)
  is skipped.
- Amounts are stored as positive magnitudes; direction is conveyed via
  `transaction_type` ('debit' | 'credit').
- When two amounts appear on a line, the first is the transaction amount and
  the second is the running balance — the common layout on US bank and
  credit-card statements. More than two is ambiguous; the last two are used
  with a reduced confidence score.
"""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import Optional

from dateutil import parser as dateutil_parser

from app.core.logger import logger
from app.parsers.base import TransactionParser
from app.parsers.result import ParsedTransaction, ParsingResult

# ── Regex patterns ────────────────────────────────────────────────────────────

_DATE_PATTERNS: list[re.Pattern] = [
    re.compile(r"\b\d{4}-\d{1,2}-\d{1,2}\b"),  # 2024-01-05
    re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b"),  # 01/05/2024
    re.compile(r"\b\d{1,2}-\d{1,2}-\d{2,4}\b"),  # 01-05-2024
    re.compile(r"\b[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}\b"),  # Jan 05, 2024
    re.compile(r"\b\d{1,2}\s+[A-Za-z]{3,9}\.?,?\s+\d{4}\b"),  # 05 Jan 2024
]
# Patterns at index < _HIGH_CONFIDENCE_DATE_COUNT are numeric/unambiguous.
_HIGH_CONFIDENCE_DATE_COUNT = 3

_AMOUNT_PATTERN = re.compile(r"\(?-?(?:Rs\.?|₹|\$)?\s?[\d,]+\.\d{2}\)?", re.IGNORECASE)

_DEBIT_KEYWORDS = (
    "debit",
    "withdrawal",
    "purchase",
    "pos ",
    "atm",
    " dr",
    "payment to",
    "bbps",
    "nach",
    "cash withdrawal",
)
_CREDIT_KEYWORDS = (
    "credit",
    "deposit",
    "refund",
    "transfer in",
    " cr",
    "interest paid",
    "interest credit",
    "cash deposit",
)
_MERCHANT_NOISE = re.compile(
    r"\b(POS|DEBIT CARD PURCHASE|ACH|RECURRING|PAYMENT|WITHDRAWAL|DEPOSIT|"
    r"TRANSFER|PURCHASE|UPI|IMPS|NEFT|RTGS|NACH|BBPS|CHEQUE|CASH WITHDRAWAL|"
    r"CASH DEPOSIT)\b.*$",
    re.IGNORECASE,
)

_MIN_LINE_LENGTH = 6


class RegexTransactionParser(TransactionParser):
    """Default regex/heuristic-based transaction parser."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        logger.info("Using RegexTransactionParser")

    @property
    def parser_name(self) -> str:
        return "regex"

    def parse(self, raw_text: str) -> ParsingResult:
        logger.info("Starting RegexTransactionParser.parse()")
        lines = [ln.strip() for ln in raw_text.replace("\f", "\n").splitlines()]
        total_lines = len(lines)
        logger.info(f"RegexTransactionParser: total OCR lines = {total_lines}")

        transactions: list[ParsedTransaction] = []
        skipped = 0

        # Group lines into transaction blocks
        blocks: list[str] = []
        current_block: list[str] = []
        
        for line in lines:
            if not line:
                continue
                
            # Check if line looks like the start of a transaction block
            is_start = False
            for pattern in _DATE_PATTERNS:
                if pattern.search(line):
                    is_start = True
                    break
                    
            if is_start:
                if current_block:
                    blocks.append(" ".join(current_block))
                current_block = [line]
            elif current_block:
                current_block.append(line)
            else:
                skipped += 1
                
        if current_block:
            blocks.append(" ".join(current_block))

        for block_text in blocks:
            if len(block_text) < _MIN_LINE_LENGTH or not any(c.isdigit() for c in block_text):
                skipped += 1
                continue

            parsed = self._parse_line(block_text)
            if parsed is None:
                skipped += 1
                continue

            transactions.append(parsed)

        logger.info(
            "RegexTransactionParser: parse complete",
            extra={
                "total_lines": total_lines,
                "parsed_lines": len(transactions),
                "skipped_lines": skipped,
            },
        )
        logger.info(f"RegexTransactionParser: Total blocks created: {len(blocks)}")
        logger.info(f"RegexTransactionParser: Total transactions parsed: {len(transactions)}")
        logger.info(f"RegexTransactionParser: Total skipped: {skipped}")

        return ParsingResult(
            transactions=transactions,
            parser_name=self.parser_name,
            total_lines=total_lines,
            parsed_lines=len(transactions),
            skipped_lines=skipped,
        )

    # ── Per-line extraction ───────────────────────────────────────────────────

    def _parse_line(self, line: str) -> Optional[ParsedTransaction]:
        date_value, date_span, date_confidence = self._extract_date(line)
        if date_value is None:
            return None

        remainder = (line[: date_span[0]] + " " + line[date_span[1] :]).strip()

        amount, balance, amount_confidence, consumed_spans, is_negative = self._extract_amount(
            remainder
        )
        if amount is None:
            return None

        desc_text = remainder
        for start, end in sorted(consumed_spans, key=lambda s: s[0], reverse=True):
            desc_text = desc_text[:start] + " " + desc_text[end:]
        description = re.sub(r"\s{2,}", " ", desc_text).strip(" -*#\t")
        if not description:
            description = "Unknown transaction"

        transaction_type, type_confidence = self._detect_type(is_negative, description)
        merchant = self._extract_merchant(description)

        confidence = (
            date_confidence * 0.35
            + amount_confidence * 0.35
            + type_confidence * 0.20
            + (0.10 if merchant else 0.05)
        )

        return ParsedTransaction(
            date=date_value,
            description=description,
            amount=amount,
            transaction_type=transaction_type,
            merchant=merchant,
            balance=balance,
            confidence=round(min(confidence, 1.0), 2),
            raw_line=line,
        )

    @staticmethod
    def _extract_date(line: str):
        """Return (date, span, confidence) for the first recognisable date, or (None, None, 0.0)."""
        for idx, pattern in enumerate(_DATE_PATTERNS):
            match = pattern.search(line)
            if not match:
                continue
            try:
                parsed = dateutil_parser.parse(match.group(), fuzzy=False).date()
            except (ValueError, OverflowError):
                continue
            confidence = 1.0 if idx < _HIGH_CONFIDENCE_DATE_COUNT else 0.8
            return parsed, match.span(), confidence
        return None, None, 0.0

    @staticmethod
    def _extract_amount(text: str):
        """
        Return (amount, balance, confidence, consumed_spans, is_negative) for
        the best amount match(es) in ``text``, or (None, None, 0.0, [], False)
        if none can be parsed. ``consumed_spans`` locates every token used
        (amount, and balance if present) within ``text`` so the caller can
        strip them out to build the description.
        """
        matches = list(_AMOUNT_PATTERN.finditer(text))
        if not matches:
            return None, None, 0.0, [], False

        def to_decimal(raw: str) -> tuple[Optional[Decimal], bool]:
            cleaned = raw.strip()
            negative = cleaned.startswith("-") or (
                cleaned.startswith("(") and cleaned.endswith(")")
            )
            cleaned = cleaned.replace("$", "").replace("Rs.", "").replace("Rs", "").replace("₹", "").replace(",", "").replace(" ", "")
            cleaned = cleaned.strip("()").lstrip("-")
            try:
                return Decimal(cleaned), negative
            except InvalidOperation:
                return None, False

        if len(matches) == 1:
            value, negative = to_decimal(matches[0].group())
            if value is None:
                return None, None, 0.0, [], False
            return value, None, 1.0, [matches[0].span()], negative

        if len(matches) == 2:
            amount_match, balance_match = matches[0], matches[1]
            confidence = 1.0
        else:
            amount_match, balance_match = matches[-2], matches[-1]
            confidence = 0.6
            logger.debug(
                "RegexTransactionParser: ambiguous amount count on line",
                extra={"match_count": len(matches)},
            )

        amount_value, negative = to_decimal(amount_match.group())
        balance_value, _ = to_decimal(balance_match.group())
        if amount_value is None:
            return None, None, 0.0, [], False

        return (
            amount_value,
            balance_value,
            confidence,
            [amount_match.span(), balance_match.span()],
            negative,
        )

    @staticmethod
    def _detect_type(is_negative: bool, description: str) -> tuple[str, float]:
        """Return (transaction_type, confidence)."""
        if is_negative:
            return "debit", 1.0

        lowered = description.lower()
        has_credit_kw = any(kw in lowered for kw in _CREDIT_KEYWORDS)
        has_debit_kw = any(kw in lowered for kw in _DEBIT_KEYWORDS)

        if has_credit_kw and not has_debit_kw:
            return "credit", 0.85
        if has_debit_kw and not has_credit_kw:
            return "debit", 0.85

        # No explicit sign or keyword — default to debit (statements skew
        # debit-heavy) but flag the guess with a low confidence score.
        return "debit", 0.4

    @staticmethod
    def _extract_merchant(description: str) -> Optional[str]:
        if not description:
            return None
        cleaned = _MERCHANT_NOISE.sub("", description).strip(" -*#")
        cleaned = re.split(r"[*]|\s{2,}", cleaned)[0].strip()
        return cleaned or None
