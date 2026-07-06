"""
WealthWise AI - Unit Tests: RegexTransactionParser

Covers the default transaction parser's line-level extraction logic:
  - Date extraction (numeric and month-name formats)
  - Amount extraction (single amount, amount+balance, ambiguous 3+ matches)
  - Debit/credit detection (explicit sign, parentheses, keyword heuristics)
  - Merchant / description extraction
  - Confidence scoring
  - Line-level stats (total / parsed / skipped) and non-transaction skipping

No I/O, no database — pure function tests on RegexTransactionParser.
"""

from datetime import date
from decimal import Decimal

from app.parsers.regex_parser import RegexTransactionParser


def _parser() -> RegexTransactionParser:
    return RegexTransactionParser()


# ── Date extraction ─────────────────────────────────────────────────────────


def test_parses_slash_date_and_negative_amount_as_debit() -> None:
    result = _parser().parse("01/05/2024 STARBUCKS COFFEE SEATTLE WA -4.50")

    assert result.parsed_lines == 1
    txn = result.transactions[0]
    assert txn.date == date(2024, 1, 5)
    assert txn.amount == Decimal("4.50")
    assert txn.transaction_type == "debit"
    assert txn.merchant is not None
    assert txn.confidence == 1.0


def test_parses_month_name_date_with_lower_confidence() -> None:
    result = _parser().parse("Jan 05, 2024 GROCERY STORE 25.99")

    txn = result.transactions[0]
    assert txn.date == date(2024, 1, 5)
    assert txn.amount == Decimal("25.99")
    # Month-name dates are lower confidence (0.8) than numeric ones (1.0).
    assert txn.confidence < 1.0


def test_line_without_any_date_is_skipped() -> None:
    result = _parser().parse("ACCOUNT SUMMARY FOR JANUARY")

    assert result.transactions == []
    assert result.skipped_lines == 1


def test_line_with_date_but_no_amount_is_skipped() -> None:
    result = _parser().parse("01/05/2024 STARTING BALANCE")

    assert result.transactions == []
    assert result.skipped_lines == 1


# ── Amount extraction ────────────────────────────────────────────────────────


def test_two_amounts_treated_as_amount_and_balance() -> None:
    result = _parser().parse("2024-01-06 DIRECT DEPOSIT PAYROLL 1500.00 2400.00")

    txn = result.transactions[0]
    assert txn.amount == Decimal("1500.00")
    assert txn.balance == Decimal("2400.00")
    assert txn.transaction_type == "credit"


def test_parenthesized_amount_is_treated_as_debit_even_with_credit_keyword() -> None:
    """Explicit sign notation must win over keyword-based guessing."""
    result = _parser().parse("03/10/2024 REFUND MERCHANT (25.00)")

    txn = result.transactions[0]
    assert txn.amount == Decimal("25.00")
    assert txn.transaction_type == "debit"
    assert txn.confidence == 1.0  # explicit sign => full type confidence


def test_ambiguous_amount_count_lowers_confidence() -> None:
    result = _parser().parse("01/05/2024 CHECK NO 100.00 250.00 5000.00")

    txn = result.transactions[0]
    # 3 amount-shaped tokens: last two are used as (amount, balance).
    assert txn.amount == Decimal("250.00")
    assert txn.balance == Decimal("5000.00")
    assert txn.confidence < 1.0


# ── Debit/credit keyword detection ──────────────────────────────────────────


def test_debit_keyword_detected_without_explicit_sign() -> None:
    result = _parser().parse("04/01/2024 ATM WITHDRAWAL DOWNTOWN BRANCH 60.00")

    txn = result.transactions[0]
    assert txn.transaction_type == "debit"


def test_credit_keyword_detected_without_explicit_sign() -> None:
    result = _parser().parse("04/02/2024 MOBILE DEPOSIT CHECK 200.00")

    txn = result.transactions[0]
    assert txn.transaction_type == "credit"


def test_no_signal_defaults_to_debit_with_low_type_confidence() -> None:
    """
    With no explicit sign or keyword, `_detect_type` must guess 'debit' but
    report a low confidence (0.4) so callers can distinguish a guess from a
    confirmed classification.
    """
    transaction_type, confidence = RegexTransactionParser._detect_type(
        False, "acme widget co"
    )
    assert transaction_type == "debit"
    assert confidence == 0.4

    result = _parser().parse("04/03/2024 ACME WIDGET CO 15.00")
    txn = result.transactions[0]
    assert txn.transaction_type == "debit"
    # Overall confidence still reflects certain date+amount extraction, but
    # is lower than the explicit-sign case (1.0) purely due to the type guess.
    assert txn.confidence < 1.0


# ── Description / merchant ───────────────────────────────────────────────────


def test_description_excludes_date_and_amount_tokens() -> None:
    result = _parser().parse("01/05/2024 STARBUCKS COFFEE SEATTLE WA -4.50")

    txn = result.transactions[0]
    assert "01/05/2024" not in txn.description
    assert "-4.50" not in txn.description
    assert "4.50" not in txn.description
    assert "STARBUCKS" in txn.description


def test_description_excludes_balance_token_too() -> None:
    result = _parser().parse("2024-01-06 DIRECT DEPOSIT PAYROLL 1500.00 2400.00")

    txn = result.transactions[0]
    assert "1500.00" not in txn.description
    assert "2400.00" not in txn.description


# ── Aggregate stats ───────────────────────────────────────────────────────────


def test_parse_reports_line_level_stats() -> None:
    raw_text = "\n".join(
        [
            "STATEMENT PERIOD: JAN 2024",
            "01/05/2024 STARBUCKS COFFEE -4.50",
            "01/06/2024 STARTING BALANCE",  # no amount -> skipped
            "2024-01-07 PAYROLL DEPOSIT 1000.00",
        ]
    )
    result = _parser().parse(raw_text)

    assert result.total_lines == 4
    assert result.parsed_lines == 2
    assert result.skipped_lines == 2
    assert result.parser_name == "regex"


def test_empty_text_returns_empty_result() -> None:
    result = _parser().parse("")

    assert result.transactions == []
    assert result.total_lines == 0
    assert result.parsed_lines == 0
    assert result.skipped_lines == 0


def test_multi_page_text_separated_by_form_feed_is_handled() -> None:
    raw_text = "01/05/2024 COFFEE SHOP -4.50\f01/06/2024 GROCERY STORE -30.00"
    result = _parser().parse(raw_text)

    assert result.parsed_lines == 2
