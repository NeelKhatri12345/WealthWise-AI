"""
WealthWise AI - Unit Tests: AI Coach Services (Phase 2)

Covers:
  - AIResponseGuardrailService.classify_intent
  - AIResponseGuardrailService.sanitise_response
  - AIResponseGuardrailService.is_out_of_scope
  - AIPromptBuilder.build_system_prompt
  - AIPromptBuilder.condense_history
  - AIPromptBuilder._format_financial_context
  - AIProviderService rule-based fallback (_rule_based_response)
  - FinancialContextBuilder (unit with mocked repos)
  - AICoachService.chat (full pipeline, mocked dependencies)

All tests are pure unit tests (no DB, no HTTP, no real AI calls).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.services.ai_response_guardrail_service import (
    AIResponseGuardrailService,
    OUT_OF_SCOPE_REPLY,
    _GUARANTEE_DISCLAIMER,
    _TAX_DISCLAIMER,
    _CRYPTO_CAUTION,
)
from app.services.ai_prompt_builder import AIPromptBuilder
from app.services.financial_context_builder import UserFinancialContext
from app.services.ai_provider_service import _rule_based_response


# ── Test helpers ───────────────────────────────────────────────────────────────


def _make_ctx(**kwargs) -> UserFinancialContext:
    """Create a UserFinancialContext with sensible defaults."""
    defaults = dict(
        user_id=uuid4(),
        total_income=Decimal("100000"),
        total_expenses=Decimal("75000"),
        net_cash_flow=Decimal("25000"),
        savings_rate=Decimal("25.0"),
        transaction_count=40,
        category_spending={"Food & Dining": Decimal("20000"), "Shopping": Decimal("15000")},
        top_spending_category="Food & Dining",
        top_spending_category_ratio=Decimal("0.27"),
        health_score=Decimal("72"),
        health_band="GOOD",
        component_scores={
            "cash_flow_score": 20.0,
            "spending_score": 15.0,
            "debt_burden_score": 18.0,
            "emergency_score": 10.0,
            "income_stability_score": 7.0,
            "investment_readiness_score": 2.0,
        },
        health_positive_factors=["Positive cash flow"],
        health_negative_factors=["Low investment"],
        health_suggestions=["Start a SIP", "Build emergency fund"],
        risk_profile="MODERATE",
        risk_confidence=0.85,
        risk_comfort_self_reported="moderate",
        age_range="26-35",
        employment_type="salaried",
        monthly_income_declared=Decimal("90000"),
        earning_members=1,
        dependents_count=1,
        has_loans=True,
        loan_types=["home_loan"],
        monthly_emi=Decimal("20000"),
        total_debt=Decimal("2500000"),
        has_emergency_fund=True,
        emergency_fund_months=3.0,
        has_health_insurance=True,
        has_life_insurance=False,
        monthly_investment=Decimal("5000"),
        investment_types=["mutual_funds"],
        investment_readiness_score=2.0,
        financial_goals=["retirement", "buy a house"],
        profile_completion_pct=80.0,
    )
    defaults.update(kwargs)
    return UserFinancialContext(**defaults)


# ═══════════════════════════════════════════════════════════════════════════════
# Intent Classification Tests
# ═══════════════════════════════════════════════════════════════════════════════


class TestIntentClassification:

    def test_health_score_keywords(self):
        assert AIResponseGuardrailService.classify_intent(
            "What does my health score mean?"
        ) == "health_score_explanation"

    def test_health_score_improve(self):
        assert AIResponseGuardrailService.classify_intent(
            "How can I improve my financial score?"
        ) == "health_score_explanation"

    def test_spending_analysis(self):
        intent = AIResponseGuardrailService.classify_intent(
            "Where am I spending the most money?"
        )
        assert intent == "spending_analysis"

    def test_saving_advice(self):
        intent = AIResponseGuardrailService.classify_intent(
            "How can I save more money each month?"
        )
        assert intent == "saving_advice"

    def test_debt_advice_loan(self):
        intent = AIResponseGuardrailService.classify_intent(
            "I have a home loan and car loan. How to manage?"
        )
        assert intent == "debt_advice"

    def test_debt_advice_emi(self):
        intent = AIResponseGuardrailService.classify_intent(
            "My EMI is very high, what can I do?"
        )
        assert intent == "debt_advice"

    def test_investment_guidance(self):
        intent = AIResponseGuardrailService.classify_intent(
            "Should I start a mutual fund SIP?"
        )
        assert intent == "investment_guidance"

    def test_investment_guidance_portfolio(self):
        intent = AIResponseGuardrailService.classify_intent(
            "I want to build a good investment portfolio."
        )
        assert intent == "investment_guidance"

    def test_risk_profile(self):
        intent = AIResponseGuardrailService.classify_intent(
            "What does my risk profile mean?"
        )
        assert intent == "risk_profile_explanation"

    def test_goal_planning(self):
        intent = AIResponseGuardrailService.classify_intent(
            "I want to plan for my retirement and set financial goals."
        )
        assert intent == "goal_planning"

    def test_website_help(self):
        intent = AIResponseGuardrailService.classify_intent(
            "What features does WealthWise have?"
        )
        assert intent == "website_help"

    def test_out_of_scope_poem(self):
        intent = AIResponseGuardrailService.classify_intent(
            "Write me a poem about sunsets"
        )
        assert intent == "out_of_scope"

    def test_out_of_scope_recipe(self):
        intent = AIResponseGuardrailService.classify_intent(
            "Give me a recipe for chicken biryani"
        )
        assert intent == "out_of_scope"

    def test_out_of_scope_weather(self):
        intent = AIResponseGuardrailService.classify_intent(
            "What is the weather today in Mumbai?"
        )
        assert intent == "out_of_scope"

    def test_out_of_scope_sports(self):
        intent = AIResponseGuardrailService.classify_intent(
            "Who won the cricket match yesterday?"
        )
        assert intent == "out_of_scope"

    def test_finance_generic_word_fallback(self):
        """A message with a finance word but no specific intent → not out_of_scope."""
        intent = AIResponseGuardrailService.classify_intent("Tell me about my money")
        assert intent != "out_of_scope"

    def test_is_out_of_scope_true(self):
        assert AIResponseGuardrailService.is_out_of_scope("Write a story for me") is True

    def test_is_out_of_scope_false(self):
        assert AIResponseGuardrailService.is_out_of_scope("How is my savings rate?") is False


# ═══════════════════════════════════════════════════════════════════════════════
# Guardrail Sanitise Response Tests
# ═══════════════════════════════════════════════════════════════════════════════


class TestGuardrailSanitise:

    def test_clean_response_unchanged(self):
        clean = "You may consider building an emergency fund of 3-6 months."
        result = AIResponseGuardrailService.sanitise_response(clean, "saving_advice")
        assert result == clean

    def test_guaranteed_return_appends_disclaimer(self):
        risky = "This investment gives guaranteed returns of 15% per year."
        result = AIResponseGuardrailService.sanitise_response(risky, "investment_guidance")
        assert _GUARANTEE_DISCLAIMER in result

    def test_illegal_tax_advice_appends_disclaimer(self):
        illegal = "You can evade tax by not declaring foreign income."
        result = AIResponseGuardrailService.sanitise_response(illegal, "saving_advice")
        assert _TAX_DISCLAIMER in result

    def test_crypto_heavy_risk_appends_caution(self):
        crypto = "Put all your savings into bitcoin, it will definitely moon."
        result = AIResponseGuardrailService.sanitise_response(crypto, "investment_guidance")
        assert _CRYPTO_CAUTION in result

    def test_multiple_violations_appends_all(self):
        """A response with multiple violations should accumulate all disclaimers."""
        bad = (
            "This scheme offers guaranteed returns. "
            "Also you should evade tax on this. "
            "Put all your money into crypto."
        )
        result = AIResponseGuardrailService.sanitise_response(bad, "investment_guidance")
        assert _GUARANTEE_DISCLAIMER in result
        assert _TAX_DISCLAIMER in result
        assert _CRYPTO_CAUTION in result

    def test_empty_response_returned_as_is(self):
        result = AIResponseGuardrailService.sanitise_response("", "saving_advice")
        assert result == ""

    def test_validate_and_sanitise_returns_tuple(self):
        intent, reply = AIResponseGuardrailService.validate_and_sanitise(
            "How do I save money?",
            "You may consider automating your savings.",
        )
        assert intent == "saving_advice"
        assert reply == "You may consider automating your savings."


# ═══════════════════════════════════════════════════════════════════════════════
# Prompt Builder Tests
# ═══════════════════════════════════════════════════════════════════════════════


class TestAIPromptBuilder:
    """Tests for AIPromptBuilder — no network calls involved."""

    def setup_method(self):
        self.builder = AIPromptBuilder()

    def test_system_prompt_contains_system_instruction(self):
        ctx = _make_ctx()
        prompt = self.builder.build_system_prompt(ctx)
        assert "WealthWise Coach" in prompt

    def test_system_prompt_contains_safety_rules(self):
        ctx = _make_ctx()
        prompt = self.builder.build_system_prompt(ctx)
        assert "SAFETY RULES" in prompt
        assert "you may consider" in prompt.lower() or "you may consider" in prompt

    def test_system_prompt_contains_health_score(self):
        ctx = _make_ctx(health_score=Decimal("72"), health_band="GOOD")
        prompt = self.builder.build_system_prompt(ctx)
        assert "72" in prompt
        assert "GOOD" in prompt

    def test_system_prompt_contains_risk_profile(self):
        ctx = _make_ctx(risk_profile="MODERATE")
        prompt = self.builder.build_system_prompt(ctx)
        assert "MODERATE" in prompt

    def test_system_prompt_no_health_score(self):
        ctx = _make_ctx(health_score=None, health_band=None)
        prompt = self.builder.build_system_prompt(ctx)
        assert "Not yet calculated" in prompt

    def test_system_prompt_contains_goals(self):
        ctx = _make_ctx(financial_goals=["retirement", "buy a house"])
        prompt = self.builder.build_system_prompt(ctx)
        assert "retirement" in prompt
        assert "buy a house" in prompt

    def test_system_prompt_debt_free_flag(self):
        ctx = _make_ctx(has_loans=False, loan_types=[], monthly_emi=None)
        prompt = self.builder.build_system_prompt(ctx)
        assert "Debt-free" in prompt

    def test_system_prompt_emergency_fund(self):
        ctx = _make_ctx(has_emergency_fund=True, emergency_fund_months=4.0)
        prompt = self.builder.build_system_prompt(ctx)
        assert "4.0" in prompt

    def test_system_prompt_no_emergency_fund(self):
        ctx = _make_ctx(has_emergency_fund=False, emergency_fund_months=0)
        prompt = self.builder.build_system_prompt(ctx)
        assert "None" in prompt

    def test_system_prompt_insurance_flags(self):
        ctx = _make_ctx(has_health_insurance=True, has_life_insurance=False)
        prompt = self.builder.build_system_prompt(ctx)
        assert "Health ✓" in prompt
        assert "Life ✗" in prompt

    def test_condense_history_empty(self):
        result = AIPromptBuilder.condense_history([])
        assert result == ""

    def test_condense_history_formats_messages(self):
        history = [
            {"role": "user", "content": "What is my savings rate?"},
            {"role": "assistant", "content": "Your savings rate is 25%."},
        ]
        result = AIPromptBuilder.condense_history(history)
        assert "User: What is my savings rate?" in result
        assert "Coach: Your savings rate is 25%." in result

    def test_condense_history_limits_to_12_messages(self):
        history = [
            {"role": "user" if i % 2 == 0 else "assistant", "content": f"msg {i}"}
            for i in range(20)
        ]
        result = AIPromptBuilder.condense_history(history)
        # Only last 12 messages → last msg "msg 19"
        assert "msg 19" in result
        assert "msg 7" not in result  # 20-12=8 → msgs 0-7 should be excluded

    def test_condense_history_truncates_long_messages(self):
        long_msg = "X" * 300
        history = [{"role": "user", "content": long_msg}]
        result = AIPromptBuilder.condense_history(history)
        assert "…" in result

    def test_build_full_prompt_contains_user_question(self):
        ctx = _make_ctx()
        prompt = self.builder.build_full_prompt(ctx, "", "How much should I save?")
        assert "How much should I save?" in prompt

    def test_build_full_prompt_contains_all_sections(self):
        ctx = _make_ctx()
        history_summary = "User: What is my score?\nCoach: It is 72."
        prompt = self.builder.build_full_prompt(ctx, history_summary, "What next?")
        assert "WealthWise Coach" in prompt
        assert "FINANCIAL CONTEXT" in prompt
        assert "CONVERSATION CONTEXT" in prompt
        assert "SAFETY RULES" in prompt
        assert "USER QUESTION" in prompt


# ═══════════════════════════════════════════════════════════════════════════════
# Rule-Based Fallback Tests
# ═══════════════════════════════════════════════════════════════════════════════


class TestRuleBasedFallback:

    def test_health_score_explanation_with_score(self):
        ctx = _make_ctx(health_score=Decimal("72"), health_band="GOOD")
        reply = _rule_based_response("health_score_explanation", ctx)
        assert "72" in reply
        assert "GOOD" in reply

    def test_health_score_explanation_without_score(self):
        ctx = _make_ctx(health_score=None, health_band=None)
        reply = _rule_based_response("health_score_explanation", ctx)
        assert "N/A" in reply

    def test_spending_analysis_with_categories(self):
        ctx = _make_ctx(category_spending={"Food & Dining": Decimal("20000")})
        reply = _rule_based_response("spending_analysis", ctx)
        assert "Food & Dining" in reply or "spending" in reply.lower()

    def test_spending_analysis_no_transactions(self):
        ctx = _make_ctx(category_spending={}, total_income=None)
        reply = _rule_based_response("spending_analysis", ctx)
        assert "No transaction data" in reply

    def test_saving_advice_good_rate(self):
        ctx = _make_ctx(savings_rate=Decimal("25.0"))
        reply = _rule_based_response("saving_advice", ctx)
        assert "25.0" in reply

    def test_saving_advice_low_rate(self):
        ctx = _make_ctx(savings_rate=Decimal("5.0"))
        reply = _rule_based_response("saving_advice", ctx)
        assert "5.0" in reply
        assert "attention" in reply.lower() or "track" in reply.lower()

    def test_debt_advice_no_loans(self):
        ctx = _make_ctx(has_loans=False, loan_types=[])
        reply = _rule_based_response("debt_advice", ctx)
        assert "debt-free" in reply.lower()

    def test_debt_advice_with_loans(self):
        ctx = _make_ctx(has_loans=True, loan_types=["home_loan"], monthly_emi=Decimal("20000"))
        reply = _rule_based_response("debt_advice", ctx)
        assert "home_loan" in reply or "EMI" in reply

    def test_investment_guidance_not_investing(self):
        ctx = _make_ctx(monthly_investment=Decimal("0"))
        reply = _rule_based_response("investment_guidance", ctx)
        assert "started investing" in reply.lower() or "₹0" in reply or "haven't" in reply.lower()

    def test_investment_guidance_investing(self):
        ctx = _make_ctx(monthly_investment=Decimal("10000"))
        reply = _rule_based_response("investment_guidance", ctx)
        assert "10,000" in reply

    def test_risk_profile_explanation(self):
        ctx = _make_ctx(risk_profile="CONSERVATIVE")
        reply = _rule_based_response("risk_profile_explanation", ctx)
        assert "CONSERVATIVE" in reply

    def test_goal_planning_with_goals(self):
        ctx = _make_ctx(financial_goals=["retirement", "travel"])
        reply = _rule_based_response("goal_planning", ctx)
        assert "retirement" in reply
        assert "travel" in reply

    def test_goal_planning_no_goals(self):
        ctx = _make_ctx(financial_goals=[])
        reply = _rule_based_response("goal_planning", ctx)
        assert "No financial goals" in reply or "goals" in reply.lower()

    def test_website_help(self):
        ctx = _make_ctx()
        reply = _rule_based_response("website_help", ctx)
        assert "WealthWise" in reply

    def test_unknown_intent_returns_generic(self):
        ctx = _make_ctx()
        reply = _rule_based_response("unknown_xyz", ctx)
        assert "finance" in reply.lower() or "WealthWise" in reply


# ═══════════════════════════════════════════════════════════════════════════════
# FinancialContextBuilder Unit Tests (mocked repos)
# ═══════════════════════════════════════════════════════════════════════════════


class TestFinancialContextBuilder:

    def _make_builder(
        self,
        metrics=None,
        transactions=None,
        snapshot=None,
        risk=None,
        profile=None,
    ):
        """Construct a FinancialContextBuilder with mocked dependencies."""
        from app.services.financial_context_builder import FinancialContextBuilder
        from app.schemas.financial_metrics_schema import FinancialMetrics

        # Metrics service mock
        mock_metrics_service = MagicMock()
        default_metrics = FinancialMetrics(
            total_income=Decimal("100000"),
            total_expenses=Decimal("75000"),
            net_cash_flow=Decimal("25000"),
            savings_rate=Decimal("25.0"),
            transaction_count=40,
            credit_count=5,
            debit_count=35,
            avg_transaction_amount=Decimal("5000"),
            largest_credit=Decimal("50000"),
            largest_debit=Decimal("20000"),
            top_spending_category="Shopping",
            top_spending_category_ratio=Decimal("0.3"),
            top_income_category="Salary",
            spending_categories_count=5,
            income_months_count=3,
            income_coefficient_of_variation=0.1,
        )
        mock_metrics_service.get_metrics = AsyncMock(
            return_value=metrics or default_metrics
        )

        # Transaction repo mock
        mock_txn_repo = MagicMock()
        # Default: no transactions for category breakdown
        mock_txn_repo.get_by_user_filtered = AsyncMock(
            return_value=(transactions or [], 0)
        )

        # Snapshot repo mock
        mock_snapshot_repo = MagicMock()
        mock_snapshot_repo.get_latest_by_user = AsyncMock(return_value=snapshot)

        # Analytics repo mock (for legacy risk profile)
        mock_analytics_repo = MagicMock()
        mock_analytics_repo.get_latest_risk_profile = AsyncMock(return_value=risk)

        # Financial profile repo mock
        mock_profile_repo = MagicMock()
        mock_profile_repo.get_by_user_id = AsyncMock(return_value=profile)

        return FinancialContextBuilder(
            transaction_repo=mock_txn_repo,
            analytics_repo=mock_analytics_repo,
            profile_repo=mock_profile_repo,
            snapshot_repo=mock_snapshot_repo,
            metrics_service=mock_metrics_service,
        )

    @pytest.mark.asyncio
    async def test_build_returns_context(self):
        builder = self._make_builder()
        ctx = await builder.build(uuid4())
        assert ctx is not None
        assert ctx.total_income == Decimal("100000")
        assert ctx.savings_rate == Decimal("25.0")

    @pytest.mark.asyncio
    async def test_build_no_snapshot_no_profile(self):
        builder = self._make_builder(snapshot=None, profile=None)
        ctx = await builder.build(uuid4())
        assert ctx.health_score is None
        assert ctx.risk_profile is None
        assert ctx.financial_goals == []

    @pytest.mark.asyncio
    async def test_build_with_profile_data(self):
        mock_profile = MagicMock()
        mock_profile.age_range = "26-35"
        mock_profile.employment_type = "salaried"
        mock_profile.monthly_income = Decimal("90000")
        mock_profile.earning_members = 1
        mock_profile.dependents_count = 2
        mock_profile.has_loans = True
        mock_profile.loan_types = ["home_loan"]
        mock_profile.monthly_emi = Decimal("20000")
        mock_profile.total_debt = Decimal("2500000")
        mock_profile.has_emergency_fund = True
        mock_profile.emergency_fund_months = 3.0
        mock_profile.has_health_insurance = True
        mock_profile.has_life_insurance = False
        mock_profile.monthly_investment = Decimal("5000")
        mock_profile.investment_types = ["mutual_funds"]
        mock_profile.risk_comfort = "moderate"
        mock_profile.financial_goals = ["retirement"]
        mock_profile.profile_completion_percentage = 80.0

        builder = self._make_builder(profile=mock_profile)
        ctx = await builder.build(uuid4())
        assert ctx.age_range == "26-35"
        assert ctx.has_loans is True
        assert "home_loan" in ctx.loan_types
        assert ctx.financial_goals == ["retirement"]
        assert ctx.profile_completion_pct == 80.0

    @pytest.mark.asyncio
    async def test_build_with_health_snapshot(self):
        from app.schemas.health_score_snapshot_schema import ComponentScores

        mock_snap = MagicMock()
        mock_snap.score = Decimal("72")
        mock_snap.band = "GOOD"
        mock_snap.risk_profile = "MODERATE"
        mock_snap.component_scores = ComponentScores(
            cash_flow_score=20.0,
            spending_score=15.0,
            debt_burden_score=18.0,
            emergency_score=10.0,
            income_stability_score=7.0,
            investment_readiness_score=2.0,
        )
        mock_snap.positive_factors = ["Strong income"]
        mock_snap.negative_factors = ["High debt"]
        mock_snap.suggestions = ["Build emergency fund"]

        builder = self._make_builder(snapshot=mock_snap)
        ctx = await builder.build(uuid4())
        assert ctx.health_score == Decimal("72")
        assert ctx.health_band == "GOOD"
        assert ctx.risk_profile == "MODERATE"
        assert ctx.component_scores.get("cash_flow_score") == 20.0


# ═══════════════════════════════════════════════════════════════════════════════
# AICoachService Integration-style Unit Tests (all deps mocked)
# ═══════════════════════════════════════════════════════════════════════════════


class TestAICoachService:

    def _make_service(self, provider_reply="Great advice!", tokens=100):
        """Build AICoachService with all collaborators mocked."""
        from app.services.ai_coach_service import AICoachService
        from app.services.ai_prompt_builder import AIPromptBuilder
        from app.services.ai_provider_service import AIProviderService
        from app.services.ai_response_guardrail_service import AIResponseGuardrailService

        # AICoachRepository mock
        conv_id = uuid4()
        mock_conv = MagicMock()
        mock_conv.id = conv_id
        mock_conv.title = "New Conversation"
        mock_conv.created_at = MagicMock()
        mock_conv.updated_at = MagicMock()
        mock_conv.messages = []

        mock_repo = MagicMock()
        mock_repo.get_conversation = AsyncMock(return_value=None)  # triggers new conv
        mock_repo.create_conversation = AsyncMock(return_value=mock_conv)
        mock_repo.get_recent_messages = AsyncMock(return_value=[])
        mock_repo.add_message = AsyncMock(return_value=MagicMock())
        mock_repo.list_conversations = AsyncMock(return_value=[])
        mock_repo.delete_conversation = AsyncMock(return_value=True)

        # ContextBuilder mock
        ctx = _make_ctx()
        mock_ctx_builder = MagicMock()
        mock_ctx_builder.build = AsyncMock(return_value=ctx)

        # PromptBuilder
        prompt_builder = AIPromptBuilder()

        # ProviderService mock
        mock_provider = MagicMock(spec=AIProviderService)
        mock_provider.generate = AsyncMock(return_value=(provider_reply, tokens))
        mock_provider.provider_name = "disabled"
        mock_provider.model_name = "rule-based"

        service = AICoachService(
            ai_coach_repo=mock_repo,
            context_builder=mock_ctx_builder,
            prompt_builder=prompt_builder,
            provider_service=mock_provider,
            guardrail_service=AIResponseGuardrailService,
        )
        return service, mock_repo, mock_provider, conv_id

    @pytest.mark.asyncio
    async def test_chat_in_scope_returns_reply(self):
        service, repo, provider, conv_id = self._make_service()
        from app.schemas.ai_coach_schema import AIChatRequest

        req = AIChatRequest(message="How can I improve my savings rate?")
        resp = await service.chat(uuid4(), req)

        assert resp.reply == "Great advice!"
        assert resp.intent == "saving_advice"
        assert resp.conversation_id == conv_id

    @pytest.mark.asyncio
    async def test_chat_out_of_scope_returns_oos_reply(self):
        service, repo, provider, conv_id = self._make_service()
        from app.schemas.ai_coach_schema import AIChatRequest

        req = AIChatRequest(message="Write a poem about love")
        resp = await service.chat(uuid4(), req)

        assert resp.reply == OUT_OF_SCOPE_REPLY
        assert resp.intent == "out_of_scope"
        # Provider should NOT have been called for OOS
        provider.generate.assert_not_called()

    @pytest.mark.asyncio
    async def test_chat_persists_both_messages(self):
        service, repo, provider, conv_id = self._make_service()
        from app.schemas.ai_coach_schema import AIChatRequest

        req = AIChatRequest(message="How do I manage debt?")
        await service.chat(uuid4(), req)

        # Should have called add_message twice (user + assistant)
        assert repo.add_message.call_count == 2

    @pytest.mark.asyncio
    async def test_chat_uses_existing_conversation_if_valid(self):
        service, repo, provider, _ = self._make_service()
        existing_id = uuid4()
        existing_conv = MagicMock()
        existing_conv.id = existing_id
        repo.get_conversation = AsyncMock(return_value=existing_conv)

        from app.schemas.ai_coach_schema import AIChatRequest
        req = AIChatRequest(message="Help me invest wisely", conversation_id=existing_id)
        resp = await service.chat(uuid4(), req)

        assert resp.conversation_id == existing_id
        repo.create_conversation.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_conversation(self):
        service, repo, _, _ = self._make_service()
        result = await service.create_conversation(uuid4(), "My plan")
        repo.create_conversation.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_conversation_returns_true(self):
        service, repo, _, _ = self._make_service()
        result = await service.delete_conversation(uuid4(), uuid4())
        assert result is True

    @pytest.mark.asyncio
    async def test_list_conversations_empty(self):
        service, repo, _, _ = self._make_service()
        result = await service.list_conversations(uuid4())
        assert result.total == 0
        assert result.conversations == []


# ═══════════════════════════════════════════════════════════════════════════════
# Edge Cases
# ═══════════════════════════════════════════════════════════════════════════════


class TestEdgeCases:

    def test_guardrail_classify_very_short_message(self):
        """Very short ambiguous messages should not crash."""
        result = AIResponseGuardrailService.classify_intent("hi")
        assert isinstance(result, str)

    def test_guardrail_classify_empty_string(self):
        result = AIResponseGuardrailService.classify_intent("")
        assert isinstance(result, str)

    def test_prompt_builder_no_insurance_data(self):
        ctx = _make_ctx(has_health_insurance=None, has_life_insurance=None)
        builder = AIPromptBuilder()
        prompt = builder.build_system_prompt(ctx)
        # Should not crash; insurance lines simply absent
        assert "SAFETY RULES" in prompt

    def test_prompt_builder_no_goals(self):
        ctx = _make_ctx(financial_goals=[])
        builder = AIPromptBuilder()
        prompt = builder.build_system_prompt(ctx)
        # Goals section absent, no crash
        assert "WealthWise Coach" in prompt

    def test_rule_based_saving_advice_moderate_rate(self):
        ctx = _make_ctx(savings_rate=Decimal("15.0"))
        reply = _rule_based_response("saving_advice", ctx)
        assert "15.0" in reply
        assert "50-30-20" in reply or "right track" in reply

    def test_context_category_spending_empty(self):
        ctx = _make_ctx(category_spending={})
        builder = AIPromptBuilder()
        prompt = builder.build_system_prompt(ctx)
        # No category spending section, no crash
        assert "Health Score" in prompt
