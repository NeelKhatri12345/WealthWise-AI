"""
WealthWise AI - AI Provider Service

Abstraction layer over multiple AI backends.

Supported providers (configured via AI_PROVIDER env var):
  disabled  →  no LLM call; rule-based fallback only
  gemini    →  Google Gemini via google-genai SDK

New .env settings:
  AI_PROVIDER=disabled|gemini
  GEMINI_API_KEY=<your key>
  AI_MODEL_NAME=gemini-2.5-flash          # override model
  AI_REQUEST_TIMEOUT_SECONDS=60

If the provider is disabled or any API call fails, the service returns
a deterministic rule-based response constructed from the user's
financial context — so the AI Coach always returns *something* useful.
"""

from __future__ import annotations

import asyncio
from typing import Optional

from app.core.config import get_settings
from app.core.logger import logger
from app.services.financial_context_builder import UserFinancialContext

settings = get_settings()


# ── Rule-based fallback generator ────────────────────────────────────────────


def _rule_based_response(
    intent: str,
    ctx: UserFinancialContext,
) -> str:
    """
    Generate a helpful, context-aware response without an LLM.
    Used when AI_PROVIDER=disabled or on API failure.
    """
    name_hint = (
        f"(Health Score: {ctx.health_score}/100)" if ctx.health_score is not None else ""
    )

    if intent == "health_score_explanation":
        band = ctx.health_band or "not yet calculated"
        score = ctx.health_score or "N/A"
        tips = "; ".join(ctx.health_suggestions[:2]) if ctx.health_suggestions else (
            "focus on increasing your savings rate and reducing discretionary spend"
        )
        return (
            f"Your Financial Health Score is **{score}/100** ({band}) {name_hint}. "
            f"This is a composite score measuring your savings rate, spending discipline, "
            f"debt burden, emergency preparedness, income stability, and investment readiness. "
            f"To improve your score, you may consider: {tips}. "
            f"For tailored advice, consult a SEBI-registered financial advisor."
        )

    if intent == "spending_analysis":
        if ctx.category_spending:
            top_cats = ", ".join(
                f"{k}: ₹{v:,.0f}" for k, v in list(ctx.category_spending.items())[:3]
            )
            return (
                f"Based on your transactions, your top spending categories are: "
                f"{top_cats}. "
                f"Your overall savings rate is {ctx.savings_rate:.1f}%. "
                f"You may consider reviewing your largest expense category first—"
                f"even a 10–15% reduction can meaningfully improve your financial health."
            )
        return (
            "No transaction data is available yet. Please upload a bank statement "
            "so I can analyse your spending patterns."
        )

    if intent == "saving_advice":
        rate = float(ctx.savings_rate or 0)
        if rate >= 20:
            msg = (
                f"Great job! Your savings rate is {rate:.1f}%, which is above the recommended "
                f"20% benchmark. You may consider automating your savings via a recurring SIP "
                f"or recurring deposit to lock in this discipline."
            )
        elif rate >= 10:
            msg = (
                f"Your savings rate is {rate:.1f}%. You're on the right track. "
                f"To reach the ideal 20%+ level, you may consider the 50-30-20 rule: "
                f"50% needs, 30% wants, 20% savings & investments. "
                f"Review your top spending categories for quick wins."
            )
        else:
            msg = (
                f"Your savings rate is {rate:.1f}%, which needs attention. "
                f"Start by tracking every expense for 30 days. "
                f"You may consider automating a small fixed monthly savings amount—"
                f"even ₹500–₹1,000 builds the habit. "
                f"Identify and cut one non-essential expense category first."
            )
        return msg

    if intent == "debt_advice":
        if ctx.has_loans is False:
            return (
                "You are currently debt-free—excellent! "
                "You may consider channelling what would have been EMI payments into an "
                "SIP or emergency fund to accelerate wealth building."
            )
        emi = ctx.monthly_emi or 0
        debt = ctx.total_debt or 0
        loans = ", ".join(ctx.loan_types) if ctx.loan_types else "active loans"
        return (
            f"You have {loans} with a monthly EMI of ₹{emi:,.0f} "
            f"and a total outstanding debt of ₹{debt:,.0f}. "
            f"As a general principle, aim to keep total EMIs below 40% of your monthly income. "
            f"You may consider the debt avalanche strategy (pay highest-interest debt first) "
            f"to reduce your interest burden. Consult a financial advisor for a personalised plan."
        )

    if intent == "investment_guidance":
        risk = ctx.risk_profile or ctx.risk_comfort_self_reported or "moderate"
        invest = ctx.monthly_investment or 0
        if float(invest) == 0:
            return (
                f"You haven't started investing yet. With a **{risk}** risk profile, "
                f"you may consider starting small—₹500–₹1,000/month in a diversified "
                f"equity mutual fund SIP (for moderate/high risk) or a recurring deposit / PPF "
                f"(for conservative investors). Always build a 3–6 month emergency fund before "
                f"investing aggressively. Consult a SEBI-registered advisor for personalised allocation."
            )
        return (
            f"You're investing ₹{invest:,.0f}/month—well done! "
            f"With a **{risk}** risk profile, you may consider periodically reviewing "
            f"your asset allocation (equity vs debt) as your income and goals evolve. "
            f"Diversification across instruments (equity MF, PPF, NPS, FD) can reduce concentration risk."
        )

    if intent == "risk_profile_explanation":
        rp = ctx.risk_profile or "not yet determined"
        comfort = ctx.risk_comfort_self_reported or "not specified"
        return (
            f"Your risk profile is **{rp}**, based on your financial health score, "
            f"debt burden, emergency fund, income stability, and self-reported comfort ({comfort}). "
            f"A Conservative profile suits stable instruments (FD, PPF, debt MFs). "
            f"Moderate suits a balanced portfolio. Aggressive suits equity-heavy allocations "
            f"for long-term goals. This may evolve as your financial situation changes."
        )

    if intent == "goal_planning":
        goals = ctx.financial_goals
        if not goals:
            return (
                "No financial goals have been set yet. Complete the FinProfileBot to "
                "set your goals, and I can help you create a roadmap."
            )
        goal_str = ", ".join(goals)
        return (
            f"Your stated goals are: **{goal_str}**. "
            f"A good starting framework is: (1) clear all high-interest debt, "
            f"(2) build a 3–6 month emergency fund, (3) then invest systematically "
            f"toward each goal with a dedicated SIP or savings account. "
            f"Prioritise goals by timeline—short (<3 yr), medium (3–7 yr), long (7+ yr)."
        )

    if intent == "website_help":
        return (
            "WealthWise AI helps you manage your finances by analysing bank statements, "
            "calculating a personalised Financial Health Score, profiling your risk tolerance, "
            "and coaching you through savings, debt, and investment decisions. "
            "To get started: upload a bank statement, complete the FinProfileBot, and generate "
            "your Health Score."
        )

    # Default / fallback
    return (
        "I'm here to help with your WealthWise financial profile, spending analysis, "
        "savings advice, health score, risk profile, and investment guidance. "
        "Please feel free to ask a specific finance question."
    )


# ── AI Provider Service ────────────────────────────────────────────────────────


class AIProviderService:
    """
    Thin abstraction over AI backends.

    Reads AI_PROVIDER from settings:
      - "disabled" → skip LLM, use rule-based response
      - "gemini"   → call Gemini via google-genai SDK with timeout

    On any error the service falls back to _rule_based_response.
    """

    def __init__(self) -> None:
        self._provider = (settings.AI_PROVIDER or "disabled").lower()
        model_override = getattr(settings, "AI_MODEL_NAME", "") or ""
        self._model = model_override or settings.GEMINI_MODEL
        self._timeout = int(
            getattr(settings, "AI_REQUEST_TIMEOUT_SECONDS", 60) or 60
        )
        self._gemini_client: Optional[object] = None
        self._gemini_types: Optional[object] = None

        if self._provider == "gemini":
            self._init_gemini()

    # ── Gemini initialiser ────────────────────────────────────────────────────

    def _init_gemini(self) -> None:
        try:
            from google import genai
            from google.genai import types

            self._gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self._gemini_types = types
            logger.info("AIProviderService: Gemini client initialised", extra={"model": self._model})
        except ImportError:
            logger.error(
                "AIProviderService: google-genai not installed; falling back to rule-based"
            )
            self._provider = "disabled"
        except Exception as exc:
            logger.error(
                "AIProviderService: Gemini init failed; falling back to rule-based",
                exc_info=exc,
            )
            self._provider = "disabled"

    # ── Public API ────────────────────────────────────────────────────────────

    async def generate(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
        intent: str,
        ctx: UserFinancialContext,
    ) -> tuple[str, Optional[int]]:
        """
        Generate a response.

        Returns:
            (reply_text, tokens_used_or_None)
        """
        if self._provider == "gemini" and self._gemini_client is not None:
            try:
                return await asyncio.wait_for(
                    self._call_gemini(system_prompt, history, user_message),
                    timeout=self._timeout,
                )
            except asyncio.TimeoutError:
                logger.warning("AIProviderService: Gemini request timed out; using fallback")
            except Exception as exc:
                logger.warning("AIProviderService: Gemini call failed; using fallback", exc_info=exc)

        # Rule-based fallback
        return _rule_based_response(intent, ctx), None

    # ── Gemini caller ─────────────────────────────────────────────────────────

    async def _call_gemini(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
    ) -> tuple[str, int]:
        types = self._gemini_types  # google.genai.types
        client = self._gemini_client  # google.genai.Client

        contents = []
        for turn in history:
            role = turn.get("role", "user")
            # Normalise role: Gemini accepts "user" and "model"
            gemini_role = "model" if role == "assistant" else role
            msg_text = turn.get("content") or turn.get("message") or ""
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=msg_text)],
                )
            )
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)],
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=getattr(settings, "GEMINI_MAX_TOKENS", 8192),
            temperature=getattr(settings, "GEMINI_TEMPERATURE", 0.7),
        )

        # google-genai SDK is synchronous; run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=self._model,
                contents=contents,
                config=config,
            ),
        )

        text = response.text or ""
        tokens = (
            response.usage_metadata.total_token_count
            if response.usage_metadata
            else 0
        )
        logger.info("AIProviderService: Gemini response", extra={"tokens": tokens, "model": self._model})
        return text, tokens

    # ── Helpers ───────────────────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return self._provider

    @property
    def model_name(self) -> str:
        return self._model
