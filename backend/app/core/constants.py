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
    "text/csv",
    "application/vnd.ms-excel",
}
SUPPORTED_EXTENSIONS: Final[set[str]] = {".pdf", ".csv"}

# Magic bytes for file type verification (prevents MIME spoofing)
PDF_MAGIC_BYTES: Final[bytes] = b"%PDF"
CSV_FALLBACK_CHECK: Final[str] = "text"  # CSV has no magic bytes

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
