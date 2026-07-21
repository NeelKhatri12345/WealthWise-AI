"""
WealthWise AI - AI Advisor Service

Orchestrates the AI explainability and guidance layer using Google Gemini.
Gathers deterministic financial data, formats prompts under safety rules,
and parses Markdown segments into structured sections.
"""

from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from app.clients.gemini_client import GeminiClient
from app.services.financial_context_builder import FinancialContextBuilder
from app.services.product_recommendation_service import ProductRecommendationService


class AIAdvisorService:
    """
    Service responsible for building the safety-gate prompt, invoking Gemini,
    and formatting the response into structured JSON sections.
    """

    def __init__(
        self,
        context_builder: FinancialContextBuilder,
        product_service: ProductRecommendationService,
        gemini_client: GeminiClient,
    ) -> None:
        self._ctx_builder = context_builder
        self._product_service = product_service
        self._gemini = gemini_client

    async def get_advice(self, user_id: UUID, question: str) -> dict[str, Any]:
        # 1. Fetch user financial context snapshot
        ctx = await self._ctx_builder.build(user_id)

        # 2. Fetch active product suggestions
        product_suggestions = {}
        try:
            prod_res = await self._product_service.get_product_suggestions(user_id)
            if hasattr(prod_res, "model_dump"):
                product_suggestions = prod_res.model_dump()
            elif isinstance(prod_res, dict):
                product_suggestions = prod_res
        except Exception:
            pass

        # 3. Format context blocks
        context_str = self._build_context_str(ctx, product_suggestions)

        # 4. Formulate safety instructions & query prompt
        system_instruction = self._get_system_instruction()
        user_message = f"User Question: {question}\n\nFinancial Context:\n{context_str}"

        # 5. Invoke Gemini API
        response_text, _ = await self._gemini.generate(
            system_prompt=system_instruction,
            history=[],
            user_message=user_message,
        )

        # 6. Parse Markdown headers into a structured dict
        sections = self._parse_response_to_sections(response_text)
        return sections

    def _build_context_str(self, ctx: Any, product_suggestions: dict[str, Any]) -> str:
        lines = []

        # Cash Flow & Profile Declared
        lines.append("=== Core Cash Flow & Demographics ===")
        lines.append(f"Declared Monthly Income: {ctx.monthly_income_declared or 'N/A'}")
        lines.append(f"Earning Members: {ctx.earning_members or 1}")
        lines.append(f"Dependents: {ctx.dependents_count or 0}")
        lines.append(f"Total Transactions Income: {ctx.total_income or 'N/A'}")
        lines.append(f"Total Transactions Expenses: {ctx.total_expenses or 'N/A'}")
        lines.append(f"Net Cash Flow: {ctx.net_cash_flow or 'N/A'}")
        lines.append(f"Savings Rate: {ctx.savings_rate or 'N/A'}%")

        # Hybrid Health Score Snapshot
        lines.append("\n=== Health Score Analysis ===")
        lines.append(f"Overall Health Score: {ctx.health_score or 'N/A'}")
        lines.append(f"Health Band: {ctx.health_band or 'N/A'}")
        lines.append(f"Investment Readiness Score: {ctx.investment_readiness_score or 'N/A'}")
        lines.append(f"Positive Factors: {', '.join(ctx.health_positive_factors)}")
        lines.append(f"Risk Profile: {ctx.risk_profile or 'N/A'}")

        # Debt status
        lines.append("\n=== Debt & Insurance ===")
        lines.append(f"Has Loans: {ctx.has_loans or False}")
        if ctx.loan_types:
            lines.append(f"Loan Types: {', '.join(ctx.loan_types)}")
        lines.append(f"Monthly EMI Outflow: {ctx.monthly_emi or 0}")
        lines.append(f"Total Debt Liability: {ctx.total_debt or 0}")
        lines.append(f"Emergency Fund Months Cover: {ctx.emergency_fund_months or 0}")

        # Investment Strategy
        if ctx.investment_recommendation:
            rec = ctx.investment_recommendation
            lines.append("\n=== Recommendations & Allocation Strategy ===")
            lines.append(f"Recommended Strategy: {rec.get('recommended_strategy') or 'N/A'}")
            lines.append(f"Monthly Investable Amount: {rec.get('monthly_investable_amount') or 0}")
            alloc = rec.get("allocation") or []
            lines.append("Target Category Allocations:")
            for a in alloc:
                lines.append(f" - {a.get('category')}: {a.get('allocation_pct')}% (Approx {a.get('monthly_allocation')}/mo)")

        # Catalog suggestions
        if product_suggestions and "categories" in product_suggestions:
            lines.append("\n=== Suggested Investment Products ===")
            for c in product_suggestions["categories"]:
                lines.append(f"Category: {c.get('category')}")
                for p in c.get("products") or []:
                    m_scores = p.get("market_scores")
                    score_str = f"Market Overall: {m_scores.get('overall_score') * 100:.0f}%" if m_scores and m_scores.get("overall_score") is not None else "N/A"
                    lines.append(f" - {p.get('name')} ({p.get('product_type')}): Confidence {p.get('confidence_pct')}%, {score_str}")

        return "\n".join(lines)

    def _get_system_instruction(self) -> str:
        return (
            "You are the WealthWise AI Financial Advisor, a professional, CFP-equivalent advisory system.\n"
            "Your job is to explain the user's deterministic financial analysis and recommendations in natural language.\n"
            "You are given the user's complete financial context, including their health score, risk profile, current income/expenses, recommended asset allocation, and suggested financial products (with normalized market scores).\n\n"
            "CALCULATION RULES:\n"
            "- Never calculate health scores, risk profiles, allocations, or product recommendations. These have been calculated deterministically by our engine and are provided in the context.\n"
            "- Your role is to describe, explain, and guide the user based on these inputs.\n\n"
            "SAFETY & COMPLIANCE:\n"
            "- Never guarantee returns or predict stock/mutual fund future prices.\n"
            "- Never give explicit buy/sell advice for specific stocks or funds.\n"
            "- Never recommend leverage, borrowing, or margin trading.\n"
            "- Always clarify that recommendations are educational and based on the user's financial profile.\n"
            "- Do not provide personalized legal, accounting, or tax advice.\n\n"
            "RESPONSE FORMAT:\n"
            "You must return your advice in structured sections. To make parsing simple, format the output in Markdown using the following exact headings:\n\n"
            "## Financial Summary\n"
            "[A concise summary of the user's financial status]\n\n"
            "## Current Strengths\n"
            "- [Highlight positive aspects of their profile]\n"
            "- [Highlight positive aspects of their profile]\n\n"
            "## Potential Risks\n"
            "- [Highlight vulnerabilities, such as high debt, low savings rate, or insufficient emergency funds]\n"
            "- [Highlight vulnerabilities, such as high debt, low savings rate, or insufficient emergency funds]\n\n"
            "## Investment Insights\n"
            "[Explanation of the recommended strategy and why these specific assets/products match their profile]\n\n"
            "## Recommended Next Steps\n"
            "- [Actionable, educational steps to improve their score or start investing]\n"
            "- [Actionable, educational steps to improve their score or start investing]\n\n"
            "## Long-Term Opportunities\n"
            "[Strategic thoughts on wealth creation, goal horizon, and risk tolerance shifts]\n\n"
            "## Important Considerations\n"
            "[Standard safety disclaimers and compliance statements]"
        )

    def _parse_response_to_sections(self, text: str) -> dict[str, Any]:
        sections = {
            "financial_summary": "",
            "current_strengths": [],
            "potential_risks": [],
            "investment_insights": "",
            "recommended_next_steps": [],
            "long_term_opportunities": "",
            "important_considerations": "",
        }

        # Normalize text headings to simplify split
        normalized_text = re.sub(
            r"##\s*(financial summary|current strengths|potential risks|investment insights|recommended next steps|long-term opportunities|long term opportunities|important considerations)",
            lambda m: f"## {m.group(1).lower()}",
            text,
            flags=re.IGNORECASE
        )

        parts = re.split(r"##\s+", normalized_text)
        for part in parts:
            if not part.strip():
                continue
            lines = part.strip().split("\n")
            title = lines[0].strip().lower()
            content = "\n".join(lines[1:]).strip()

            if "financial summary" in title:
                sections["financial_summary"] = content
            elif "current strengths" in title:
                sections["current_strengths"] = [
                    line.strip("- *•").strip()
                    for line in content.split("\n")
                    if line.strip()
                ]
            elif "potential risks" in title:
                sections["potential_risks"] = [
                    line.strip("- *•").strip()
                    for line in content.split("\n")
                    if line.strip()
                ]
            elif "investment insights" in title:
                sections["investment_insights"] = content
            elif "recommended next steps" in title:
                sections["recommended_next_steps"] = [
                    line.strip("- *•").strip()
                    for line in content.split("\n")
                    if line.strip()
                ]
            elif "long-term opportunities" in title or "long term opportunities" in title:
                sections["long_term_opportunities"] = content
            elif "important considerations" in title:
                sections["important_considerations"] = content

        # Fallback if parsing failed to extract summary
        if not sections["financial_summary"]:
            sections["financial_summary"] = text

        return sections
