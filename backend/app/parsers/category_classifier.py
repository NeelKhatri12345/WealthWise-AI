"""
WealthWise AI - Deterministic Category Classifier

Keyword-based transaction categorization — no AI/LLM calls. Applied uniformly
after ParsedTransaction creation (see TransactionParserService._run) for
every transaction produced by the active pipeline.

To add a category or refine matching, edit CATEGORY_KEYWORDS only; the
matching logic (classify_category) never needs to change.
"""

from __future__ import annotations

from typing import Optional

# Order matters: purpose/merchant-specific categories are listed before the
# generic payment-rail categories (ATM, Cash Withdrawal, UPI, NEFT, RTGS,
# IMPS, Transfer) so a description that both names a specific merchant/
# purpose AND happens to mention a payment rail (e.g. "UPI-SWIGGY-FOOD
# ORDER") resolves to the more informative category (Food). Payment-rail
# categories then catch anything left over (e.g. a plain UPI transfer to an
# individual with no recognisable merchant). First match wins.
CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Salary": ("salary", "payroll", "wages", "stipend"),
    "EMI": ("emi", "loan installment", "loan emi"),
    "Loan": (
        "loan disbursement",
        "loan repayment",
        "personal loan",
        "home loan",
        "car loan",
    ),
    "Credit Card": ("credit card bill", "card payment", "cc payment", "creditcard"),
    "Rent": ("rent payment", "house rent", "rent to", "landlord"),
    "Insurance": ("insurance", "premium", "lic ", "policy"),
    "Investment": (
        "mutual fund",
        "sip ",
        "stocks",
        "shares",
        "demat",
        "zerodha",
        "groww",
        "upstox",
        "investment",
    ),
    "Tax": ("income tax", "gst", "tds", "tax payment"),
    "Bank Charges": (
        "bank charges",
        "service charge",
        "annual fee",
        "penalty",
        "processing fee",
        "minimum balance",
    ),
    "Fuel": ("petrol", "diesel", "fuel", "hpcl", "iocl", "bpcl", "shell"),
    "Utilities": (
        "electricity",
        "water bill",
        "gas bill",
        "utility",
        "broadband",
        "wifi bill",
    ),
    "Recharge": ("recharge", "prepaid", "mobile recharge", "dth"),
    "Subscription": (
        "netflix",
        "spotify",
        "amazon prime",
        "subscription",
        "hotstar",
        "youtube premium",
    ),
    "Medical": (
        "hospital",
        "pharmacy",
        "medical",
        "clinic",
        "diagnostic",
        "medicine",
        "apollo",
        "healthcare",
    ),
    "Education": ("school fee", "college fee", "tuition", "education", "university"),
    "Travel": (
        "irctc",
        "flight",
        "airlines",
        "hotel",
        "makemytrip",
        "goibibo",
        "ola ",
        "uber",
        "railway",
        "travel",
    ),
    "Entertainment": ("movie", "cinema", "bookmyshow", "pvr", "inox", "entertainment"),
    "Food": (
        "swiggy",
        "zomato",
        "food delivery",
        "food order",
        "grocery",
        "bigbasket",
        "grofers",
        "blinkit",
    ),
    "Restaurant": ("restaurant", "dine", "dining", "cafe", "eatery"),
    "Shopping": ("amazon", "flipkart", "myntra", "shopping", "mall", "retail"),
    # ── Generic payment-rail / cash categories (checked last) ────────────────
    "ATM": ("atm withdrawal", "atm wdl", "atm cash"),
    "Cash Withdrawal": ("cash withdrawal", "cash wdl", "self withdrawal"),
    "UPI": ("upi",),
    "NEFT": ("neft",),
    "RTGS": ("rtgs",),
    "IMPS": ("imps",),
    "Transfer": ("fund transfer", "transfer to", "transfer from", "money transfer", "transferred"),
}

_DEFAULT_CATEGORY = "Others"


def classify_category(description: Optional[str], merchant: Optional[str] = None) -> str:
    """
    Deterministically classify a transaction into one of CATEGORY_KEYWORDS'
    keys based on keyword matches in the description and/or merchant text.

    Returns "Others" when no keyword matches — every transaction gets a
    category; none are left as "Uncategorized".
    """
    haystack = f"{description or ''} {merchant or ''}".lower()
    if not haystack.strip():
        return _DEFAULT_CATEGORY

    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            return category

    return _DEFAULT_CATEGORY
