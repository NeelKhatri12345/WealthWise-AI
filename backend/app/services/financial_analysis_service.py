"""
WealthWise AI - Financial Analysis Service

Reads the already-extracted transaction rows stored in
Statement.processing_metadata["extracted_data"] (a JSON string), normalizes
them into lightweight dicts WITHOUT rerunning Docling or the parser pipeline,
then computes a rich FinancialSummary covering:

  - Core aggregates (income, expense, savings, savings rate)
  - Averages, extremes
  - Category distribution, income sources, most-frequent merchant
  - Monthly cash-flow and spending / income trends
  - Flags: salary, investment, loan/EMI, recurring payments
  - Special types: ATM, UPI, NEFT, IMPS, RTGS, bank charges, weekend spending
  - Health score (0-100, deterministic)
  - Deterministic recommendations

The summary is designed to be passed directly to the Gemini prompt.
No raw transaction list is ever sent to the AI.

Usage
-----
    service = FinancialAnalysisService(statement_repo=StatementRepository(db))
    summary = await service.analyze_statement(statement_id, user_id)
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional
from uuid import UUID

from dateutil import parser as dateutil_parser

from app.core.logger import logger
from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import NotFoundException, ValidationException
from app.repositories.statement_repository import StatementRepository
from app.schemas.financial_analysis_schema import (
    AnalyzeStatementResponse,
    CategoryExpense,
    FinancialSummary,
    MonthlyCashFlow,
    RecurringPayment,
    StatementPeriod,
    TopIncomeSource,
    TransactionSummaryItem,
    StructuredRecommendation,
)


# ---------------------------------------------------------------------------
# Category keyword map
# ---------------------------------------------------------------------------

_CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("Groceries", ["bigbasket", "grofers", "blinkit", "dmart", "reliance fresh",
                   "spencer", "kirana", "grocery", "supermarket", "jiomart"]),
    ("Dining/Food", ["zomato", "swiggy", "restaurant", "food court", "cafe",
                     "dhaba", "starbucks", "mcdonalds", "kfc", "burger", "pizza",
                     "dominos", "subway", "dining", "canteen", "bakery"]),
    ("Utilities/Bills", ["electricity", "bescom", "torrent power", "tata power",
                         "water bill", "gas", "bsnl", "jio", "airtel", "vodafone",
                         "broadband", "recharge", "billpay", "insurance", "lic",
                         "hdfc ergo", "bajaj allianz", "new india", "icici lombard"]),
    ("Travel/Transport", ["uber", "ola", "rapido", "irctc", "metro", "petrol",
                          "fuel", "shell", "hpcl", "bpcl", "indian oil",
                          "flight", "airline", "railway", "cab", "bus",
                          "makemytrip", "goibibo", "cleartrip", "yatra"]),
    ("Entertainment", ["netflix", "prime video", "hotstar", "spotify", "youtube",
                       "bookmyshow", "inox", "pvr", "cinema", "theatre",
                       "gaming", "steam", "playstation"]),
    ("Shopping", ["amazon", "flipkart", "myntra", "meesho", "ajio", "nykaa",
                  "tata cliq", "snapdeal", "retail", "mall", "clothing",
                  "apparel", "decathlon", "ikea", "croma", "reliance digital"]),
    ("Investment", ["mutual fund", "mf sip", "sip", "groww", "zerodha", "kite",
                    "coin", "nps", "ppf", "elss", "securities", "stock",
                    "etf", "demat", "upstox", "angelone", "icicidirect"]),
    ("Loan/EMI", ["emi", "loan repay", "home loan", "car loan", "personal loan",
                  "credit card bill", "hdfc loan", "icici loan",
                  "bajaj finance", "full & final"]),
    ("ATM/Cash", ["atm", "cash wdl", "cash withdrawal", "cash deposit"]),
    ("Bank Charges", ["min bal", "minimum balance", "service charge",
                      "bank chg", "processing fee", "penalty", "late fee",
                      "sms alert", "ecs bounce"]),
]


def _categorize(description: str) -> str:
    d = description.lower()
    for category, keywords in _CATEGORY_RULES:
        if any(kw in d for kw in keywords):
            return category
    return "Others"


# ---------------------------------------------------------------------------
# Parsing helpers (lightweight, no pipeline dependency)
# ---------------------------------------------------------------------------

def _parse_amount(value: Any) -> float:
    """Convert a raw amount field to a non-negative float. Returns 0.0 on failure."""
    if value is None or value == "":
        return 0.0
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
        return 0.0
    try:
        amt = float(cleaned)
        return -amt if negative else amt
    except ValueError:
        return 0.0


def _parse_date(value: Any) -> Optional[str]:
    """Return ISO date string (YYYY-MM-DD) or None."""
    if not value:
        return None
    try:
        return dateutil_parser.parse(str(value), fuzzy=False, dayfirst=True).date().isoformat()
    except Exception:
        try:
            return dateutil_parser.parse(str(value)).date().isoformat()
        except Exception:
            return None


def _to_month(iso_date: str) -> str:
    """Return YYYY-MM from YYYY-MM-DD."""
    return iso_date[:7] if len(iso_date) >= 7 else ""


def _normalize_rows(raw_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Convert raw Docling table rows into normalized transaction dicts.

    Supports both schemas produced by DoclingTransactionMapper:
      Case A — "Transaction Amount" + "CrIDr" columns
      Case B — separate "Debit" / "Credit" columns

    Returns only rows with a parseable date and non-zero amount.
    """
    normalized: list[dict[str, Any]] = []
    for row in raw_rows:
        date_str = _parse_date(row.get("Value Date") or row.get("Date") or row.get("date"))
        if not date_str:
            continue

        description = str(row.get("Description") or row.get("description") or "").strip()
        if not description:
            description = "Unknown transaction"

        # ── Amount + type ─────────────────────────────────────────────────────
        if "Transaction Amount" in row:
            amount = abs(_parse_amount(row["Transaction Amount"]))
            cridr = str(row.get("CrIDr") or "").strip().lower()
            if cridr in {"cr", "credit", "c"}:
                txn_type = "credit"
            elif cridr in {"dr", "debit", "d"}:
                txn_type = "debit"
            else:
                # Negative raw amount ⟹ debit
                raw_amt = _parse_amount(row["Transaction Amount"])
                txn_type = "debit" if raw_amt <= 0 else "credit"
        else:
            debit = abs(_parse_amount(row.get("Debit") or row.get("debit") or 0))
            credit = abs(_parse_amount(row.get("Credit") or row.get("credit") or 0))
            # Already-normalized rows may carry "amount" + "type"
            if debit == 0 and credit == 0:
                raw_amount = abs(_parse_amount(row.get("amount") or 0))
                raw_type = str(row.get("type") or row.get("transaction_type") or "debit").lower()
                if raw_amount == 0:
                    continue
                amount = raw_amount
                txn_type = "credit" if "credit" in raw_type else "debit"
            elif debit > 0:
                amount = debit
                txn_type = "debit"
            else:
                amount = credit
                txn_type = "credit"

        if amount == 0:
            continue

        normalized.append({
            "date": date_str,
            "description": description,
            "amount": round(amount, 2),
            "type": txn_type,
            "category": _categorize(description),
        })

    return normalized


# ---------------------------------------------------------------------------
# Trend calculation helper
# ---------------------------------------------------------------------------

def _calculate_trend(values: list[float]) -> str:
    """Return a simple trend label from a list of monthly values."""
    if len(values) < 2:
        return "insufficient data"
    last = values[-1]
    prev = values[-2]
    if prev == 0:
        return "insufficient data"
    pct_change = (last - prev) / prev * 100
    if pct_change > 5:
        return "increasing"
    if pct_change < -5:
        return "decreasing"
    return "stable"


# ---------------------------------------------------------------------------
# FinancialAnalysisService
# ---------------------------------------------------------------------------


class FinancialAnalysisService:
    """
    Analyzes a completed bank statement and returns a rich FinancialSummary.

    Reads from Statement.processing_metadata["extracted_data"] only —
    no Docling re-extraction, no OCR, no database transaction queries.
    """

    def __init__(self, statement_repo: StatementRepository) -> None:
        self._statement_repo = statement_repo

    async def analyze_statement(
        self, statement_id: UUID, user_id: UUID, health_score: int = 0
    ) -> FinancialSummary:
        """
        Entry point — fetch statement, parse extracted_data, compute summary.

        Raises:
            NotFoundException: Statement not found or does not belong to user.
            ValidationException: Statement not yet completed, or extracted_data missing / invalid.
        """
        statement = await self._statement_repo.get_by_id_and_user(statement_id, user_id)
        if not statement:
            raise NotFoundException("Statement not found")

        if statement.status != StatementStatusEnum.COMPLETED:
            raise ValidationException(
                f"Statement is not yet completed (current status: {statement.status.value}). "
                "Please wait for processing to finish before analyzing."
            )

        metadata = statement.processing_metadata or {}
        raw_extracted = metadata.get("extracted_data")

        if not raw_extracted or not str(raw_extracted).strip():
            raise ValidationException(
                "No extracted data found for this statement. "
                "The document may not have contained detectable transaction tables."
            )

        # Parse JSON string → raw row list
        try:
            raw_rows: list[dict[str, Any]] = json.loads(raw_extracted)
            if not isinstance(raw_rows, list):
                raise ValueError("extracted_data is not a list")
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(
                "FinancialAnalysisService: invalid extracted_data JSON",
                extra={"statement_id": str(statement_id)},
                exc_info=exc,
            )
            raise ValidationException(
                "The extracted data for this statement is not in a recognised format."
            )

        if not raw_rows:
            raise ValidationException(
                "No transactions were found in this statement. "
                "Ensure the PDF contains a transaction table."
            )

        # Normalize rows
        transactions = _normalize_rows(raw_rows)
        if not transactions:
            raise ValidationException(
                "All rows in the extracted data were unparseable. "
                "Please re-upload the statement."
            )

        logger.info(
            "FinancialAnalysisService: normalized transactions",
            extra={"statement_id": str(statement_id), "count": len(transactions)},
        )

        summary = self._compute_summary(
            transactions=transactions,
            statement_id=str(statement_id),
            health_score=health_score,
        )
        return summary

    # ── Core computation ──────────────────────────────────────────────────────

    def _compute_summary(
        self,
        transactions: list[dict[str, Any]],
        statement_id: str,
        health_score: int,
    ) -> FinancialSummary:
        credits = [t for t in transactions if t["type"] == "credit"]
        debits  = [t for t in transactions if t["type"] == "debit"]

        total_income  = round(sum(t["amount"] for t in credits), 2)
        total_expense = round(sum(t["amount"] for t in debits), 2)
        net_savings   = round(total_income - total_expense, 2)
        savings_rate  = round((net_savings / total_income * 100) if total_income > 0 else 0.0, 2)

        avg_credit = round(total_income / len(credits), 2) if credits else 0.0
        avg_debit  = round(total_expense / len(debits), 2) if debits else 0.0

        # Extremes
        highest_expense = self._max_transaction(debits)
        highest_income  = self._max_transaction(credits)

        # Categories
        top_expense_categories = self._top_categories(debits, total_expense)
        top_income_sources     = self._top_income_sources(credits)
        most_frequent_merchant = self._most_frequent_merchant(transactions)

        # Monthly
        monthly_cash_flow = self._monthly_cash_flow(transactions)
        monthly_expense_values = [m.expense for m in monthly_cash_flow]
        monthly_income_values  = [m.income  for m in monthly_cash_flow]
        spending_trend = _calculate_trend(monthly_expense_values)
        income_trend   = _calculate_trend(monthly_income_values)

        # Statement period
        dates = sorted(t["date"] for t in transactions if t["date"])
        period = StatementPeriod(start=dates[0], end=dates[-1]) if dates else None

        # Flags
        salary_detected      = self._detect_salary(credits)
        investment_detected  = any(t["category"] == "Investment" for t in debits)
        loan_detected        = any(t["category"] == "Loan/EMI" for t in debits)

        # Recurring
        recurring_payments = self._detect_recurring(debits)

        # Special totals
        atm_total  = self._sum_matching(debits, ["atm", "cash wdl", "cash withdrawal"])
        upi_total  = self._sum_matching(transactions, ["upi", "ybl", "paytm upi", "gpay", "phonepe", "bhim"])
        neft_total = self._sum_matching(transactions, ["neft"])
        imps_total = self._sum_matching(transactions, ["imps"])
        rtgs_total = self._sum_matching(transactions, ["rtgs"])
        bank_charges_total = self._sum_matching(
            debits, ["min bal", "minimum balance", "service charge", "bank chg",
                     "processing fee", "sms alert", "ecs bounce", "penalty", "late fee"]
        )
        weekend_total = self._weekend_spending(debits)

        # Large transactions (≥ ₹10,000)
        large_txns = [
            TransactionSummaryItem(
                date=t["date"], description=t["description"],
                amount=t["amount"], type=t["type"]
            )
            for t in sorted(debits, key=lambda x: x["amount"], reverse=True)
            if t["amount"] >= 10_000
        ][:10]

        # Recommendations
        recommendations = self._recommendations(
            savings_rate=savings_rate,
            net_savings=net_savings,
            investment_detected=investment_detected,
            bank_charges_total=bank_charges_total,
            weekend_total=weekend_total,
            total_expense=total_expense,
            loan_detected=loan_detected,
        )

        structured_recommendations = self._structured_recommendations(
            savings_rate=savings_rate,
            net_savings=net_savings,
            investment_detected=investment_detected,
            bank_charges_total=bank_charges_total,
            weekend_total=weekend_total,
            total_expense=total_expense,
            loan_detected=loan_detected,
        )

        return FinancialSummary(
            statement_id=statement_id,
            generated_at=datetime.now(tz=timezone.utc).isoformat(),
            total_income=total_income,
            total_expense=total_expense,
            net_savings=net_savings,
            savings_rate=savings_rate,
            transaction_count=len(transactions),
            average_credit=avg_credit,
            average_debit=avg_debit,
            highest_expense=highest_expense,
            highest_income=highest_income,
            top_expense_categories=top_expense_categories,
            top_income_sources=top_income_sources,
            most_frequent_merchant=most_frequent_merchant,
            monthly_cash_flow=monthly_cash_flow,
            spending_trend=spending_trend,
            income_trend=income_trend,
            salary_detected=salary_detected,
            investment_detected=investment_detected,
            loan_detected=loan_detected,
            recurring_payments=recurring_payments,
            atm_withdrawals_total=atm_total,
            upi_transactions_total=upi_total,
            neft_transactions_total=neft_total,
            imps_transactions_total=imps_total,
            rtgs_transactions_total=rtgs_total,
            bank_charges_total=bank_charges_total,
            weekend_spending_total=weekend_total,
            large_transactions=large_txns,
            health_score=health_score,
            statement_period=period,
            recommendations=recommendations,
            structured_recommendations=structured_recommendations,
        )

    # ── Helper methods ────────────────────────────────────────────────────────

    @staticmethod
    def _max_transaction(txns: list[dict]) -> Optional[TransactionSummaryItem]:
        if not txns:
            return None
        t = max(txns, key=lambda x: x["amount"])
        return TransactionSummaryItem(
            date=t["date"], description=t["description"],
            amount=t["amount"], type=t["type"]
        )

    @staticmethod
    def _top_categories(
        debits: list[dict], total_expense: float, top_n: int = 8
    ) -> list[CategoryExpense]:
        category_totals: dict[str, float] = defaultdict(float)
        for t in debits:
            category_totals[t["category"]] += t["amount"]
        sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [
            CategoryExpense(
                category=cat,
                amount=round(amt, 2),
                percentage=round((amt / total_expense * 100) if total_expense > 0 else 0.0, 2),
            )
            for cat, amt in sorted_cats
        ]

    @staticmethod
    def _top_income_sources(
        credits: list[dict], top_n: int = 5
    ) -> list[TopIncomeSource]:
        source_totals: dict[str, list] = defaultdict(list)
        for t in credits:
            key = t["description"][:50]
            source_totals[key].append(t["amount"])
        sorted_sources = sorted(
            source_totals.items(), key=lambda x: sum(x[1]), reverse=True
        )[:top_n]
        return [
            TopIncomeSource(
                description=desc,
                amount=round(sum(amts), 2),
                count=len(amts),
            )
            for desc, amts in sorted_sources
        ]

    @staticmethod
    def _most_frequent_merchant(transactions: list[dict]) -> Optional[str]:
        merchant_counts: dict[str, int] = defaultdict(int)
        for t in transactions:
            desc = t["description"][:40]
            merchant_counts[desc] += 1
        if not merchant_counts:
            return None
        return max(merchant_counts, key=merchant_counts.__getitem__)

    @staticmethod
    def _monthly_cash_flow(transactions: list[dict]) -> list[MonthlyCashFlow]:
        monthly: dict[str, dict[str, float]] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in transactions:
            month = _to_month(t["date"])
            if not month:
                continue
            if t["type"] == "credit":
                monthly[month]["income"] += t["amount"]
            else:
                monthly[month]["expense"] += t["amount"]
        result = []
        for month in sorted(monthly.keys()):
            inc = round(monthly[month]["income"], 2)
            exp = round(monthly[month]["expense"], 2)
            result.append(MonthlyCashFlow(
                month=month,
                income=inc,
                expense=exp,
                savings=round(inc - exp, 2),
            ))
        return result

    @staticmethod
    def _detect_salary(credits: list[dict]) -> bool:
        salary_keywords = ["salary", " sal ", "payroll", "direct deposit", "ctc",
                           "monthly pay", "wage", "stipend"]
        for t in credits:
            d = t["description"].lower()
            if any(kw in d for kw in salary_keywords):
                return True
        return False

    @staticmethod
    def _detect_recurring(debits: list[dict]) -> list[RecurringPayment]:
        """
        A payment is recurring if the same description prefix appears in
        at least 2 different calendar months with amounts within 20% of each other.
        """
        groups: dict[str, list[dict]] = defaultdict(list)
        for t in debits:
            key = t["description"][:35].strip()
            groups[key].append(t)

        result: list[RecurringPayment] = []
        for desc, txns in groups.items():
            months = {_to_month(t["date"]) for t in txns if t["date"]}
            if len(months) < 2:
                continue
            amounts = [t["amount"] for t in txns]
            if not amounts:
                continue
            max_amt = max(amounts)
            min_amt = min(amounts)
            # Amounts within 20% tolerance
            if min_amt > 0 and (max_amt - min_amt) / min_amt <= 0.20:
                result.append(RecurringPayment(
                    description=desc,
                    average_amount=round(sum(amounts) / len(amounts), 2),
                    months_detected=len(months),
                    frequency="monthly" if len(months) >= 2 else "irregular",
                ))
        return sorted(result, key=lambda r: r.average_amount, reverse=True)[:10]

    @staticmethod
    def _sum_matching(transactions: list[dict], keywords: list[str]) -> float:
        total = 0.0
        for t in transactions:
            d = t["description"].lower()
            if any(kw in d for kw in keywords):
                total += t["amount"]
        return round(total, 2)

    @staticmethod
    def _weekend_spending(debits: list[dict]) -> float:
        from datetime import date as date_cls
        total = 0.0
        for t in debits:
            try:
                d = date_cls.fromisoformat(t["date"])
                if d.weekday() in {5, 6}:  # Saturday=5, Sunday=6
                    total += t["amount"]
            except (ValueError, TypeError):
                pass
        return round(total, 2)

    @staticmethod
    def _structured_recommendations(
        savings_rate: float,
        net_savings: float,
        investment_detected: bool,
        bank_charges_total: float,
        weekend_total: float,
        total_expense: float,
        loan_detected: bool,
    ) -> list[StructuredRecommendation]:
        structured_tips: list[StructuredRecommendation] = []

        if net_savings < 0:
            structured_tips.append(
                StructuredRecommendation(
                    title="Reduce discretionary spending",
                    description="You spent more than you earned this period. Review discretionary spending (dining, shopping, entertainment) to restore positive cash flow.",
                    emoji="⚠️"
                )
            )
        elif savings_rate < 10:
            structured_tips.append(
                StructuredRecommendation(
                    title="Increase savings rate",
                    description="Your savings rate is below 10%. Aim to save at least 20% of income. Consider a zero-based budget to identify leakages.",
                    emoji="💡"
                )
            )
        elif savings_rate < 20:
            structured_tips.append(
                StructuredRecommendation(
                    title="Optimize your savings",
                    description="Your savings rate is below the recommended 20%. Small reductions in dining or entertainment can make a meaningful difference.",
                    emoji="📊"
                )
            )

        if not investment_detected:
            structured_tips.append(
                StructuredRecommendation(
                    title="Start investing",
                    description="No investment transactions detected. Consider starting a monthly SIP (₹500–₹2,000) in an index fund to build long-term wealth.",
                    emoji="📈"
                )
            )

        if bank_charges_total > 0:
            structured_tips.append(
                StructuredRecommendation(
                    title="Reduce bank charges",
                    description=f"Bank charges of ₹{bank_charges_total:,.2f} were detected. Maintain the minimum balance and minimise ATM withdrawals to avoid fees.",
                    emoji="🏦"
                )
            )

        if total_expense > 0 and (weekend_total / total_expense) > 0.30:
            structured_tips.append(
                StructuredRecommendation(
                    title="Control weekend spending",
                    description="Over 30% of your spending occurs on weekends. Setting a weekend budget can help reduce impulse purchases.",
                    emoji="🛍️"
                )
            )

        if loan_detected and savings_rate < 30:
            structured_tips.append(
                StructuredRecommendation(
                    title="Build emergency fund",
                    description="You have active loan/EMI payments. Prioritise building an emergency fund (3–6 months of expenses) before increasing discretionary spending.",
                    emoji="🔒"
                )
            )

        if not structured_tips:
            structured_tips.append(
                StructuredRecommendation(
                    title="Keep up the good work",
                    description="Your finances look healthy! Keep maintaining a positive savings rate and continue investing regularly.",
                    emoji="✅"
                )
            )

        return structured_tips

    @staticmethod
    def _recommendations(
        savings_rate: float,
        net_savings: float,
        investment_detected: bool,
        bank_charges_total: float,
        weekend_total: float,
        total_expense: float,
        loan_detected: bool,
    ) -> list[str]:
        tips: list[str] = []

        if net_savings < 0:
            tips.append(
                "⚠️ Your expenses exceeded your income this period. "
                "Review discretionary spending (dining, shopping, entertainment) to restore positive cash flow."
            )
        elif savings_rate < 10:
            tips.append(
                "💡 Your savings rate is below 10%. "
                "Aim to save at least 20% of income. Consider a zero-based budget to identify leakages."
            )
        elif savings_rate < 20:
            tips.append(
                "📊 Your savings rate is below the recommended 20%. "
                "Small reductions in dining or entertainment can make a meaningful difference."
            )

        if not investment_detected:
            tips.append(
                "📈 No investment transactions detected. "
                "Consider starting a monthly SIP (₹500–₹2,000) in an index fund to build long-term wealth."
            )

        if bank_charges_total > 0:
            tips.append(
                f"🏦 Bank charges of ₹{bank_charges_total:,.2f} were detected. "
                "Maintain the minimum balance and minimise ATM withdrawals to avoid fees."
            )

        if total_expense > 0 and (weekend_total / total_expense) > 0.30:
            tips.append(
                "🛍️ Over 30% of your spending occurs on weekends. "
                "Setting a weekend budget can help reduce impulse purchases."
            )

        if loan_detected and savings_rate < 30:
            tips.append(
                "🔒 You have active loan/EMI payments. "
                "Prioritise building an emergency fund (3–6 months of expenses) before increasing discretionary spending."
            )

        if not tips:
            tips.append(
                "✅ Your finances look healthy! "
                "Keep maintaining a positive savings rate and continue investing regularly."
            )

        return tips
