"""
WealthWise AI - OCR Client

Strategy pattern: pluggable OCR backends.
- PDF: pdfplumber (local, no API key needed) — default
- CSV: pandas-based parser
- Extension points: AWS Textract, Google Document AI, Tesseract
"""

import csv
import io
from typing import Any

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

# Expected CSV column mappings (handles common bank export formats)
CSV_COLUMN_MAPS = [
    # Format 1: Standard bank export
    {
        "date": "Date",
        "description": "Description",
        "amount": "Amount",
        "balance": "Balance",
    },
    # Format 2: Debit/Credit split
    {
        "date": "Date",
        "description": "Narration",
        "debit": "Debit",
        "credit": "Credit",
        "balance": "Balance",
    },
    # Format 3: Indian bank format
    {
        "date": "Txn Date",
        "description": "Description",
        "amount": "Amount (INR)",
        "balance": "Balance",
    },
]


class OCRClient:

    def __init__(self, _settings=None) -> None:
        pass  # No stateful config needed for local OCR

    async def extract_from_pdf(self, file_bytes: bytes) -> list[dict]:
        """
        Extract transactions from a PDF bank statement using pdfplumber.
        Returns a list of raw transaction dicts for normalization.
        """
        try:
            import pdfplumber

            transactions = []

            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        if not table or len(table) < 2:
                            continue
                        headers = [str(h).strip() if h else "" for h in table[0]]
                        for row in table[1:]:
                            if not any(row):
                                continue
                            raw = dict(zip(headers, row))
                            txn = self._normalize_row(raw)
                            if txn:
                                transactions.append(txn)

            logger.info(f"PDF extraction: {len(transactions)} transactions found")
            return transactions

        except ImportError:
            raise RuntimeError("pdfplumber not installed. Run: pip install pdfplumber")
        except Exception as exc:
            logger.error("PDF extraction failed", exc_info=exc)
            raise

    async def extract_from_csv(self, file_bytes: bytes) -> list[dict]:
        """
        Parse CSV bank statement.
        Auto-detects column format from CSV_COLUMN_MAPS.
        """
        try:
            text = file_bytes.decode("utf-8-sig")  # Handle BOM
            reader = csv.DictReader(io.StringIO(text))
            headers = reader.fieldnames or []

            transactions = []
            for row in reader:
                txn = self._normalize_row(dict(row))
                if txn:
                    transactions.append(txn)

            logger.info(f"CSV extraction: {len(transactions)} transactions found")
            return transactions

        except Exception as exc:
            logger.error("CSV extraction failed", exc_info=exc)
            raise

    @staticmethod
    def _normalize_row(raw: dict[str, Any]) -> dict | None:
        """
        Normalize a raw table row to the standard transaction schema.
        Returns None if the row doesn't contain recognizable data.
        """
        from datetime import date
        from decimal import Decimal, InvalidOperation

        def safe_decimal(val: Any) -> Decimal:
            if val is None:
                return Decimal("0")
            cleaned = (
                str(val).replace(",", "").replace("₹", "").replace("$", "").strip()
            )
            try:
                return Decimal(cleaned)
            except InvalidOperation:
                return Decimal("0")

        def parse_date(val: Any) -> date | None:
            if not val:
                return None
            import dateutil.parser

            try:
                return dateutil.parser.parse(str(val)).date()
            except Exception:
                return None

        # Try to find date, description, and amount in the row
        date_keys = ["Date", "Txn Date", "Transaction Date", "date"]
        desc_keys = [
            "Description",
            "Narration",
            "Details",
            "Particulars",
            "description",
        ]
        amount_keys = ["Amount", "Amount (INR)", "amount"]
        debit_keys = ["Debit", "Withdrawal", "debit"]
        credit_keys = ["Credit", "Deposit", "credit"]
        balance_keys = ["Balance", "balance"]

        txn_date = None
        for key in date_keys:
            if key in raw and raw[key]:
                txn_date = parse_date(raw[key])
                break

        if not txn_date:
            return None

        description = ""
        for key in desc_keys:
            if key in raw and raw[key]:
                description = str(raw[key]).strip()
                break

        if not description:
            return None

        # Determine amount and type
        amount = Decimal("0")
        txn_type = "debit"

        # Check for debit/credit split columns
        debit_val = None
        credit_val = None
        for key in debit_keys:
            if key in raw and raw[key]:
                debit_val = safe_decimal(raw[key])
                break
        for key in credit_keys:
            if key in raw and raw[key]:
                credit_val = safe_decimal(raw[key])
                break

        if debit_val and debit_val > 0:
            amount = debit_val
            txn_type = "debit"
        elif credit_val and credit_val > 0:
            amount = credit_val
            txn_type = "credit"
        else:
            for key in amount_keys:
                if key in raw and raw[key]:
                    amount = safe_decimal(raw[key])
                    txn_type = "credit" if amount >= 0 else "debit"
                    amount = abs(amount)
                    break

        if amount == 0:
            return None

        balance = None
        for key in balance_keys:
            if key in raw and raw[key]:
                balance = safe_decimal(raw[key])
                break

        return {
            "date": txn_date,
            "description": description[:512],
            "amount": amount,
            "transaction_type": txn_type,
            "balance": balance,
        }
