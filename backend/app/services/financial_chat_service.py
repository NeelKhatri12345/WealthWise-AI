"""
WealthWise AI - Financial Chat Service

Guided 10-step financial profile chatbot with:
 - Strict per-step input validation (rejects gibberish / irrelevant answers)
 - Dynamic flow: Student/Unemployed do NOT get a salary prompt
 - Per-step UI hints: input_type, quick_replies, allow_free_text
 - No step advancement on invalid answers

Step map (0-indexed):
  0  → age_group
  1  → employment_type
  2  → income / income source  (dynamic based on step-1)
  3  → earning_members + dependents_count
  4  → loans / EMI / debt       (skip EMI detail if "no loans")
  5  → emergency_fund
  6  → insurance
  7  → investments
  8  → risk_comfort
  9  → financial_goals
"""

from __future__ import annotations

import re
from typing import Literal, Optional
from uuid import UUID

from app.core.config import get_settings
from app.core.logger import logger
from app.exceptions.custom_exceptions import ForbiddenException, NotFoundException
from app.repositories.financial_chat_repository import FinancialChatRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.financial_chat_schema import (
    ChatSessionResponse,
    SendMessageResponse,
    StartChatResponse,
)
from app.services.financial_profile_service import FinancialProfileService

settings = get_settings()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TOTAL_STEPS = 10

_VALIDATION_ERROR_MSG = (
    "Please choose one of the options or enter a relevant answer for this question."
)

_COMPLETION_MESSAGE = (
    "🎉 Excellent! Your financial profile is now complete.\n\n"
    "I've captured all the key information needed to calculate your personalised "
    "Financial Health Score. Click **Generate Health Score** to see your detailed assessment."
)

# ---------------------------------------------------------------------------
# Step definitions
# ---------------------------------------------------------------------------

InputType = Literal["chips", "amount", "text"]


class StepDef:
    """Immutable descriptor for one chat step."""

    __slots__ = (
        "step",
        "question",
        "quick_replies",
        "input_type",
        "allow_free_text",
        "fields",
    )

    def __init__(
        self,
        step: int,
        question: str,
        quick_replies: list[str],
        input_type: InputType,
        allow_free_text: bool,
        fields: list[str],
    ) -> None:
        self.step = step
        self.question = question
        self.quick_replies = quick_replies
        self.input_type = input_type
        self.allow_free_text = allow_free_text
        self.fields = fields


_STEPS: list[StepDef] = [
    # Step 0 – age group
    StepDef(
        step=0,
        question=(
            "Welcome! I'm here to help build your personalised financial profile. 🎯\n\n"
            "Let's start with the basics.\n\n"
            "**What is your age group?**"
        ),
        quick_replies=["18–25", "26–35", "36–45", "46–55", "55+"],
        input_type="chips",
        allow_free_text=False,
        fields=["age_range"],
    ),
    # Step 1 – employment type
    StepDef(
        step=1,
        question=(
            "Great! Now, **what best describes your current employment status?**"
        ),
        quick_replies=[
            "Salaried",
            "Self-Employed",
            "Business Owner",
            "Freelancer",
            "Student",
            "Unemployed",
            "Retired",
        ],
        input_type="chips",
        allow_free_text=False,
        fields=["employment_type"],
    ),
    # Step 2 – income (question text & chips generated dynamically based on employment)
    StepDef(
        step=2,
        question="income_dynamic",  # replaced at runtime
        quick_replies=[],           # replaced at runtime
        input_type="chips",
        allow_free_text=True,       # allow typing amounts
        fields=["monthly_income", "family_income"],
    ),
    # Step 3 – household
    StepDef(
        step=3,
        question=(
            "How many **earning members** are there in your household?\n"
            "And how many **dependents** (children, parents, etc.) do you support?"
        ),
        quick_replies=[
            "1 earner, 0 dependents",
            "1 earner, 1–2 dependents",
            "2 earners, 0 dependents",
            "2 earners, 1–2 dependents",
            "3+ earners, 2+ dependents",
        ],
        input_type="chips",
        allow_free_text=True,
        fields=["earning_members", "dependents_count"],
    ),
    # Step 4 – loans
    StepDef(
        step=4,
        question=(
            "**Do you currently have any active loans, EMIs, or credit card dues?**\n\n"
            "If yes, which types?"
        ),
        quick_replies=[
            "No active loans",
            "Home Loan",
            "Car / Vehicle Loan",
            "Personal Loan",
            "Education Loan",
            "Credit Card Dues",
            "Multiple Loans",
        ],
        input_type="chips",
        allow_free_text=True,
        fields=["has_loans", "loan_types", "monthly_emi", "total_debt"],
    ),
    # Step 5 – emergency fund
    StepDef(
        step=5,
        question=(
            "**How many months of expenses can your emergency fund cover?**\n\n"
            "(Emergency fund = savings set aside exclusively for unexpected events)"
        ),
        quick_replies=[
            "No emergency fund",
            "Less than 1 month",
            "1–2 months",
            "3–6 months",
            "6+ months",
        ],
        input_type="chips",
        allow_free_text=False,
        fields=["has_emergency_fund", "emergency_fund_months"],
    ),
    # Step 6 – insurance
    StepDef(
        step=6,
        question="**Which insurance coverage do you currently have?**",
        quick_replies=[
            "Both health and life insurance",
            "Only health insurance",
            "Only life insurance",
            "Neither",
        ],
        input_type="chips",
        allow_free_text=False,
        fields=["has_health_insurance", "has_life_insurance"],
    ),
    # Step 7 – investments
    StepDef(
        step=7,
        question=(
            "How much do you invest **monthly** (in ₹)?\n\n"
            "Which investment types? *(Mutual Funds | Stocks | FD | PPF | NPS | Gold | Crypto)*"
        ),
        quick_replies=[
            "Not investing yet",
            "Below ₹5,000",
            "₹5,000 – ₹10,000",
            "₹10,000 – ₹25,000",
            "₹25,000+",
        ],
        input_type="chips",
        allow_free_text=True,
        fields=["monthly_investment", "investment_types"],
    ),
    # Step 8 – risk comfort
    StepDef(
        step=8,
        question=(
            "**How comfortable are you with investment risk?** 📊\n\n"
            "• **Low** — prefer guaranteed returns (FD, savings)\n"
            "• **Moderate** — balance growth and safety\n"
            "• **High** — comfortable with market volatility for higher returns"
        ),
        quick_replies=["Low risk", "Moderate risk", "High risk"],
        input_type="chips",
        allow_free_text=False,
        fields=["risk_comfort"],
    ),
    # Step 9 – financial goals
    StepDef(
        step=9,
        question=(
            "**What are your primary financial goals?** 🎯\n\n"
            "*(You can name multiple)*"
        ),
        quick_replies=[
            "Retirement",
            "Buy a House",
            "Children's Education",
            "Build Emergency Fund",
            "Wealth Building",
            "Travel",
            "Start a Business",
            "Become Debt-Free",
        ],
        input_type="chips",
        allow_free_text=True,
        fields=["financial_goals"],
    ),
]


# ---------------------------------------------------------------------------
# Dynamic question generator for step 2
# ---------------------------------------------------------------------------

def _income_step(employment: str | None) -> tuple[str, list[str], bool]:
    """Return (question, quick_replies, allow_free_text) for step 2."""
    emp = (employment or "").lower()

    if emp == "student":
        question = (
            "As a student, what is your **primary income or financial support source?**"
        )
        replies = [
            "No personal income – Family support",
            "Stipend / Scholarship",
            "Part-time job",
            "Freelance / Gigs",
            "Other",
        ]
        return question, replies, False

    if emp in ("unemployed",):
        question = (
            "Since you are currently unemployed, what is your **primary support or income source?**"
        )
        replies = [
            "No income currently",
            "Family / Spouse support",
            "Living on savings",
            "Temporary / Freelance work",
            "Other",
        ]
        return question, replies, False

    if emp == "retired":
        question = (
            "What is your **approximate monthly income** from pension, interest, or other sources? (₹)"
        )
        replies = [
            "Below ₹20,000",
            "₹20,000 – ₹40,000",
            "₹40,000 – ₹80,000",
            "Above ₹80,000",
        ]
        return question, replies, True

    # Salaried / self-employed / business / freelancer
    question = (
        "What is your **approximate monthly personal income** (in ₹)?\n\n"
        "*(Post-tax take-home or average monthly earnings)*"
    )
    replies = [
        "Below ₹25,000",
        "₹25,000 – ₹50,000",
        "₹50,000 – ₹1,00,000",
        "₹1,00,000 – ₹2,00,000",
        "Above ₹2,00,000",
    ]
    return question, replies, True


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

# Tokens that strongly suggest the answer is gibberish or off-topic
_GIBBERISH_PATTERN = re.compile(
    r"^[a-z]{4,}$",  # all-lowercase alpha, no vowels, looks like random keys
)
_RANDOM_PATTERNS = re.compile(
    r"^(asdf|qwer|zxcv|hjkl|asd|qwe|xyz|abc(?!.)|foo|bar|baz|test|na|n/a|idk)$",
    re.IGNORECASE,
)

_AGE_REPLIES = {"18–25", "26–35", "36–45", "46–55", "55+",
                "18-25", "26-35", "36-45", "46-55"}

_EMP_REPLIES = {
    "salaried", "self-employed", "self employed", "business owner", "business",
    "freelancer", "freelance", "student", "unemployed", "retired",
}

_LOAN_REPLIES = {
    "no active loans", "no loan", "no loans", "no emi", "debt free", "debt-free",
    "home loan", "car loan", "vehicle loan", "personal loan", "education loan",
    "credit card", "multiple loans", "multiple", "business loan",
}

_EMERGENCY_REPLIES = {
    "no emergency fund", "none", "less than 1 month", "1-2 months", "1–2 months",
    "3-6 months", "3–6 months", "6+ months",
}

_INSURANCE_REPLIES = {
    "both health and life insurance", "only health insurance",
    "only life insurance", "neither", "both", "health", "life",
}

_RISK_REPLIES = {"low risk", "moderate risk", "high risk", "low", "moderate", "high"}

_GOAL_REPLIES = {
    "retirement", "buy a house", "house", "children's education", "education",
    "build emergency fund", "emergency fund", "wealth building", "wealth",
    "travel", "start a business", "business", "become debt-free", "debt-free",
}


def _is_gibberish(text: str) -> bool:
    t = text.strip().lower()
    # Short single tokens with no vowels or matching random pattern
    if _RANDOM_PATTERNS.match(t):
        return True
    if len(t) < 30:
        # Check if it has any recognisable word (a–z sequences ≥ 3 chars that are vowel-bearing)
        words = re.findall(r"[a-z]{3,}", t)
        if words:
            has_vowel = any(re.search(r"[aeiou]", w) for w in words)
            if not has_vowel and len(t) < 15:
                return True
    return False


def _normalize_goal(text: str) -> str:
    # Lowercase & trim
    t = text.lower().strip()
    # Replace hyphens/dashes with space
    t = re.sub(r"[-–—]", " ", t)
    # Remove apostrophes
    t = t.replace("'", "")
    # Remove punctuation
    t = re.sub(r"[^\w\s]", "", t)
    # Collapse spaces
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def _validate_goals(text: str) -> bool:
    normalized_input = _normalize_goal(text)
    if not normalized_input:
        return False

    # Split by comma if multiple goals are provided
    parts = [p.strip() for p in text.split(",") if p.strip()]
    if not parts:
        return False

    standard_goals = {
        "retirement", "buy a house", "house", "buy house",
        "childrens education", "children education", "child education",
        "build emergency fund", "emergency fund",
        "wealth building", "travel", "start a business", "business",
        "become debt free", "debt free", "debtfree"
    }

    custom_keywords = {
        "education", "house", "debt", "retirement", "emergency",
        "business", "travel", "investment", "savings", "vehicle",
    }

    all_valid = True
    for part in parts:
        normalized_part = _normalize_goal(part)
        if not normalized_part:
            all_valid = False
            break
        # Check standard goal exactly
        if normalized_part in standard_goals:
            continue
        # Check standard goal substring
        if any(g in normalized_part for g in standard_goals):
            continue
        # Check custom keywords
        words = set(normalized_part.split())
        if any(kw in words or any(kw in w for w in words) for kw in custom_keywords):
            continue

        all_valid = False
        break

    return all_valid


def _validate_step(step: int, text: str, employment: str | None) -> bool:
    """
    Returns True if the answer is relevant for the given step.
    False → do not advance, return validation error.
    """
    t = text.strip().lower()

    if _is_gibberish(t):
        return False

    # Per-step validation
    if step == 0:
        # Must contain an age range token or a numeric age
        if re.search(r"\b(18|19|2\d|3\d|4\d|5\d|6\d|7\d)\b", text):
            return True
        if any(r.lower() in t for r in _AGE_REPLIES):
            return True
        if re.search(r"\b(18[-–]25|26[-–]35|36[-–]45|46[-–]55|55\+)\b", text, re.IGNORECASE):
            return True
        return False

    if step == 1:
        if any(r in t for r in _EMP_REPLIES):
            return True
        return False

    if step == 2:
        emp = (employment or "").lower()
        if emp in ("student", "unemployed"):
            # Must pick from offered choices or say something meaningful
            valid_kws = {
                "no income", "family", "stipend", "scholarship", "part-time",
                "part time", "freelance", "gig", "spouse", "savings", "temporary",
                "other", "support",
            }
            return any(kw in t for kw in valid_kws)
        # For earning profiles, expect a number or a range phrase
        if re.search(r"\d", text):
            return True
        if any(kw in t for kw in ["below", "above", "lakh", "thousand", "crore", "₹", "rs"]):
            return True
        return False

    if step == 3:
        # Earners + dependents — expect digits or descriptive text
        if re.search(r"\b\d\b", text):
            return True
        if any(kw in t for kw in ["earner", "dependent", "family", "member", "alone", "single", "no one"]):
            return True
        return False

    if step == 4:
        if any(r in t for r in _LOAN_REPLIES):
            return True
        # Loan amount numbers accepted
        if re.search(r"\d", text):
            return True
        return False

    if step == 5:
        if any(r in t for r in _EMERGENCY_REPLIES):
            return True
        if re.search(r"\b\d+\s*(month|mo)\b", text, re.IGNORECASE):
            return True
        if any(kw in t for kw in ["no", "yes", "have", "don't", "dont"]):
            return True
        return False

    if step == 6:
        if any(r in t for r in _INSURANCE_REPLIES):
            return True
        return False

    if step == 7:
        # Investment – expect amount, "not investing", or instrument names
        invest_kws = {
            "not investing", "no invest", "none", "below", "mutual fund", "mf",
            "stock", "equity", "fd", "ppf", "nps", "gold", "crypto", "real estate",
            "₹", "rs", "lakh", "thousand",
        }
        if re.search(r"\d", text):
            return True
        if any(kw in t for kw in invest_kws):
            return True
        return False

    if step == 8:
        if any(r in t for r in _RISK_REPLIES):
            return True
        return False

    if step == 9:
        return _validate_goals(text)

    return True  # unknown steps pass through


# ---------------------------------------------------------------------------
# Rule-based field extractors (one per step)
# ---------------------------------------------------------------------------

def _clean(text: str) -> str:
    return text.strip().lower()


def _extract_number(text: str) -> Optional[float]:
    """Extract first numeric value, handling ₹/commas/lakh/cr."""
    text = re.sub(
        r"(\d[\d,]*)\s*(?:lakh|l\b)",
        lambda m: str(float(m.group(1).replace(",", "")) * 100_000),
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"(\d[\d,]*)\s*(?:crore|cr\b)",
        lambda m: str(float(m.group(1).replace(",", "")) * 10_000_000),
        text,
        flags=re.IGNORECASE,
    )
    m = re.search(r"[\d,]+(?:\.\d+)?", text.replace(",", ""))
    if m:
        try:
            return float(m.group().replace(",", ""))
        except ValueError:
            return None
    return None


def _extract_step0(text: str, _emp: str | None = None) -> dict:
    """age_range"""
    # Check for explicit "55+" first (before the range regex, which uses \b that won't match +)
    if re.search(r"55\s*\+", text.strip()):
        return {"age_range": "55+"}

    range_direct = re.search(r"(18[-–]25|26[-–]35|36[-–]45|46[-–]55)", text, re.IGNORECASE)
    if range_direct:
        raw = range_direct.group(1).replace("–", "-")
        return {"age_range": raw}

    # Numeric age
    m = re.search(r"\b(\d{2})\b", text)
    if m:
        age = int(m.group(1))
        if 18 <= age <= 25:
            return {"age_range": "18-25"}
        if 26 <= age <= 35:
            return {"age_range": "26-35"}
        if 36 <= age <= 45:
            return {"age_range": "36-45"}
        if 46 <= age <= 55:
            return {"age_range": "46-55"}
        if age > 55:
            return {"age_range": "55+"}
    return {}



def _extract_step1(text: str, _emp: str | None = None) -> dict:
    """employment_type"""
    t = _clean(text)
    emp_map = [
        (["salaried", "salary", "employee", "job"], "salaried"),
        (["self-employed", "self employed"], "self_employed"),
        (["business owner", "business"], "business_owner"),
        (["freelan"], "freelancer"),
        (["student", "studying", "college", "school", "university"], "student"),
        (["unemployed", "no job", "not employed", "jobless"], "unemployed"),
        (["retired", "pension", "retirement"], "retired"),
    ]
    for kws, val in emp_map:
        if any(kw in t for kw in kws):
            return {"employment_type": val}
    return {}


def _extract_step2(text: str, employment: str | None = None) -> dict:
    """monthly_income, family_income — dynamic based on employment type."""
    emp = (employment or "").lower()
    t = _clean(text)
    out: dict = {}

    if emp in ("student", "unemployed"):
        # Map descriptive answers to income fields
        no_income_kws = ["no income", "family support", "family", "no personal", "no money"]
        if any(kw in t for kw in no_income_kws):
            out["monthly_income"] = 0.0
            return out

        income_source_map = [
            (["stipend", "scholarship"], "stipend"),
            (["part-time", "part time", "parttime"], "part_time"),
            (["freelance", "gig", "temporary"], "freelancer"),
            (["spouse", "husband", "wife"], "family_support"),
            (["savings"], "savings"),
        ]
        for kws, source in income_source_map:
            if any(kw in t for kw in kws):
                # Extract amount if mentioned
                v = _extract_number(text)
                if v and v > 0:
                    out["monthly_income"] = v
                else:
                    out["monthly_income"] = 0.0
                out["income_source"] = source
                return out
        # "Other"
        out["monthly_income"] = 0.0
        return out

    # Standard earning employment — parse amount
    # Handle range phrases: "below 25000", "25000-50000", etc.
    range_map = [
        (r"below\s*(?:₹|rs\.?)?\s*25[,\s]?000", 15_000.0),
        (r"25[,\s]?000\s*[-–]\s*50[,\s]?000", 37_500.0),
        (r"50[,\s]?000\s*[-–]\s*(?:1[,\s]?00[,\s]?000|1\s*lakh)", 75_000.0),
        (r"1[,\s]?00[,\s]?000\s*[-–]\s*(?:2[,\s]?00[,\s]?000|2\s*lakh)", 1_50_000.0),
        (r"above\s*(?:₹|rs\.?)?\s*2[,\s]?00[,\s]?000", 2_50_000.0),
        (r"above\s*(?:₹|rs\.?)?\s*(?:2\s*lakh)", 2_50_000.0),
    ]
    for pattern, val in range_map:
        if re.search(pattern, text, re.IGNORECASE):
            out["monthly_income"] = val
            return out

    # Extract raw numbers
    nums = []
    for raw in re.finditer(r"[\d,]+(?:\.\d+)?(?:\s*(?:lakh|l\b|crore|cr\b))?", text, re.IGNORECASE):
        v = _extract_number(raw.group())
        if v and v > 0:
            nums.append(v)
    if nums:
        out["monthly_income"] = nums[0]
    if len(nums) >= 2:
        out["family_income"] = nums[1]
    return out


def _extract_step3(text: str, _emp: str | None = None) -> dict:
    """earning_members, dependents_count."""
    out: dict = {}
    nums = [int(m) for m in re.findall(r"\b(\d+)\b", text)]
    if nums:
        out["earning_members"] = nums[0]
    if len(nums) >= 2:
        out["dependents_count"] = nums[1]
    elif any(kw in _clean(text) for kw in ["no dependent", "0 dependent", "none", "alone", "single"]):
        out["dependents_count"] = 0
    return out


def _extract_step4(text: str, _emp: str | None = None) -> dict:
    """has_loans, loan_types, monthly_emi, total_debt."""
    t = _clean(text)
    out: dict = {}

    no_loan_kws = ["no active loan", "no loan", "no emi", "debt free", "debt-free", "no debt", "no active"]
    if any(kw in t for kw in no_loan_kws):
        out["has_loans"] = False
        out["loan_types"] = []
        out["monthly_emi"] = 0.0
        out["total_debt"] = 0.0
        return out

    out["has_loans"] = True
    loan_keywords: list[tuple[str, str]] = [
        ("home", "home_loan"),
        ("housing", "home_loan"),
        ("car", "car_loan"),
        ("vehicle", "car_loan"),
        ("personal", "personal_loan"),
        ("education", "education_loan"),
        ("credit card", "credit_card"),
        ("business loan", "business_loan"),
    ]
    found: list[str] = []
    for kw, ltype in loan_keywords:
        if kw in t and ltype not in found:
            found.append(ltype)
    if found:
        out["loan_types"] = found

    # Extract amounts
    nums: list[float] = []
    for raw in re.finditer(r"[\d,]+(?:\.\d+)?(?:\s*(?:lakh|l\b|crore|cr\b))?", text, re.IGNORECASE):
        v = _extract_number(raw.group())
        if v and v > 0:
            nums.append(v)
    if len(nums) >= 1:
        out["monthly_emi"] = nums[0]
    if len(nums) >= 2:
        out["total_debt"] = nums[1]
    return out


def _extract_step5(text: str, _emp: str | None = None) -> dict:
    """has_emergency_fund, emergency_fund_months."""
    t = _clean(text)
    out: dict = {}

    no_kws = ["no emergency", "no fund", "don't have", "do not have", "none", "not have", "less than 1"]
    if any(kw in t for kw in no_kws):
        out["has_emergency_fund"] = False
        out["emergency_fund_months"] = 0.0
        return out

    out["has_emergency_fund"] = True

    if re.search(r"6\+|more than 6|six\s*\+", text, re.IGNORECASE):
        out["emergency_fund_months"] = 9.0
    elif re.search(r"3[-–]6|three.*(to|-).*six", text, re.IGNORECASE):
        out["emergency_fund_months"] = 4.0
    elif re.search(r"1[-–]2|one.*(to|-).*two", text, re.IGNORECASE):
        out["emergency_fund_months"] = 1.5
    else:
        m = re.search(r"(\d+(?:\.\d+)?)\s*(?:month|mo)", text, re.IGNORECASE)
        if m:
            out["emergency_fund_months"] = float(m.group(1))
    return out


def _extract_step6(text: str, _emp: str | None = None) -> dict:
    """has_health_insurance, has_life_insurance."""
    t = _clean(text)
    if "both" in t:
        return {"has_health_insurance": True, "has_life_insurance": True}
    if "neither" in t or ("no" in t and "insurance" in t):
        return {"has_health_insurance": False, "has_life_insurance": False}
    return {
        "has_health_insurance": "health" in t,
        "has_life_insurance": any(kw in t for kw in ["life", "term", "lic", "ulip"]),
    }


def _extract_step7(text: str, _emp: str | None = None) -> dict:
    """monthly_investment, investment_types."""
    t = _clean(text)
    out: dict = {}

    no_invest_kws = ["not investing", "not invest", "no investment", "zero investment", "none"]
    has_zero_token = bool(re.search(r"(?<!\d)0(?!\d)", text))
    if any(kw in t for kw in no_invest_kws) or has_zero_token:
        out["monthly_investment"] = 0.0
        out["investment_types"] = []
        return out

    # Range phrases
    range_map = [
        (r"below\s*(?:₹|rs\.?)?\s*5[,\s]?000", 2_500.0),
        (r"5[,\s]?000\s*[-–]\s*10[,\s]?000", 7_500.0),
        (r"10[,\s]?000\s*[-–]\s*25[,\s]?000", 17_500.0),
        (r"25[,\s]?000\s*\+?|above\s*(?:₹|rs\.?)?\s*25[,\s]?000", 30_000.0),
    ]
    for pattern, val in range_map:
        if re.search(pattern, text, re.IGNORECASE):
            out["monthly_investment"] = val
            break

    if "monthly_investment" not in out:
        for raw in re.finditer(r"[\d,]+(?:\.\d+)?(?:\s*(?:lakh|l\b))?", text, re.IGNORECASE):
            v = _extract_number(raw.group())
            if v and v > 0:
                out["monthly_investment"] = v
                break

    inv_map: list[tuple[str, str]] = [
        ("mutual fund", "mutual_funds"), ("mf", "mutual_funds"),
        ("stock", "stocks"), ("equity", "stocks"), ("share", "stocks"),
        ("fd", "fd"), ("fixed deposit", "fd"),
        ("ppf", "ppf"), ("nps", "nps"),
        ("real estate", "real_estate"), ("property", "real_estate"),
        ("crypto", "crypto"), ("bitcoin", "crypto"),
        ("gold", "gold"), ("etf", "etf"),
    ]
    found_inv: list[str] = []
    for kw, itype in inv_map:
        if kw in t and itype not in found_inv:
            found_inv.append(itype)
    # Always set investment_types so the completion field is never left NULL.
    # An empty list means "no specific types mentioned" which is a valid answer.
    out["investment_types"] = found_inv
    return out


def _extract_step8(text: str, _emp: str | None = None) -> dict:
    """risk_comfort."""
    t = _clean(text)
    if any(kw in t for kw in ["low", "safe", "conservative", "guaranteed", "fixed"]):
        return {"risk_comfort": "low"}
    if any(kw in t for kw in ["high", "aggressive", "volatile", "growth"]):
        return {"risk_comfort": "high"}
    return {"risk_comfort": "moderate"}


def _extract_step9(text: str, _emp: str | None = None) -> dict:
    """financial_goals."""
    t = _clean(text)
    goal_map: list[tuple[str, str]] = [
        ("retirement", "retirement"),
        ("house", "house"), ("home", "house"),
        ("education", "education"),
        ("emergency fund", "emergency_fund"), ("emergency", "emergency_fund"),
        ("travel", "travel"),
        ("business", "business"),
        ("wealth", "wealth_building"),
        ("debt-free", "debt_free"), ("debt free", "debt_free"),
    ]
    goals = []
    for kw, goal in goal_map:
        if kw in t and goal not in goals:
            goals.append(goal)
    return {"financial_goals": goals if goals else ["wealth_building"]}


_STEP_EXTRACTORS = [
    _extract_step0,
    _extract_step1,
    _extract_step2,
    _extract_step3,
    _extract_step4,
    _extract_step5,
    _extract_step6,
    _extract_step7,
    _extract_step8,
    _extract_step9,
]


# ---------------------------------------------------------------------------
# Helpers to build UI hint dicts
# ---------------------------------------------------------------------------

def _hints_for_step(step_idx: int, employment: str | None) -> dict:
    """Returns dict with quick_replies, input_type, allow_free_text for a step."""
    defn = _STEPS[step_idx]
    if step_idx == 2:
        q, replies, allow_ft = _income_step(employment)
        return {
            "question": q,
            "quick_replies": replies,
            "input_type": "chips",
            "allow_free_text": allow_ft,
        }
    return {
        "question": defn.question,
        "quick_replies": defn.quick_replies,
        "input_type": defn.input_type,
        "allow_free_text": defn.allow_free_text,
    }


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class FinancialChatService:
    """
    Manages the guided financial profile chat flow.

    Key behaviours:
    - Invalid answers are rejected without advancing the step.
    - Students / unemployed users never see a salary-amount prompt.
    - UI hints (quick_replies, input_type, allow_free_text) are returned with every response.
    """

    def __init__(
        self,
        chat_repo: FinancialChatRepository,
        transaction_repo: TransactionRepository,
        profile_service: FinancialProfileService,
    ) -> None:
        self._chat_repo = chat_repo
        self._txn_repo = transaction_repo
        self._profile_svc = profile_service

    # ── Public API ─────────────────────────────────────────────────────────────

    async def start_session(self, user_id: UUID) -> StartChatResponse:
        """
        Create (or reuse) a session.
        Raises ForbiddenException if user has no transactions yet.

        Priority:
          1. Resume an existing active session.
          2. Resume the most recent completed session (user refreshed after finishing).
          3. Create a brand-new session (first time or after a reset).
        """
        await self._verify_has_transactions(user_id)

        session = await self._chat_repo.get_active_session(user_id)
        is_new = False
        if session is None:
            # Check if a completed session already exists before creating a new one.
            # This prevents re-starting at step 0 when the user simply refreshes.
            session = await self._chat_repo.get_latest_completed_session(user_id)
        if session is None:
            session = await self._chat_repo.create_session(user_id)
            is_new = True

        messages = await self._chat_repo.get_messages(session.id)
        profile = await self._profile_svc.get_profile(user_id)
        employment = profile.employment_type if profile else None

        if is_new or not messages:
            step0 = _STEPS[0]
            first_msg = step0.question
            await self._chat_repo.add_message(
                session_id=session.id,
                user_id=user_id,
                sender="assistant",
                message=first_msg,
            )
            hints = _hints_for_step(0, employment)
        else:
            current_step = session.current_step
            hints = _hints_for_step(current_step, employment)
            assistant_messages = [m for m in messages if m.sender == "assistant"]
            if assistant_messages:
                first_msg = assistant_messages[-1].message
            else:
                first_msg = hints["question"]

        return StartChatResponse(
            session_id=session.id,
            status=session.status,
            current_step=session.current_step,
            first_message=first_msg,
            quick_replies=hints.get("quick_replies"),
            input_type=hints.get("input_type", "chips"),
            allow_free_text=hints.get("allow_free_text", False),
        )

    async def send_message(
        self, session_id: UUID, user_id: UUID, user_text: str
    ) -> SendMessageResponse:
        """
        Process the user's reply for the current step.
        Returns validation error (without advancing) if answer is irrelevant.
        """
        session = await self._chat_repo.get_session(session_id)
        if session is None:
            raise NotFoundException("Chat session not found")
        if session.user_id != user_id:
            raise ForbiddenException("Access denied")

        if session.status == "completed":
            hints = {}  # no next step
            return SendMessageResponse(
                session_id=session_id,
                status="completed",
                current_step=session.current_step,
                assistant_message=_COMPLETION_MESSAGE,
                profile_completion_percentage=100.0,
                is_complete=True,
                is_valid_answer=True,
                quick_replies=None,
                allow_free_text=False,
                input_type="chips",
                suggested_choices=None,
            )

        current_step = session.current_step

        # Fetch employment type from profile for dynamic step 2 handling
        profile = await self._profile_svc.get_profile(user_id)
        employment = profile.employment_type if profile else None

        # ── Validate ──────────────────────────────────────────────────────────
        is_valid = _validate_step(current_step, user_text, employment)

        if not is_valid:
            # Return current question + hints without advancing
            hints = _hints_for_step(current_step, employment)

            # Still persist the user message for audit
            await self._chat_repo.add_message(
                session_id=session_id,
                user_id=user_id,
                sender="user",
                message=user_text,
            )

            current_defn = _STEPS[current_step]
            completion_pct = profile.profile_completion_percentage if profile else 0.0

            return SendMessageResponse(
                session_id=session_id,
                status="active",
                current_step=current_step,
                assistant_message=hints["question"],
                profile_completion_percentage=completion_pct,
                is_complete=False,
                is_valid_answer=False,
                validation_message=_VALIDATION_ERROR_MSG,
                quick_replies=hints["quick_replies"],
                allow_free_text=hints["allow_free_text"],
                input_type=hints["input_type"],
                suggested_choices=hints["quick_replies"],
                extracted_fields=None,
            )

        # ── Persist user message ──────────────────────────────────────────────
        await self._chat_repo.add_message(
            session_id=session_id,
            user_id=user_id,
            sender="user",
            message=user_text,
        )

        # ── Extract fields ────────────────────────────────────────────────────
        extracted = self._extract_fields(current_step, user_text, employment)

        if settings.AI_PROVIDER != "disabled":
            try:
                ai_fields = await self._ai_extract(current_step, user_text)
                extracted.update(ai_fields)
            except Exception as exc:
                logger.warning("AI extraction failed, using rule-based only", exc_info=exc)

        # ── Update profile ────────────────────────────────────────────────────
        completion_pct = await self._profile_svc.update_fields_from_chat(user_id, extracted)

        # ── Advance step ──────────────────────────────────────────────────────
        next_step = current_step + 1
        is_complete = next_step >= TOTAL_STEPS

        if is_complete:
            await self._chat_repo.complete_session(session)
            assistant_msg = _COMPLETION_MESSAGE
            next_step = current_step
            next_hints: dict = {
                "quick_replies": None,
                "input_type": "chips",
                "allow_free_text": False,
            }
        else:
            await self._chat_repo.advance_step(session, next_step)
            # After step 1 we know employment, so refresh for dynamic step 2
            if current_step == 1 and "employment_type" in extracted:
                employment = extracted["employment_type"]
            next_hints = _hints_for_step(next_step, employment)
            assistant_msg = next_hints["question"]

        # ── Persist assistant message ─────────────────────────────────────────
        await self._chat_repo.add_message(
            session_id=session_id,
            user_id=user_id,
            sender="assistant",
            message=assistant_msg,
            extracted_fields=extracted if extracted else None,
        )

        logger.info(
            "Chat step processed",
            extra={
                "user_id": str(user_id),
                "step": current_step,
                "extracted_fields": list(extracted.keys()),
            },
        )

        return SendMessageResponse(
            session_id=session_id,
            status="completed" if is_complete else "active",
            current_step=next_step,
            assistant_message=assistant_msg,
            extracted_fields=extracted,
            profile_completion_percentage=completion_pct,
            is_complete=is_complete,
            is_valid_answer=True,
            validation_message=None,
            quick_replies=next_hints.get("quick_replies"),
            allow_free_text=next_hints.get("allow_free_text", False),
            input_type=next_hints.get("input_type", "chips"),
            suggested_choices=next_hints.get("quick_replies"),
        )

    async def get_session(self, session_id: UUID, user_id: UUID) -> ChatSessionResponse:
        """Return full session with all messages and completion %."""
        session = await self._chat_repo.get_session(session_id)
        if session is None:
            raise NotFoundException("Chat session not found")
        if session.user_id != user_id:
            raise ForbiddenException("Access denied")

        messages = await self._chat_repo.get_messages(session_id)
        profile = await self._profile_svc.get_profile(user_id)
        completion = profile.profile_completion_percentage if profile else 0.0

        from app.schemas.financial_chat_schema import ChatMessageResponse

        return ChatSessionResponse(
            id=session.id,
            user_id=session.user_id,
            status=session.status,
            current_step=session.current_step,
            started_at=session.started_at,
            completed_at=session.completed_at,
            messages=[ChatMessageResponse.model_validate(m) for m in messages],
            profile_completion_percentage=completion,
        )

    async def go_to_previous_step(self, session_id: UUID, user_id: UUID) -> SendMessageResponse:
        """
        Move the chat session back by 1 step safely.
        Allows correction and preserves existing profile data.
        Truncates the messages history after the target step's assistant question.
        Recalculates completion percentage from valid stored fields.
        """
        session = await self._chat_repo.get_session(session_id)
        if session is None:
            raise NotFoundException("Chat session not found")
        if session.user_id != user_id:
            raise ForbiddenException("Access denied")

        if session.current_step == 0:
            raise ForbiddenException("Cannot go back from the first step")

        target_step = session.current_step - 1

        # Fetch messages to find the cutoff time
        messages = await self._chat_repo.get_messages(session_id)
        assistant_msgs = [m for m in messages if m.sender == "assistant"]

        if target_step < len(assistant_msgs):
            cutoff_time = assistant_msgs[target_step].created_at
            # Delete messages after cutoff_time in the database
            from sqlalchemy import delete
            from app.models.financial_chat_message import FinancialChatMessage
            stmt = delete(FinancialChatMessage).where(
                FinancialChatMessage.session_id == session_id,
                FinancialChatMessage.created_at > cutoff_time
            )
            await self._chat_repo.db.execute(stmt)

        # Update session step & status
        session.current_step = target_step
        session.status = "active"
        session.completed_at = None
        await self._chat_repo.db.flush()

        # Recalculate completion percentage from stored fields
        profile = await self._profile_svc.get_profile(user_id)
        completion_pct = profile.profile_completion_percentage if profile else 0.0
        employment = profile.employment_type if profile else None

        hints = _hints_for_step(target_step, employment)

        return SendMessageResponse(
            session_id=session_id,
            status="active",
            current_step=target_step,
            assistant_message=hints["question"],
            extracted_fields=None,
            profile_completion_percentage=completion_pct,
            is_complete=False,
            is_valid_answer=True,
            validation_message=None,
            quick_replies=hints.get("quick_replies"),
            allow_free_text=hints.get("allow_free_text", False),
            input_type=hints.get("input_type", "chips"),
            suggested_choices=hints.get("quick_replies"),
        )

    # ── Private helpers ────────────────────────────────────────────────────────

    async def _verify_has_transactions(self, user_id: UUID) -> None:
        _, count = await self._txn_repo.get_by_user_filtered(user_id=user_id, limit=1)
        if count == 0:
            raise ForbiddenException(
                "Upload and accept a bank statement before completing your financial profile."
            )

    def _extract_fields(self, step: int, user_text: str, employment: str | None) -> dict:
        if 0 <= step < len(_STEP_EXTRACTORS):
            try:
                return _STEP_EXTRACTORS[step](user_text, employment)
            except Exception as exc:
                logger.warning(
                    "Field extraction failed",
                    extra={"step": step, "error": str(exc)},
                )
        return {}

    async def _ai_extract(self, step: int, user_text: str) -> dict:
        """Stub — extend when AI_PROVIDER != disabled."""
        return {}
