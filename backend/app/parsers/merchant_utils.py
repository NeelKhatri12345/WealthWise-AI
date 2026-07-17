"""
WealthWise AI - Merchant Extraction Helper

Shared best-effort merchant-name heuristic used by every TransactionParser
implementation (regex-based and Docling-based) so merchant extraction stays
consistent regardless of which extraction engine produced the transaction.
"""

from __future__ import annotations

import re
from typing import Optional

_MERCHANT_NOISE = re.compile(
    r"\b(POS|DEBIT CARD PURCHASE|ACH|RECURRING|PAYMENT|WITHDRAWAL|DEPOSIT|"
    r"TRANSFER|PURCHASE|UPI|IMPS|NEFT|RTGS|NACH|BBPS|CHEQUE|CASH WITHDRAWAL|"
    r"CASH DEPOSIT)\b.*$",
    re.IGNORECASE,
)


def extract_merchant(description: str) -> Optional[str]:
    """Best-effort merchant name derived from a transaction description."""
    if not description:
        return None
    cleaned = _MERCHANT_NOISE.sub("", description).strip(" -*#")
    cleaned = re.split(r"[*]|\s{2,}", cleaned)[0].strip()
    return cleaned or None
