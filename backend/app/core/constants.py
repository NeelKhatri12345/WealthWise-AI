"""
WealthWise AI - Application Constants

Central location for all magic numbers, thresholds, and labels.
Import from here — never hardcode values in business logic.
"""

from typing import Final

# ── Application ───────────────────────────────────────────────────────────────
APP_VERSION: Final[str] = "1.0.0"
API_V1_PREFIX: Final[str] = "/api/v1"

# ── File Upload ───────────────────────────────────────────────────────────────
SUPPORTED_MIME_TYPES: Final[set[str]] = {
    "application/pdf",
    "image/png",
    "image/jpeg",  # covers both jpg and jpeg
}
SUPPORTED_EXTENSIONS: Final[set[str]] = {".pdf", ".png", ".jpg", ".jpeg"}

# Magic bytes for file-type verification (prevents MIME / extension spoofing)
PDF_MAGIC_BYTES: Final[bytes] = b"%PDF"
PNG_MAGIC_BYTES: Final[bytes] = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC_BYTES: Final[bytes] = b"\xff\xd8\xff"  # SOI marker common to all JPEG

# ── Financial Health Score Thresholds ────────────────────────────────────────
HEALTH_SCORE_EXCELLENT: Final[float] = 80.0
HEALTH_SCORE_GOOD: Final[float] = 60.0
HEALTH_SCORE_FAIR: Final[float] = 40.0
HEALTH_SCORE_POOR: Final[float] = 20.0

HEALTH_SCORE_LABELS: Final[dict[str, tuple[float, float]]] = {
    "excellent": (HEALTH_SCORE_EXCELLENT, 100.0),
    "good": (HEALTH_SCORE_GOOD, HEALTH_SCORE_EXCELLENT),
    "fair": (HEALTH_SCORE_FAIR, HEALTH_SCORE_GOOD),
    "poor": (HEALTH_SCORE_POOR, HEALTH_SCORE_FAIR),
    "critical": (0.0, HEALTH_SCORE_POOR),
}

# ── Phase 2 Financial Health Score Weights ─────────────────────────────────────
HEALTH_SCORE_SAVINGS_RATE_WEIGHT: Final[int] = 25
HEALTH_SCORE_EXPENSE_RATIO_WEIGHT: Final[int] = 20
HEALTH_SCORE_CASH_FLOW_WEIGHT: Final[int] = 15
HEALTH_SCORE_SPENDING_BEHAVIOUR_WEIGHT: Final[int] = 15
HEALTH_SCORE_INCOME_STABILITY_WEIGHT: Final[int] = 10
HEALTH_SCORE_TRANSACTION_DIVERSITY_WEIGHT: Final[int] = 5
HEALTH_SCORE_FINANCIAL_DISCIPLINE_WEIGHT: Final[int] = 10

# ── Phase 2 Component Thresholds ──────────────────────────────────────────────
# Savings Rate thresholds: (threshold_percentage, points)
HEALTH_SCORE_SAVINGS_RATE_THRESHOLDS: Final[list[tuple[float, int]]] = [
    (30.0, 25),
    (20.0, 20),
    (10.0, 15),
    (0.0, 8),
]

# Expense-to-Income Ratio thresholds: (threshold_percentage, points)
HEALTH_SCORE_EXPENSE_RATIO_THRESHOLDS: Final[list[tuple[float, int]]] = [
    (60.0, 20),
    (75.0, 15),
    (90.0, 10),
    (100.0, 5),
]

# Cash Flow thresholds
HEALTH_SCORE_CASH_FLOW_POSITIVE_POINTS: Final[int] = 15
HEALTH_SCORE_CASH_FLOW_SLIGHTLY_NEGATIVE_POINTS: Final[int] = 8
HEALTH_SCORE_CASH_FLOW_SLIGHTLY_NEGATIVE_LIMIT: Final[float] = -10.0  # limit for savings_rate percentage

# Spending Behaviour top category percentage thresholds: (max_percentage, points)
HEALTH_SCORE_SPENDING_BEHAVIOUR_THRESHOLDS: Final[list[tuple[float, int]]] = [
    (40.0, 15),
    (60.0, 10),
]

# Income Stability CV thresholds: (max_cv, points)
HEALTH_SCORE_INCOME_STABILITY_THRESHOLDS: Final[list[tuple[float, int]]] = [
    (0.15, 10),
    (0.40, 7),
]

# Transaction Diversity categories count thresholds: (min_categories, points)
HEALTH_SCORE_TRANSACTION_DIVERSITY_THRESHOLDS: Final[list[tuple[int, int]]] = [
    (5, 5),
    (3, 3),
]

# Financial Discipline behaviour thresholds
HEALTH_SCORE_DISCIPLINE_MIN_MONTHS: Final[int] = 3
HEALTH_SCORE_DISCIPLINE_CASH_FLOW_BONUS: Final[int] = 5
HEALTH_SCORE_DISCIPLINE_INCOME_STABILITY_BONUS: Final[int] = 3
HEALTH_SCORE_DISCIPLINE_BALANCED_SPENDING_BONUS: Final[int] = 2

# ── Phase 2 Grading Rules ──────────────────────────────────────────────────────
HEALTH_SCORE_GRADING_RULES: Final[list[tuple[float, str]]] = [
    (90.0, "A+"),
    (80.0, "A"),
    (70.0, "B"),
    (60.0, "C"),
    (50.0, "D"),
]

# ── Phase 2 Status Rules ───────────────────────────────────────────────────────
HEALTH_SCORE_STATUS_RULES: Final[list[tuple[float, str]]] = [
    (90.0, "Excellent"),
    (80.0, "Good"),
    (70.0, "Fair"),
    (60.0, "Needs Improvement"),
]


# ── Risk Profile Score Thresholds ─────────────────────────────────────────────
RISK_SCORE_VERY_AGGRESSIVE: Final[float] = 75.0
RISK_SCORE_AGGRESSIVE: Final[float] = 50.0
RISK_SCORE_MODERATE: Final[float] = 25.0

# ── Pagination ────────────────────────────────────────────────────────────────
DEFAULT_PAGE_SIZE: Final[int] = 20
MAX_PAGE_SIZE: Final[int] = 100

# ── AI Coach ─────────────────────────────────────────────────────────────────
AI_COACH_MAX_HISTORY_MESSAGES: Final[int] = 10  # Context window size
AI_COACH_SYSTEM_PROMPT: Final[str] = (
    "You are WealthWise, an expert AI financial coach. "
    "You provide personalized, actionable financial advice based on "
    "the user's transaction history, health score, and risk profile. "
    "Be concise, empathetic, and data-driven. "
    "Never provide specific investment advice that constitutes regulated financial advice. "
    "Always recommend consulting a licensed financial advisor for major decisions."
)

# ── Token / Auth ──────────────────────────────────────────────────────────────
BEARER_TOKEN_PREFIX: Final[str] = "Bearer"
REDIS_BLACKLIST_PREFIX: Final[str] = "jwt:blacklist:"
REDIS_REFRESH_PREFIX: Final[str] = "jwt:refresh:"

# ── Transaction Categories ────────────────────────────────────────────────────
TRANSACTION_CATEGORIES: Final[list[str]] = [
    "Housing",
    "Food & Dining",
    "Transportation",
    "Utilities",
    "Healthcare",
    "Shopping",
    "Entertainment",
    "Education",
    "Travel",
    "Insurance",
    "Investments",
    "Salary",
    "Freelance",
    "Business",
    "Transfers",
    "ATM",
    "Other",
]

# ── Date Formats ──────────────────────────────────────────────────────────────
DATE_FORMAT: Final[str] = "%Y-%m-%d"
DATETIME_FORMAT: Final[str] = "%Y-%m-%dT%H:%M:%S"
DATETIME_TZ_FORMAT: Final[str] = "%Y-%m-%dT%H:%M:%S%z"
