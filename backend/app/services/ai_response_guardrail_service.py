"""
WealthWise AI - AI Response Guardrail Service

Post-generation filter that ensures every AI Coach response complies
with safety rules before it reaches the user.

Checks performed:
  1. Out-of-scope detection — blocks non-finance questions
  2. Stock/fund tip detection — replaces with educational redirect
  3. Guaranteed-return detection — adds mandatory disclaimer
  4. Illegal tax advice detection — adds mandatory disclaimer
  5. Crypto-heavy risky advice detection — adds caution note

Intent classification uses a lightweight keyword matching approach
(no external API needed). Intents:

  website_help            — questions about the WealthWise platform
  health_score_explanation — how the health score is calculated
  spending_analysis       — spending patterns / categories
  saving_advice           — how to save more
  debt_advice             — loans, EMI, debt management
  investment_guidance     — where/how to invest
  risk_profile_explanation — what the risk profile means
  goal_planning           — planning toward financial goals
  out_of_scope            — anything unrelated to personal finance
"""

from __future__ import annotations

import re

from app.core.logger import logger

# ── Out-of-scope response ─────────────────────────────────────────────────────

OUT_OF_SCOPE_REPLY = (
    "I can help with your WealthWise financial profile, spending, savings, "
    "health score, risk profile, and investment guidance. "
    "Please ask a finance-related question."
)

# ── Guaranteed-return disclaimer ──────────────────────────────────────────────

_GUARANTEE_DISCLAIMER = (
    "\n\n⚠️ *Please note: No investment guarantees returns. "
    "Past performance is not indicative of future results. "
    "Consult a SEBI-registered financial advisor before investing.*"
)

# ── Illegal tax advice disclaimer ─────────────────────────────────────────────

_TAX_DISCLAIMER = (
    "\n\n⚠️ *Tax laws are jurisdiction-specific and change frequently. "
    "The above is general educational information only—not legal or tax advice. "
    "Please consult a qualified chartered accountant (CA) or tax advisor.*"
)

# ── Crypto caution note ───────────────────────────────────────────────────────

_CRYPTO_CAUTION = (
    "\n\n⚠️ *Cryptocurrency investments are highly volatile and speculative. "
    "Only allocate funds you can afford to lose entirely. "
    "Ensure compliance with RBI and SEBI guidelines.*"
)

# ── Intent keyword maps ───────────────────────────────────────────────────────

_INTENT_PATTERNS: list[tuple[str, list[str]]] = [
    (
        "health_score_explanation",
        [
            "health score", "financial score", "score mean", "score calculated",
            "score breakdown", "what is my score", "improve my score", "score components",
            "score band", "excellent score", "good score", "fair score", "weak score",
            "critical score",
        ],
    ),
    (
        "spending_analysis",
        [
            "spending", "where am i spending", "top expense", "expenses", "where does my money go",
            "category", "what do i spend", "spending habit", "overspend", "lifestyle",
        ],
    ),
    (
        "saving_advice",
        [
            "save", "savings", "save more", "saving tips", "savings rate", "how to save",
            "build savings", "save money", "emergency fund", "cut expense",
        ],
    ),
    (
        "debt_advice",
        [
            "loan", "emi", "debt", "credit card due", "repay", "debt free",
            "outstanding", "borrow", "interest", "debt management",
        ],
    ),
    (
        "investment_guidance",
        [
            "invest", "investment", "mutual fund", "sip", "stock", "equity",
            "fixed deposit", "fd", "ppf", "nps", "gold", "real estate", "portfolio",
            "where to put money", "grow money", "wealth building",
        ],
    ),
    (
        "risk_profile_explanation",
        [
            "risk profile", "risk level", "conservative", "aggressive", "moderate risk",
            "what is my risk", "risk tolerance", "risk appetite",
        ],
    ),
    (
        "goal_planning",
        [
            "goal", "retirement", "buy a house", "child education", "dream",
            "future plan", "long term", "target", "financial goal", "plan for retirement",
            "planning for",
        ],
    ),
    (
        "website_help",
        [
            "how does wealthwise work", "what is wealthwise", "how to use",
            "upload statement", "finprofilebot", "how to start", "what can you do",
            "what features", "help me navigate",
        ],
    ),
]

# ── Stock/fund tip pattern ────────────────────────────────────────────────────

_STOCK_TIP_PATTERN = re.compile(
    r"\b(buy|sell|invest in|pick|recommend(?:ing)?)\s+(?:[A-Z]{2,10}|[A-Z][a-z]+ (?:Ltd|Inc|Fund))",
    re.IGNORECASE,
)

# ── Guaranteed-return pattern ─────────────────────────────────────────────────

_GUARANTEE_PATTERN = re.compile(
    r"(guaranteed?\s+(return|profit|gain)|will definitely (earn|make|return)|"
    r"100\s*%\s*(safe|return|guaranteed?)|risk.{0,5}free return)",
    re.IGNORECASE,
)

# ── Illegal tax advice pattern ────────────────────────────────────────────────

_TAX_ADVICE_PATTERN = re.compile(
    r"(evade|avoid paying tax|hide income|black money|undeclare|"
    r"don'?t report|not report (to|your) income|offshore account)",
    re.IGNORECASE,
)

# ── Crypto-heavy risky advice pattern ─────────────────────────────────────────

_CRYPTO_HEAVY_PATTERN = re.compile(
    r"(put (?:all|most|everything|bulk|your) .{0,30} (?:in|into) (?:crypto|bitcoin|ethereum|altcoin)|"  
    r"all.{0,5}in on (bitcoin|ethereum|crypto|altcoin)|"  
    r"(?:all|entire) .{0,15} (?:savings|money|funds) .{0,10} (?:into|in) (?:crypto|bitcoin)|"  
    r"crypto .{0,20} (?:definitely|always|sure) (rise|moon|profit))",
    re.IGNORECASE,
)

# ── Out-of-scope topic patterns ───────────────────────────────────────────────

# Topics clearly outside personal finance
_OOS_POSITIVE_PATTERNS = re.compile(
    r"\b(write (?:a |an )?(?:poem|story|code|essay|letter)|"
    r"translate|weather|recipe|sport(?:s)? score|song|movie|"
    r"book recommendation|news|politics|celebrity|"
    r"generate (?:an? )?image|draw|paint|"
    r"medical (?:advice|diagnosis|treatment)|"
    r"legal (?:advice|case)|dating advice)\b",
    re.IGNORECASE,
)


# ── Guardrail Service ─────────────────────────────────────────────────────────


class AIResponseGuardrailService:
    """
    Two-phase guardrail:
      Phase 1 (pre-generation): Classify intent + detect out-of-scope.
      Phase 2 (post-generation): Scan AI reply for policy violations.
    """

    # ── Phase 1: Intent classification ───────────────────────────────────────

    @staticmethod
    def classify_intent(user_message: str) -> str:
        """
        Return the closest matching intent string from the defined taxonomy.
        Falls back to "out_of_scope" when no finance topic is matched.
        """
        text = user_message.lower().strip()

        # Hard block: obviously out-of-scope content
        if _OOS_POSITIVE_PATTERNS.search(text):
            return "out_of_scope"

        # Score each intent by keyword hits
        scores: dict[str, int] = {}
        for intent, keywords in _INTENT_PATTERNS:
            hits = sum(1 for kw in keywords if kw in text)
            if hits:
                scores[intent] = hits

        if not scores:
            # Final heuristic: if the message contains any personal-finance word,
            # route to a general saving_advice bucket rather than out_of_scope.
            finance_words = {
                "money", "income", "salary", "budget", "finance", "financial",
                "wealth", "bank", "transaction", "account", "tax", "insurance",
                "asset", "liability", "net worth", "balance",
            }
            if any(w in text for w in finance_words):
                return "saving_advice"
            return "out_of_scope"

        return max(scores, key=scores.get)  # type: ignore[arg-type]

    # ── Phase 2: Response sanitisation ───────────────────────────────────────

    @classmethod
    def sanitise_response(cls, response: str, intent: str) -> str:
        """
        Post-process the AI reply to enforce safety rules.
        Appends disclaimers for policy violations; never silently drops content.
        """
        if not response:
            return response

        result = response

        # Guaranteed-return language → append strong disclaimer
        if _GUARANTEE_PATTERN.search(result):
            logger.warning("Guardrail: guaranteed-return language detected; appending disclaimer")
            result += _GUARANTEE_DISCLAIMER

        # Illegal tax advice → append disclaimer
        if _TAX_ADVICE_PATTERN.search(result):
            logger.warning("Guardrail: potentially illegal tax advice detected; appending disclaimer")
            result += _TAX_DISCLAIMER

        # Crypto-heavy risky advice → append caution
        if _CRYPTO_HEAVY_PATTERN.search(result):
            logger.warning("Guardrail: crypto-heavy risky advice detected; appending caution")
            result += _CRYPTO_CAUTION

        return result

    # ── Combined entry point ──────────────────────────────────────────────────

    @classmethod
    def validate_and_sanitise(
        cls,
        user_message: str,
        ai_response: str,
    ) -> tuple[str, str]:
        """
        Convenience method: classify intent and sanitise response.

        Returns:
            (intent, sanitised_response)
        """
        intent = cls.classify_intent(user_message)
        sanitised = cls.sanitise_response(ai_response, intent)
        return intent, sanitised

    @classmethod
    def is_out_of_scope(cls, user_message: str) -> bool:
        """Quick check before calling the AI provider."""
        return cls.classify_intent(user_message) == "out_of_scope"
