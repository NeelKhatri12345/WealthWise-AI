"""
WealthWise AI - AI Prompt Builder

Constructs structured, safety-aware prompts for the AI Coach.

The final prompt passed to the LLM contains five sections:
  1. System instruction   — role, persona, tone
  2. User financial context — personalised data snapshot
  3. Chat history summary — condensed prior messages
  4. Safety rules         — guardrails (no stock tips, no guarantees, …)
  5. User question        — current message to be answered

Safety constraints enforced:
  • No exact stock/fund pick recommendations.
  • No guaranteed-return claims.
  • No illegal / off-jurisdiction tax advice.
  • No crypto-heavy risky advice.
  • All recommendations expressed with "you may consider" / educational wording.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Optional

from app.services.financial_context_builder import UserFinancialContext


# ── System instruction ────────────────────────────────────────────────────────

_SYSTEM_INSTRUCTION = """\
You are **WealthWise Coach**, a knowledgeable, empathetic, and strictly \
educational AI financial coach embedded in the WealthWise AI platform for \
Indian users. Your role is to help users understand their financial health, \
spending habits, savings gaps, debt situation, and investment readiness—based \
solely on the personalised data provided to you.

Tone: warm, encouraging, jargon-free. Use Indian context (₹, EMI, SIP, FD, \
PPF, NPS, GST) where relevant. Address the user directly ("you", "your").

STRICT REPLY LENGTH & STYLE CONSTRAINTS FOR FOLLOW-UP REPLIES:
• Maximum 150 words (prefer 80–120 words).
• Answer ONLY the user's question.
• Do not repeat the financial summary.
• Do not restate all metrics; mention only the metrics relevant to the question.
• Use bullet points wherever possible.
• Avoid long/unnecessary introductions or motivational/fluff paragraphs.
• Finish with at most one optional follow-up question.

(Note: Only the initial welcome analysis, if explicitly asked for, may be slightly longer at around 250–350 words, but every follow-up reply MUST stay concise and short.)
"""

# ── Safety rules ──────────────────────────────────────────────────────────────

_SAFETY_RULES = """\
SAFETY RULES — follow ALL of them in every reply:
1. Never recommend a specific stock, mutual fund scheme by name, or \
   cryptocurrency to buy or sell.
2. Never promise or imply guaranteed returns on any investment instrument.
3. Never give specific tax-evasion advice or advice that is illegal under \
   Indian law (Income Tax Act, SEBI regulations, FEMA).
4. Avoid recommending high-volatility crypto or speculative derivatives unless \
   user explicitly asks about risk; even then, add strong caution.
5. Frame all suggestions with educational, non-prescriptive language: \
   "you may consider", "it could be worth exploring", "many financial advisors \
   suggest", "as a general principle", etc.
6. Always recommend consulting a SEBI-registered financial advisor or \
   certified financial planner for major investment or tax decisions.
"""


# ── Builder ───────────────────────────────────────────────────────────────────


class AIPromptBuilder:
    """
    Builds the complete prompt string sent to the LLM.

    Usage::

        builder = AIPromptBuilder()
        prompt = builder.build_system_prompt(ctx)          # for system message
        full   = builder.build_full_prompt(ctx, history, question)
    """

    # ── System prompt (system message / instruction) ──────────────────────────

    def build_system_prompt(self, ctx: UserFinancialContext) -> str:
        """
        Assemble the system-level prompt: instruction + financial context +
        safety rules.
        """
        parts = [
            _SYSTEM_INSTRUCTION,
            self._format_financial_context(ctx),
            _SAFETY_RULES,
        ]
        return "\n\n".join(p.strip() for p in parts if p.strip())

    # ── Full user-turn prompt ─────────────────────────────────────────────────

    def build_full_prompt(
        self,
        ctx: UserFinancialContext,
        history_summary: str,
        user_question: str,
    ) -> str:
        """
        Return the full prompt injected as the last user turn when the
        AI provider does not support separate system messages.

        Structure:
            [SYSTEM INSTRUCTION]
            [FINANCIAL CONTEXT]
            [CHAT HISTORY SUMMARY]
            [SAFETY RULES]
            [USER QUESTION]
        """
        parts = [
            _SYSTEM_INSTRUCTION,
            self._format_financial_context(ctx),
            self._format_history_summary(history_summary),
            _SAFETY_RULES,
            f"USER QUESTION:\n{user_question}",
        ]
        return "\n\n---\n\n".join(p.strip() for p in parts if p.strip())

    # ── Context formatter ─────────────────────────────────────────────────────

    def _format_financial_context(self, ctx: UserFinancialContext) -> str:
        lines: list[str] = ["=== USER FINANCIAL CONTEXT ==="]

        # — Health Score —
        if ctx.health_score is not None:
            band = ctx.health_band or "N/A"
            lines.append(
                f"• Financial Health Score: {ctx.health_score}/100 ({band})"
            )
        else:
            lines.append("• Financial Health Score: Not yet calculated")

        # — Component Scores —
        if ctx.component_scores:
            cs = ctx.component_scores
            comp_parts = []
            if cs.get("cash_flow_score") is not None:
                comp_parts.append(f"Savings/Cash-flow={cs['cash_flow_score']}/25")
            if cs.get("spending_score") is not None:
                comp_parts.append(f"Spending={cs['spending_score']}/20")
            if cs.get("debt_burden_score") is not None:
                comp_parts.append(f"Debt={cs['debt_burden_score']}/20")
            if cs.get("emergency_score") is not None:
                comp_parts.append(f"Emergency={cs['emergency_score']}/15")
            if cs.get("income_stability_score") is not None:
                comp_parts.append(f"Income Stability={cs['income_stability_score']}/10")
            if cs.get("investment_readiness_score") is not None:
                comp_parts.append(
                    f"Investment Readiness={cs['investment_readiness_score']}/10"
                )
            if comp_parts:
                lines.append("  Components: " + ", ".join(comp_parts))

        # — Risk Profile —
        if ctx.risk_profile:
            lines.append(f"• Risk Profile: {ctx.risk_profile}")
        if ctx.risk_comfort_self_reported:
            lines.append(
                f"  Self-reported risk comfort: {ctx.risk_comfort_self_reported}"
            )

        # — Demographics —
        demo_parts = []
        if ctx.age_range:
            demo_parts.append(f"Age {ctx.age_range}")
        if ctx.employment_type:
            demo_parts.append(ctx.employment_type.replace("_", " ").title())
        if demo_parts:
            lines.append("• Profile: " + ", ".join(demo_parts))

        # — Income —
        if ctx.total_income is not None and ctx.total_income > 0:
            lines.append(f"• Total Income (statement period): ₹{ctx.total_income:,.0f}")
        if ctx.monthly_income_declared is not None and ctx.monthly_income_declared > 0:
            lines.append(
                f"• Declared Monthly Income: ₹{ctx.monthly_income_declared:,.0f}"
            )

        # — Savings / Cash Flow —
        if ctx.savings_rate is not None:
            lines.append(f"• Savings Rate: {ctx.savings_rate:.1f}%")
        if ctx.net_cash_flow is not None:
            sign = "+" if ctx.net_cash_flow >= 0 else ""
            lines.append(f"• Net Cash Flow: {sign}₹{ctx.net_cash_flow:,.0f}")

        # — Spending Breakdown —
        if ctx.total_expenses is not None and ctx.total_expenses > 0:
            lines.append(f"• Total Expenses: ₹{ctx.total_expenses:,.0f}")
        if ctx.category_spending:
            cat_parts = [
                f"{cat}: ₹{amt:,.0f}"
                for cat, amt in list(ctx.category_spending.items())[:5]
            ]
            lines.append("  Top spending: " + " | ".join(cat_parts))

        # — Loans / EMI —
        if ctx.has_loans is False:
            lines.append("• Loans/EMI: Debt-free ✓")
        elif ctx.has_loans is True:
            loan_str = ", ".join(ctx.loan_types) if ctx.loan_types else "loans present"
            lines.append(f"• Loans: {loan_str}")
            if ctx.monthly_emi is not None:
                lines.append(f"  Monthly EMI: ₹{ctx.monthly_emi:,.0f}")
            if ctx.total_debt is not None and ctx.total_debt > 0:
                lines.append(f"  Total Debt: ₹{ctx.total_debt:,.0f}")

        # — Emergency Fund —
        if ctx.has_emergency_fund is False:
            lines.append("• Emergency Fund: None ⚠️")
        elif ctx.has_emergency_fund is True and ctx.emergency_fund_months is not None:
            lines.append(
                f"• Emergency Fund: {ctx.emergency_fund_months:.1f} months coverage"
            )

        # — Insurance —
        ins_parts = []
        if ctx.has_health_insurance is True:
            ins_parts.append("Health ✓")
        elif ctx.has_health_insurance is False:
            ins_parts.append("Health ✗")
        if ctx.has_life_insurance is True:
            ins_parts.append("Life ✓")
        elif ctx.has_life_insurance is False:
            ins_parts.append("Life ✗")
        if ins_parts:
            lines.append("• Insurance: " + ", ".join(ins_parts))

        # — Investments —
        if ctx.monthly_investment is not None:
            lines.append(f"• Monthly Investment: ₹{ctx.monthly_investment:,.0f}")
        if ctx.investment_types:
            lines.append("  Types: " + ", ".join(ctx.investment_types))
        if ctx.investment_readiness_score is not None:
            lines.append(
                f"  Investment Readiness Score: {ctx.investment_readiness_score}/10"
            )

        # — Goals —
        if ctx.financial_goals:
            lines.append("• Financial Goals: " + ", ".join(ctx.financial_goals))

        # — Suggestions from health score —
        if ctx.health_suggestions:
            lines.append("• Key AI Suggestions: " + "; ".join(ctx.health_suggestions[:3]))

        return "\n".join(lines)

    # ── History formatter ─────────────────────────────────────────────────────

    @staticmethod
    def _format_history_summary(history_summary: str) -> str:
        if not history_summary or not history_summary.strip():
            return ""
        return f"=== CONVERSATION CONTEXT ===\n{history_summary.strip()}"

    # ── History condenser ─────────────────────────────────────────────────────

    @staticmethod
    def condense_history(messages: list[dict]) -> str:
        """
        Convert recent message dicts (role/content) into a terse plain-text
        summary (last 6 exchanges max) to include in the prompt.
        """
        if not messages:
            return ""
        # Take last 12 messages (6 exchanges)
        recent = messages[-12:]
        lines = []
        for msg in recent:
            role = msg.get("role", "unknown")
            content = (msg.get("content") or msg.get("message") or "").strip()
            if content:
                prefix = "User" if role == "user" else "Coach"
                # Truncate very long turns to 200 chars
                short = content[:200] + ("…" if len(content) > 200 else "")
                lines.append(f"{prefix}: {short}")
        return "\n".join(lines)
