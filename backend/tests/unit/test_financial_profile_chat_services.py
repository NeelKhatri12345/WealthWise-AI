"""
WealthWise AI - Unit Tests for Stage 2 Services

Covers:
  - FinancialProfileService._compute_completion logic
  - FinancialChatService step extractor functions
  - HybridHealthScoreService component scorers
  - HybridHealthScoreService band and risk profile logic

All tests are pure unit tests (no DB, no HTTP).
"""

from decimal import Decimal
from typing import Optional
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.schemas.financial_metrics_schema import FinancialMetrics


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _make_metrics(
    savings_rate: float = 20.0,
    total_income: float = 100_000,
    total_expenses: float = 80_000,
    net_cash_flow: float = 20_000,
    income_cv: Optional[float] = 0.1,
    top_spend_ratio: Optional[float] = 0.3,
    spend_cats: int = 5,
    income_months: int = 3,
    transaction_count: int = 30,
) -> FinancialMetrics:
    return FinancialMetrics(
        total_income=Decimal(str(total_income)),
        total_expenses=Decimal(str(total_expenses)),
        net_cash_flow=Decimal(str(net_cash_flow)),
        savings_rate=Decimal(str(savings_rate)),
        transaction_count=transaction_count,
        credit_count=5,
        debit_count=25,
        avg_transaction_amount=Decimal("5000"),
        largest_credit=Decimal("50000"),
        largest_debit=Decimal("20000"),
        top_spending_category="Shopping",
        top_spending_category_ratio=Decimal(str(top_spend_ratio)) if top_spend_ratio is not None else None,
        top_income_category="Salary",
        spending_categories_count=spend_cats,
        income_months_count=income_months,
        income_coefficient_of_variation=Decimal(str(income_cv)) if income_cv is not None else None,
    )


def _make_profile(**kwargs):
    """Create a minimal mock profile object."""
    profile = MagicMock()
    # Defaults
    profile.has_loans = False
    profile.monthly_emi = None
    profile.monthly_income = Decimal("100000")
    profile.total_debt = None
    profile.has_emergency_fund = True
    profile.emergency_fund_months = 6.0
    profile.has_health_insurance = True
    profile.has_life_insurance = True
    profile.monthly_investment = Decimal("15000")
    profile.investment_types = ["mutual_funds", "ppf", "nps"]
    profile.risk_comfort = "moderate"
    profile.income_stability = "stable"
    profile.financial_goals = ["retirement", "house"]
    # Override with kwargs
    for k, v in kwargs.items():
        setattr(profile, k, v)
    return profile


# ── FinancialProfileService._compute_completion ────────────────────────────────


class TestComputeCompletion:
    def test_empty_profile_returns_zero(self):
        from app.services.financial_profile_service import _compute_completion

        profile = MagicMock()
        # All fields are None
        for attr in [
            "age_range", "employment_type", "monthly_income", "family_income",
            "earning_members", "dependents_count", "has_loans", "monthly_emi",
            "has_emergency_fund", "emergency_fund_months", "has_health_insurance",
            "has_life_insurance", "monthly_investment", "investment_types",
            "risk_comfort", "financial_goals", "income_stability",
        ]:
            setattr(profile, attr, None)

        assert _compute_completion(profile) == 0.0

    def test_full_profile_returns_100(self):
        from app.services.financial_profile_service import _COMPLETION_FIELDS, _compute_completion

        profile = MagicMock()
        for attr in _COMPLETION_FIELDS:
            setattr(profile, attr, "filled")

        assert _compute_completion(profile) == 100.0

    def test_partial_profile_returns_correct_percentage(self):
        from app.services.financial_profile_service import _COMPLETION_FIELDS, _compute_completion

        profile = MagicMock()
        for attr in _COMPLETION_FIELDS:
            setattr(profile, attr, None)

        # Fill exactly half
        half = len(_COMPLETION_FIELDS) // 2
        for attr in _COMPLETION_FIELDS[:half]:
            setattr(profile, attr, "filled")

        expected = round((half / len(_COMPLETION_FIELDS)) * 100.0, 1)
        assert _compute_completion(profile) == expected

    def test_none_profile_returns_zero(self):
        from app.services.financial_profile_service import _compute_completion

        assert _compute_completion(None) == 0.0


# ── FinancialChatService step extractors ──────────────────────────────────────


class TestStepExtractors:
    """
    Step map (new):
      0 → age_range
      1 → employment_type
      2 → income / income_source  (dynamic; pass employment arg)
      3 → earning_members, dependents_count
      4 → has_loans, loan_types, monthly_emi, total_debt
      5 → has_emergency_fund, emergency_fund_months
      6 → has_health_insurance, has_life_insurance
      7 → monthly_investment, investment_types
      8 → risk_comfort
      9 → financial_goals
    """

    # ── Step 0: age_range ─────────────────────────────────────────────────────

    def test_extract_step0_salaried_age_range(self):
        from app.services.financial_chat_service import _extract_step0

        result = _extract_step0("26-35", None)
        assert result.get("age_range") == "26-35"

    def test_extract_step0_business_owner(self):
        from app.services.financial_chat_service import _extract_step0

        result = _extract_step0("40 years old", None)
        assert result.get("age_range") == "36-45"

    def test_extract_step0_chip_55plus(self):
        from app.services.financial_chat_service import _extract_step0

        result = _extract_step0("55+", None)
        assert result.get("age_range") == "55+"

    # ── Step 1: employment_type ───────────────────────────────────────────────

    def test_extract_step1_salaried(self):
        from app.services.financial_chat_service import _extract_step1

        result = _extract_step1("Salaried", None)
        assert result.get("employment_type") == "salaried"

    def test_extract_step1_business_owner(self):
        from app.services.financial_chat_service import _extract_step1

        result = _extract_step1("Business Owner", None)
        assert result.get("employment_type") == "business_owner"

    def test_extract_step1_student(self):
        from app.services.financial_chat_service import _extract_step1

        result = _extract_step1("Student", None)
        assert result.get("employment_type") == "student"

    def test_extract_step1_unemployed(self):
        from app.services.financial_chat_service import _extract_step1

        result = _extract_step1("Unemployed", None)
        assert result.get("employment_type") == "unemployed"

    # ── Step 2: income (dynamic based on employment) ─────────────────────────

    def test_extract_step2_salaried_two_numbers(self):
        from app.services.financial_chat_service import _extract_step2

        result = _extract_step2("My income is 75000", "salaried")
        assert result.get("monthly_income") == 75000.0

    def test_extract_step2_lakh_shorthand(self):
        from app.services.financial_chat_service import _extract_step2

        result = _extract_step2("1 lakh per month", "salaried")
        assert result.get("monthly_income") == 100000.0

    def test_extract_step2_student_family_support(self):
        from app.services.financial_chat_service import _extract_step2

        result = _extract_step2("Family support", "student")
        assert result.get("monthly_income") == 0.0

    def test_extract_step2_unemployed_no_income(self):
        from app.services.financial_chat_service import _extract_step2

        result = _extract_step2("No income currently", "unemployed")
        assert result.get("monthly_income") == 0.0

    def test_extract_step2_student_stipend(self):
        from app.services.financial_chat_service import _extract_step2

        result = _extract_step2("Stipend", "student")
        assert result.get("income_source") == "stipend"

    # ── Step 3: earners + dependents ─────────────────────────────────────────

    def test_extract_step3_earners_and_dependents(self):
        from app.services.financial_chat_service import _extract_step3

        result = _extract_step3("2 earning members and 3 dependents", None)
        assert result.get("earning_members") == 2
        assert result.get("dependents_count") == 3

    # ── Step 4: loans ─────────────────────────────────────────────────────────

    def test_extract_step4_no_loan(self):
        from app.services.financial_chat_service import _extract_step4

        result = _extract_step4("No active loans", None)
        assert result.get("has_loans") is False
        assert result.get("monthly_emi") == 0.0

    def test_extract_step4_with_home_loan(self):
        from app.services.financial_chat_service import _extract_step4

        result = _extract_step4("I have a home loan, EMI is 20000, total 25 lakh", None)
        assert result.get("has_loans") is True
        assert "home_loan" in result.get("loan_types", [])
        assert result.get("monthly_emi") == 20000.0

    # ── Step 5: emergency fund ────────────────────────────────────────────────

    def test_extract_step5_no_emergency_fund(self):
        from app.services.financial_chat_service import _extract_step5

        result = _extract_step5("No emergency fund", None)
        assert result.get("has_emergency_fund") is False
        assert result.get("emergency_fund_months") == 0.0

    def test_extract_step5_6_months(self):
        from app.services.financial_chat_service import _extract_step5

        result = _extract_step5("I have 6 months emergency fund", None)
        assert result.get("has_emergency_fund") is True
        assert result.get("emergency_fund_months") == 6.0

    # ── Step 6: insurance ─────────────────────────────────────────────────────

    def test_extract_step6_both_insurance(self):
        from app.services.financial_chat_service import _extract_step6

        result = _extract_step6("Both health and life insurance", None)
        assert result.get("has_health_insurance") is True
        assert result.get("has_life_insurance") is True

    def test_extract_step6_neither(self):
        from app.services.financial_chat_service import _extract_step6

        result = _extract_step6("Neither insurance", None)
        assert result.get("has_health_insurance") is False
        assert result.get("has_life_insurance") is False

    # ── Step 7: investments ───────────────────────────────────────────────────

    def test_extract_step7_mutual_funds(self):
        from app.services.financial_chat_service import _extract_step7

        result = _extract_step7("10000 in mutual funds and stocks monthly", None)
        assert result.get("monthly_investment") == 10000.0
        assert "mutual_funds" in result.get("investment_types", [])
        assert "stocks" in result.get("investment_types", [])

    def test_extract_step7_no_investment(self):
        from app.services.financial_chat_service import _extract_step7

        result = _extract_step7("Not investing yet, zero investment", None)
        assert result.get("monthly_investment") == 0.0

    # ── Step 8: risk comfort ──────────────────────────────────────────────────

    def test_extract_step8_risk_comfort(self):
        from app.services.financial_chat_service import _extract_step8

        assert _extract_step8("Low risk please", None)["risk_comfort"] == "low"
        assert _extract_step8("High risk, aggressive", None)["risk_comfort"] == "high"
        assert _extract_step8("Moderate balanced", None)["risk_comfort"] == "moderate"

    # ── Step 9: financial goals ───────────────────────────────────────────────

    def test_extract_step9_goals(self):
        from app.services.financial_chat_service import _extract_step9

        result = _extract_step9("Retirement and buy a house", None)
        goals = result.get("financial_goals", [])
        assert "retirement" in goals
        assert "house" in goals

    # ── Validation helper ─────────────────────────────────────────────────────

    def test_validate_gibberish_rejected(self):
        from app.services.financial_chat_service import _validate_step

        assert _validate_step(0, "asdf", None) is False
        assert _validate_step(0, "xyz", None) is False
        assert _validate_step(1, "qwer", None) is False

    def test_validate_age_step_accepted(self):
        from app.services.financial_chat_service import _validate_step

        assert _validate_step(0, "26-35", None) is True
        assert _validate_step(0, "32 years old", None) is True

    def test_validate_employment_accepted(self):
        from app.services.financial_chat_service import _validate_step

        assert _validate_step(1, "Salaried", None) is True
        assert _validate_step(1, "Student", None) is True

    def test_validate_student_income_source(self):
        from app.services.financial_chat_service import _validate_step

        assert _validate_step(2, "Family support", "student") is True
        assert _validate_step(2, "Stipend", "student") is True

    def test_validate_invalid_income_for_student(self):
        from app.services.financial_chat_service import _validate_step

        # Pure gibberish
        assert _validate_step(2, "asdfghjkl", "student") is False

    def test_validate_no_loans(self):
        from app.services.financial_chat_service import _validate_step

        assert _validate_step(4, "No active loans", None) is True




# ── HybridHealthScoreService component scorers ─────────────────────────────────


class TestHybridScorerComponents:

    def test_savings_cashflow_high_savings(self):
        from app.services.hybrid_health_score_service import _score_savings_cashflow

        m = _make_metrics(savings_rate=35.0)
        assert _score_savings_cashflow(m) == 25.0

    def test_savings_cashflow_zero_savings(self):
        from app.services.hybrid_health_score_service import _score_savings_cashflow

        m = _make_metrics(savings_rate=0.0)
        assert _score_savings_cashflow(m) == 8.0

    def test_savings_cashflow_negative(self):
        from app.services.hybrid_health_score_service import _score_savings_cashflow

        m = _make_metrics(savings_rate=-20.0)
        assert _score_savings_cashflow(m) == 0.0

    def test_spending_discipline_excellent(self):
        from app.services.hybrid_health_score_service import _score_spending_discipline

        m = _make_metrics(
            total_income=100_000, total_expenses=55_000, top_spend_ratio=0.25
        )
        score = _score_spending_discipline(m, None)
        assert score == 20.0

    def test_spending_discipline_poor(self):
        from app.services.hybrid_health_score_service import _score_spending_discipline

        m = _make_metrics(
            total_income=100_000, total_expenses=110_000, top_spend_ratio=0.75
        )
        score = _score_spending_discipline(m, None)
        assert score == 0.0

    def test_debt_burden_no_loans(self):
        from app.services.hybrid_health_score_service import _score_debt_burden

        p = _make_profile(has_loans=False)
        m = _make_metrics()
        assert _score_debt_burden(m, p) == 20.0

    def test_debt_burden_high_emi(self):
        from app.services.hybrid_health_score_service import _score_debt_burden

        p = _make_profile(has_loans=True, monthly_emi=Decimal("60000"), monthly_income=Decimal("100000"))
        m = _make_metrics()
        assert _score_debt_burden(m, p) == 0.0  # 60% EMI ratio

    def test_emergency_preparedness_full(self):
        from app.services.hybrid_health_score_service import _score_emergency_preparedness

        p = _make_profile(emergency_fund_months=9.0, has_health_insurance=True, has_life_insurance=True)
        m = _make_metrics()
        assert _score_emergency_preparedness(m, p) == 15.0

    def test_emergency_preparedness_none(self):
        from app.services.hybrid_health_score_service import _score_emergency_preparedness

        p = _make_profile(emergency_fund_months=0.0, has_health_insurance=False, has_life_insurance=False)
        m = _make_metrics()
        assert _score_emergency_preparedness(m, p) == 0.0

    def test_income_stability_very_stable(self):
        from app.services.hybrid_health_score_service import _score_income_stability

        p = _make_profile(income_stability="very_stable")
        m = _make_metrics(income_cv=0.05)
        score = _score_income_stability(m, p)
        assert score == 10.0

    def test_investment_readiness_diversified(self):
        from app.services.hybrid_health_score_service import _score_investment_readiness

        p = _make_profile(
            monthly_investment=Decimal("25000"),
            monthly_income=Decimal("100000"),
            investment_types=["mutual_funds", "ppf", "nps"],
        )
        m = _make_metrics()
        score = _score_investment_readiness(m, p)
        assert score == 10.0  # 25% investment rate → 7pts + 3 types → 3pts = 10


# ── Score band thresholds ──────────────────────────────────────────────────────


class TestScoreBand:
    def test_bands(self):
        from app.services.hybrid_health_score_service import _score_to_band

        assert _score_to_band(92) == "EXCELLENT"
        assert _score_to_band(75) == "GOOD"
        assert _score_to_band(60) == "FAIR"
        assert _score_to_band(45) == "WEAK"
        assert _score_to_band(25) == "CRITICAL"


# ── Risk profile determination ─────────────────────────────────────────────────


class TestRiskProfile:
    def test_aggressive_high_readiness(self):
        from app.services.hybrid_health_score_service import _determine_risk_profile

        p = _make_profile(risk_comfort="high")
        assert _determine_risk_profile(p, debt_score=19.0, emergency_score=14.0) == "AGGRESSIVE"

    def test_conservative_low_readiness(self):
        from app.services.hybrid_health_score_service import _determine_risk_profile

        p = _make_profile(risk_comfort="low")
        assert _determine_risk_profile(p, debt_score=5.0, emergency_score=2.0) == "CONSERVATIVE"

        p = _make_profile(risk_comfort="moderate")
        result = _determine_risk_profile(p, debt_score=15.0, emergency_score=10.0)
        assert result == "MODERATE"


# ── FinancialChatService GoToPrevious & Step 9 Validation tests ────────────────

class TestFinancialChatServiceGoToPrevious:

    @pytest.mark.asyncio
    async def test_go_to_previous_step(self):
        from unittest.mock import AsyncMock, MagicMock
        from uuid import uuid4
        from datetime import datetime, timezone
        from app.services.financial_chat_service import FinancialChatService, SendMessageResponse

        chat_repo = MagicMock()
        profile_svc = MagicMock()
        txn_repo = MagicMock()

        session_id = uuid4()
        user_id = uuid4()

        # Mock active session
        session = MagicMock()
        session.id = session_id
        session.user_id = user_id
        session.current_step = 2
        session.status = "active"

        chat_repo.get_session = AsyncMock(return_value=session)
        
        # Mock messages (assistant Q0, user A0, assistant Q1, user A1)
        msg0 = MagicMock()
        msg0.sender = "assistant"
        msg0.created_at = datetime.now(timezone.utc)
        
        msg1 = MagicMock()
        msg1.sender = "user"
        msg1.created_at = datetime.now(timezone.utc)
        
        msg2 = MagicMock()
        msg2.sender = "assistant"
        msg2.created_at = datetime.now(timezone.utc) # Q1
        
        msg3 = MagicMock()
        msg3.sender = "user"
        msg3.created_at = datetime.now(timezone.utc)
        
        chat_repo.get_messages = AsyncMock(return_value=[msg0, msg1, msg2, msg3])
        chat_repo.db = MagicMock()
        chat_repo.db.execute = AsyncMock()
        chat_repo.db.flush = AsyncMock()

        # Mock profile
        profile = MagicMock()
        profile.employment_type = "salaried"
        profile.profile_completion_percentage = 45.5
        profile_svc.get_profile = AsyncMock(return_value=profile)

        service = FinancialChatService(chat_repo, txn_repo, profile_svc)
        response = await service.go_to_previous_step(session_id, user_id)

        assert isinstance(response, SendMessageResponse)
        assert response.current_step == 1
        assert session.current_step == 1
        chat_repo.db.execute.assert_called_once()
        # Verify no deletion/clearing fields on profile was called
        profile_svc.update_fields_from_chat.assert_not_called()

    def test_step9_validation_strict(self):
        from app.services.financial_chat_service import _validate_step

        # Gibberish/random text should be rejected
        assert _validate_step(9, "asdfghjkl", None) is False
        assert _validate_step(9, "xyzq", None) is False
        assert _validate_step(9, "random random goals", None) is False
        assert _validate_step(9, "car", None) is False
        assert _validate_step(9, "my dream car", None) is False

        # Valid goal chips exactly should be accepted
        chips = [
            "Retirement",
            "Buy a House",
            "Children's Education",
            "Build Emergency Fund",
            "Wealth Building",
            "Travel",
            "Start a Business",
            "Become Debt-Free",
        ]
        for chip in chips:
            assert _validate_step(9, chip, None) is True

        # Accept aliases
        aliases = [
            "debt free", "debt-free", "become debt free",
            "house", "buy house",
            "emergency fund",
            "wealth building",
            "child education", "children education"
        ]
        for alias in aliases:
            assert _validate_step(9, alias, None) is True

        # Multiple goals accepted if comma-separated
        assert _validate_step(9, "Retirement, Buy a House, Travel", None) is True
        assert _validate_step(9, "Start a Business, Become Debt-Free", None) is True

        # Custom goals with keywords
        assert _validate_step(9, "investment and savings plan", None) is True
        assert _validate_step(9, "my child education fund", None) is True
        assert _validate_step(9, "emergency reserves", None) is True
        assert _validate_step(9, "buying a new family vehicle", None) is True


