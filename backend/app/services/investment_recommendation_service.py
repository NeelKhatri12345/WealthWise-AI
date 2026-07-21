"""
WealthWise AI - Investment Recommendation Service

Deterministic rule-engine that generates category-level investment recommendations.
NO specific stocks, mutual funds, ETFs, or guaranteed returns are recommended.
NO crypto in this phase.

Algorithm:
  1. Load latest Health Score Snapshot (required) -> else CTA error
  2. Load latest Risk Profile (required) -> else CTA error
  3. Load Financial Profile + Transaction Metrics
  4. Compute monthly_investable_amount = income - expenses - emi - safety_buffer
  5. Generate all 3 strategies with base allocations
  6. Apply financial safety rules to select recommended strategy
  7. Compute readiness score (0-100)
  8. Build reasoning, warnings, 30-day action plan
  9. Persist and return snapshot
"""

from __future__ import annotations

from decimal import Decimal
from typing import Optional
from uuid import UUID

from app.core.logger import logger
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.financial_profile_repository import FinancialProfileRepository
from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
from app.repositories.investment_recommendation_repository import (
    InvestmentRecommendationRepository,
)
from app.services.financial_metrics_service import FinancialMetricsService


# ── Base category allocations (%) — allowed categories only ───────────────────
# Percentages sum to 100 for each strategy
_BASE_ALLOCATIONS = {
    "conservative": [
        {"category": "Emergency Fund", "percentage": 20.0, "priority": "HIGH",
         "rationale": "Build 6-month expense buffer before investing elsewhere."},
        {"category": "Fixed Deposits / RD", "percentage": 30.0, "priority": "HIGH",
         "rationale": "Capital-safe, predictable returns ideal for risk-averse profiles."},
        {"category": "Debt Mutual Funds", "percentage": 25.0, "priority": "MEDIUM",
         "rationale": "Better post-tax returns than FDs with relatively low risk."},
        {"category": "SIP / Index Funds", "percentage": 10.0, "priority": "MEDIUM",
         "rationale": "Slow, steady equity exposure via diversified index funds."},
        {"category": "Equity Mutual Funds", "percentage": 10.0, "priority": "MEDIUM",
         "rationale": "Managed equity exposure for long-term growth."},
        {"category": "Gold", "percentage": 5.0, "priority": "LOW",
         "rationale": "Inflation hedge; recommended 5% as a portfolio stabiliser."},
    ],
    "balanced": [
        {"category": "Emergency Fund", "percentage": 10.0, "priority": "HIGH",
         "rationale": "Maintain liquid buffer for emergency expenses."},
        {"category": "Fixed Deposits / RD", "percentage": 20.0, "priority": "MEDIUM",
         "rationale": "Short-term liquid safety net for near-term financial goals."},
        {"category": "Debt Mutual Funds", "percentage": 20.0, "priority": "MEDIUM",
         "rationale": "Balances the portfolio with stable debt exposure."},
        {"category": "SIP / Index Funds", "percentage": 30.0, "priority": "HIGH",
         "rationale": "Core equity growth engine; diversified and cost-efficient."},
        {"category": "Equity Mutual Funds", "percentage": 15.0, "priority": "MEDIUM",
         "rationale": "Active equity exposure for potential alpha over index."},
        {"category": "Gold", "percentage": 5.0, "priority": "LOW",
         "rationale": "5% gold as an inflation and currency hedge."},
    ],
    "aggressive": [
        {"category": "Emergency Fund", "percentage": 5.0, "priority": "HIGH",
         "rationale": "Maintain minimum 3-month buffer even in aggressive portfolios."},
        {"category": "Fixed Deposits / RD", "percentage": 10.0, "priority": "MEDIUM",
         "rationale": "Capital-safe reserve for short-term stability."},
        {"category": "Debt Mutual Funds", "percentage": 15.0, "priority": "MEDIUM",
         "rationale": "Debt cushion for portfolio stability."},
        {"category": "SIP / Index Funds", "percentage": 35.0, "priority": "HIGH",
         "rationale": "Large core index position for efficient market exposure."},
        {"category": "Equity Mutual Funds", "percentage": 30.0, "priority": "HIGH",
         "rationale": "Active equity dominates for maximum long-term wealth creation."},
        {"category": "Gold", "percentage": 5.0, "priority": "LOW",
         "rationale": "Standard 5% gold allocation as portfolio anchor."},
    ],
}

_STRATEGY_DESCRIPTIONS = {
    "conservative": (
        "Prioritises capital preservation with high FD/RD and debt fund exposure. "
        "Suitable for users with low health scores, high debt, or unstable income. "
        "Equity exposure is kept minimal."
    ),
    "balanced": (
        "Equal emphasis on growth and capital protection. Blends index funds, "
        "equity mutual funds, and debt instruments. Best for users with a healthy "
        "financial base and moderate risk tolerance."
    ),
    "aggressive": (
        "Maximises long-term wealth creation through equity-heavy allocation. "
        "Suitable only when health score is strong, emergency fund is adequate, "
        "debt is low, and risk profile is aggressive."
    ),
}


class InvestmentRecommendationService:
    """
    Generates and persists investment recommendation snapshots.
    Pure logic — no AI calls. All output is deterministic and rule-based.
    """

    def __init__(
        self,
        snapshot_repo: HealthScoreSnapshotRepository,
        analytics_repo: AnalyticsRepository,
        profile_repo: FinancialProfileRepository,
        metrics_service: FinancialMetricsService,
        recommendation_repo: InvestmentRecommendationRepository,
    ) -> None:
        self._snapshot_repo = snapshot_repo
        self._analytics_repo = analytics_repo
        self._profile_repo = profile_repo
        self._metrics = metrics_service
        self._rec_repo = recommendation_repo

    # ── Public API ─────────────────────────────────────────────────────────────

    async def calculate(self, user_id: UUID) -> dict:
        """
        Compute and persist a new investment recommendation snapshot.
        Returns the snapshot as a dict suitable for the API response.

        Raises ValueError with a CTA message when prerequisites are missing.
        """
        # Step 1: Load Health Score Snapshot (required)
        health_snap = await self._snapshot_repo.get_latest_by_user(user_id)
        if health_snap is None:
            raise ValueError(
                "Complete your Financial Health Score before generating an Investment Plan."
            )
        # Extract health score from latest snapshot
        health_score = float(health_snap.score)

        # Step 2: Load Risk Profile (from risk_profiles table or hybrid health score snapshot)
        risk_profile_rec = await self._analytics_repo.get_latest_risk_profile(user_id)
        if risk_profile_rec is not None:
            risk_level = (
                risk_profile_rec.risk_level.value
                if hasattr(risk_profile_rec.risk_level, "value")
                else str(risk_profile_rec.risk_level)
            ).upper()
            risk_profile_id = risk_profile_rec.id
        elif health_snap and health_snap.risk_profile:
            risk_level = str(health_snap.risk_profile).upper()
            risk_profile_id = None
        else:
            risk_level = "MODERATE"
            risk_profile_id = None

        # Step 3: Load Financial Profile + Transaction Metrics
        profile = await self._profile_repo.get_by_user_id(user_id)
        try:
            metrics = await self._metrics.get_metrics(user_id)
        except Exception:
            metrics = None

        # ── Derive key financial inputs ────────────────────────────────────────
        # Income: prefer declared monthly income, fall back to transaction-derived
        if profile and profile.monthly_income and profile.monthly_income > 0:
            monthly_income = float(profile.monthly_income)
            income_source = "profile.monthly_income"
        elif metrics and metrics.total_income and metrics.total_income > 0:
            monthly_income = float(metrics.total_income) / max(1, self._estimate_months(metrics))
            income_source = "transaction-derived (metrics.total_income / months_est)"
        else:
            monthly_income = 0.0
            income_source = "none — both profile.monthly_income and metrics.total_income are 0/None"

        if metrics and metrics.total_expenses:
            monthly_expenses = float(metrics.total_expenses) / max(1, self._estimate_months(metrics))
            expenses_source = "transaction-derived (metrics.total_expenses / months_est)"
        else:
            monthly_expenses = 0.0
            expenses_source = "none — metrics.total_expenses is 0/None"

        monthly_emi = float(profile.monthly_emi) if profile and profile.monthly_emi else 0.0
        emergency_months = float(profile.emergency_fund_months) if profile and profile.emergency_fund_months else 0.0
        has_emergency = bool(profile.has_emergency_fund) if profile else False
        employment_type = profile.employment_type if profile else None
        income_stability = getattr(profile, "income_stability", None) if profile else None
        total_debt = float(profile.total_debt) if profile and profile.total_debt else 0.0

        # Safety buffer scales with health
        if health_score >= 70:
            buffer_pct = 0.10
        elif health_score >= 50:
            buffer_pct = 0.15
        else:
            buffer_pct = 0.20
        safety_buffer = monthly_income * buffer_pct

        # ── TEMPORARY DIAGNOSTIC LOGGING ──────────────────────────────────────
        months_est = self._estimate_months(metrics)
        print("\n\n==================== DIAG REACHED ====================\n")
        logger.info(
            f"[DIAG] Investment recommendation calculation inputs | "
            f"user_id={user_id} | "
            f"profile.monthly_income={profile.monthly_income if profile else 'no profile'} | "
            f"income_source={income_source} | "
            f"metrics.total_income={metrics.total_income if metrics else 'no metrics'} | "
            f"metrics.total_expenses={metrics.total_expenses if metrics else 'no metrics'} | "
            f"metrics.income_months_count={metrics.income_months_count if metrics else 'no metrics'} | "
            f"metrics.transaction_count={metrics.transaction_count if metrics else 'no metrics'} | "
            f"months_est={months_est} | "
            f"monthly_income={monthly_income} | "
            f"monthly_expenses={monthly_expenses} | "
            f"expenses_source={expenses_source} | "
            f"monthly_emi={monthly_emi} | "
            f"health_score={health_score} | "
            f"safety_buffer_pct={buffer_pct * 100}% | "
            f"safety_buffer={safety_buffer} | "
            f"monthly_investable_before_max={monthly_income - monthly_expenses - monthly_emi - safety_buffer}"
        )
        # ── END TEMPORARY DIAGNOSTIC LOGGING ──────────────────────────────────

        monthly_investable = max(
            0.0, monthly_income - monthly_expenses - monthly_emi - safety_buffer
        )

        logger.info(
            f"[DIAG] final monthly_investable_amount={monthly_investable} | user_id={user_id}"
        )

        # Step 4: Compute investment readiness score (0–100)
        readiness_score = self._compute_readiness_score(
            health_score=health_score,
            emergency_months=emergency_months,
            has_emergency=has_emergency,
            monthly_investable=monthly_investable,
            monthly_income=monthly_income,
            monthly_emi=monthly_emi,
            total_debt=total_debt,
        )

        if readiness_score >= 70:
            investment_readiness = "READY"
        elif readiness_score >= 40:
            investment_readiness = "PARTIAL"
        else:
            investment_readiness = "NOT_READY"

        # Step 5: Apply safety rules to select recommended strategy
        recommended = self._select_strategy(
            health_score=health_score,
            risk_level=risk_level,
            emergency_months=emergency_months,
            has_emergency=has_emergency,
            monthly_emi=monthly_emi,
            monthly_income=monthly_income,
            employment_type=employment_type,
            income_stability=income_stability,
        )

        # ── Setup dynamic rule parameters ──
        age = 30.0
        if profile and profile.age_range:
            age_map = {"18-25": 22.0, "26-35": 30.0, "36-45": 40.0, "46-55": 50.0, "55+": 60.0, "56+": 60.0}
            age = age_map.get(profile.age_range, 30.0)

        savings_rate = 20.0
        if metrics and metrics.savings_rate is not None:
            savings_rate = float(metrics.savings_rate)

        goals = list(profile.financial_goals or []) if profile else []
        horizon = "SHORT"
        if "retirement" in goals or "wealth_creation" in goals:
            horizon = "LONG"
        elif "house" in goals or "education" in goals:
            horizon = "MEDIUM"

        stability_str = str(income_stability or "stable").lower()

        # Existing portfolio holdings querying
        from app.repositories.portfolio_holding_repository import PortfolioHoldingRepository
        try:
            holding_repo = PortfolioHoldingRepository(self._rec_repo.db)
            holdings = await holding_repo.get_by_user(user_id)
            total_val = sum(float(h.current_value) for h in holdings)
            stocks_val = sum(float(h.current_value) for h in holdings if h.asset_type.lower() in ("stocks", "stock"))
            existing_stocks_pct = (stocks_val / total_val * 100.0) if total_val > 0.0 else 0.0
        except Exception:
            existing_stocks_pct = 0.0

        # Step 6: Adjust allocations based on financial situation (Allocation Rule Engine)
        adjusted_allocations = self._adjust_allocations(
            strategy=recommended,
            health_score=health_score,
            readiness_score=readiness_score,
            age=age,
            savings_rate=savings_rate,
            has_emergency=has_emergency,
            emergency_months=emergency_months,
            existing_stocks_pct=existing_stocks_pct,
            goals=goals,
            horizon=horizon,
            monthly_emi=monthly_emi,
            monthly_income=monthly_income,
            income_stability=stability_str,
        )

        # Step 7: Build all 3 strategies for metadata
        all_strategies = {}
        for strategy_name in ["conservative", "balanced", "aggressive"]:
            adj = self._adjust_allocations(
                strategy=strategy_name,
                health_score=health_score,
                readiness_score=readiness_score,
                age=age,
                savings_rate=savings_rate,
                has_emergency=has_emergency,
                emergency_months=emergency_months,
                existing_stocks_pct=existing_stocks_pct,
                goals=goals,
                horizon=horizon,
                monthly_emi=monthly_emi,
                monthly_income=monthly_income,
                income_stability=stability_str,
            )
            all_strategies[strategy_name] = {
                "name": strategy_name,
                "label": strategy_name.capitalize(),
                "description": _STRATEGY_DESCRIPTIONS[strategy_name],
                "allocation": self._compute_amounts(adj, monthly_investable),
            }

        # Step 8: Build recommendation allocation with ₹ amounts
        allocation_with_amounts = self._compute_amounts(adjusted_allocations, monthly_investable)

        # Step 9: Build reasoning
        reasoning = self._build_reasoning(
            recommended=recommended,
            health_score=health_score,
            risk_level=risk_level,
            emergency_months=emergency_months,
            has_emergency=has_emergency,
            monthly_emi=monthly_emi,
            monthly_income=monthly_income,
            employment_type=employment_type,
        )

        # Step 10: Build warnings
        warnings = self._build_warnings(
            health_score=health_score,
            emergency_months=emergency_months,
            has_emergency=has_emergency,
            monthly_emi=monthly_emi,
            monthly_income=monthly_income,
            monthly_investable=monthly_investable,
            investment_readiness=investment_readiness,
        )

        # Step 11: Build 30-day action plan (roadmap)
        action_plan = self._build_action_plan(
            recommended=recommended,
            emergency_months=emergency_months,
            has_emergency=has_emergency,
            monthly_emi=monthly_emi,
            monthly_investable=monthly_investable,
        )

        # Step 12: Persist snapshot
        data = {
            "user_id": user_id,
            "health_score_snapshot_id": health_snap.id,
            "risk_profile_snapshot_id": risk_profile_id,
            "investment_readiness": investment_readiness,
            "investment_readiness_score": Decimal(str(round(readiness_score, 2))),
            "recommended_strategy": recommended,
            "monthly_investable_amount": Decimal(str(round(monthly_investable, 2))),
            "allocation_json": allocation_with_amounts,
            "reasoning_json": reasoning,
            "warnings_json": warnings,
            "action_plan_json": action_plan,
            "metadata_json": {
                "all_strategies": all_strategies,
                "calculation_inputs": {
                    "health_score": health_score,
                    "health_band": health_snap.band,
                    "risk_level": risk_level,
                    "monthly_income": round(monthly_income, 2),
                    "monthly_expenses": round(monthly_expenses, 2),
                    "monthly_emi": round(monthly_emi, 2),
                    "safety_buffer": round(safety_buffer, 2),
                    "safety_buffer_pct": buffer_pct * 100,
                    "emergency_months": emergency_months,
                    "has_emergency_fund": has_emergency,
                    "employment_type": employment_type,
                    "income_stability": income_stability,
                    "total_debt": round(total_debt, 2),
                },
            },
        }

        snap = await self._rec_repo.save_snapshot(data)

        logger.info(
            "Investment recommendation calculated",
            extra={
                "user_id": str(user_id),
                "strategy": recommended,
                "readiness": investment_readiness,
                "readiness_score": readiness_score,
            },
        )

        return self._snapshot_to_dict(snap)

    async def get_latest(self, user_id: UUID) -> Optional[dict]:
        """Return the latest persisted snapshot or None."""
        snap = await self._rec_repo.get_latest_by_user(user_id)
        if snap is None:
            return None
        return self._snapshot_to_dict(snap)

    async def get_history(self, user_id: UUID, limit: int = 10) -> list[dict]:
        """Return slim history list."""
        snaps = await self._rec_repo.get_history(user_id, limit=limit)
        return [
            {
                "id": str(s.id),
                "investment_readiness": s.investment_readiness,
                "investment_readiness_score": float(s.investment_readiness_score) if s.investment_readiness_score else None,
                "recommended_strategy": s.recommended_strategy,
                "monthly_investable_amount": float(s.monthly_investable_amount) if s.monthly_investable_amount is not None else 0.0,
                "created_at": s.created_at.isoformat(),
            }
            for s in snaps
        ]

    # ── Private helpers ────────────────────────────────────────────────────────

    def _estimate_months(self, metrics) -> int:
        """Estimate the duration in months represented by the financial metrics."""
        if not metrics:
            return 1

        # Priority 1: income_months_count if present and > 0
        if getattr(metrics, "income_months_count", 0) and metrics.income_months_count > 0:
            return metrics.income_months_count

        # Priority 2: derive months from transaction dates if present on metrics
        if hasattr(metrics, "transactions") and metrics.transactions:
            dates = [t.date for t in metrics.transactions if hasattr(t, "date") and t.date]
            if dates:
                unique_months = {(d.year, d.month) for d in dates}
                if len(unique_months) > 0:
                    return len(unique_months)

        # Priority 3: fallback to 1
        return 1

    def _compute_readiness_score(
        self,
        health_score: float,
        emergency_months: float,
        has_emergency: bool,
        monthly_investable: float,
        monthly_income: float,
        monthly_emi: float,
        total_debt: float,
    ) -> float:
        score = 0.0

        # Health score component (40 pts)
        score += min(40.0, health_score * 0.40)

        # Emergency fund component (25 pts)
        if has_emergency and emergency_months >= 6:
            score += 25.0
        elif has_emergency and emergency_months >= 3:
            score += 15.0
        elif has_emergency and emergency_months >= 1:
            score += 8.0

        # Investable surplus component (20 pts)
        if monthly_income > 0:
            surplus_pct = (monthly_investable / monthly_income) * 100
            score += min(20.0, surplus_pct * 0.5)

        # Debt burden component (15 pts)
        if monthly_income > 0:
            emi_ratio = monthly_emi / monthly_income
            if emi_ratio <= 0.15:
                score += 15.0
            elif emi_ratio <= 0.30:
                score += 10.0
            elif emi_ratio <= 0.45:
                score += 5.0

        return min(100.0, round(score, 2))

    def _select_strategy(
        self,
        health_score: float,
        risk_level: str,
        emergency_months: float,
        has_emergency: bool,
        monthly_emi: float,
        monthly_income: float,
        employment_type: Optional[str],
        income_stability: Optional[str],
    ) -> str:
        """Apply financial safety rules to select the recommended strategy."""

        # RULE 1: Health score < 50 → always conservative
        if health_score < 50:
            return "conservative"

        # RULE 2: Student or irregular income → conservative
        if employment_type in ("student",):
            return "conservative"
        if income_stability in ("irregular",):
            return "conservative"

        # RULE 3: Very high debt burden → conservative
        if monthly_income > 0:
            emi_ratio = monthly_emi / monthly_income
            if emi_ratio > 0.45:
                return "conservative"

        # RULE 4: Weak emergency fund → conservative or at most balanced
        ef_adequate = has_emergency and emergency_months >= 3
        if not ef_adequate:
            # Cannot go beyond conservative if no emergency fund
            if risk_level == "AGGRESSIVE" and health_score >= 65:
                return "balanced"
            return "conservative"

        # RULE 5: High EMI (30-45%) → at most balanced regardless of risk profile
        if monthly_income > 0 and monthly_emi / monthly_income > 0.30:
            return "balanced"

        # RULE 6: Aggressive risk profile + strong health → aggressive
        if risk_level == "AGGRESSIVE" and health_score >= 65 and ef_adequate:
            return "aggressive"

        # RULE 7: Moderate risk profile + decent health → balanced
        if risk_level in ("MODERATE", "AGGRESSIVE") and health_score >= 55 and ef_adequate:
            return "balanced"

        # Default
        return "conservative"

    def _adjust_allocations(
        self,
        strategy: str,
        health_score: float,
        readiness_score: float,
        age: float,
        savings_rate: float,
        has_emergency: bool,
        emergency_months: float,
        existing_stocks_pct: float,
        goals: list[str],
        horizon: str,
        monthly_emi: float,
        monthly_income: float,
        income_stability: str,
    ) -> list[dict]:
        """
        Deterministic Allocation Rule Engine.
        Dynamically computes asset allocation percentages based on user attributes.
        """
        # Under readiness gate override: If not ready to invest, prioritize safe assets
        if readiness_score < 45 or (strategy == "conservative" and health_score < 50):
            return [
                {"category": "Emergency Fund", "percentage": 40.0, "priority": "HIGH",
                 "rationale": "High priority: build emergency cover first due to low readiness status."},
                {"category": "Fixed Deposits / RD", "percentage": 40.0, "priority": "HIGH",
                 "rationale": "Prioritize safe liquid instruments while improving profile metrics."},
                {"category": "Debt Mutual Funds", "percentage": 15.0, "priority": "MEDIUM",
                 "rationale": "Capital preservation allocation."},
                {"category": "SIP / Index Funds", "percentage": 0.0, "priority": "MEDIUM",
                 "rationale": "Equity allocations are gated until readiness score improves."},
                {"category": "Equity Mutual Funds", "percentage": 0.0, "priority": "MEDIUM",
                 "rationale": "Active equity gated due to current financial risk levels."},
                {"category": "Direct Stocks", "percentage": 0.0, "priority": "LOW",
                 "rationale": "High-risk direct equities gated for capital safety."},
                {"category": "Gold", "percentage": 5.0, "priority": "LOW",
                 "rationale": "Gold allocation maintained as portfolio anchor."},
            ]

        # 1. Base percentages based on recommendation strategy
        if strategy == "conservative":
            ef_base = 25.0
            fd_base = 20.0
            debt_base = 25.0
            gold_base = 10.0
        elif strategy == "aggressive":
            ef_base = 10.0
            fd_base = 5.0
            debt_base = 10.0
            gold_base = 5.0
        else:  # balanced
            ef_base = 15.0
            fd_base = 15.0
            debt_base = 20.0
            gold_base = 5.0

        # 2. Apply adjustments
        # Emergency Fund Status
        if not has_emergency or emergency_months < 3:
            ef_base += 10.0
        elif emergency_months >= 6:
            ef_base -= 5.0

        # Income stability
        if income_stability in ("irregular", "variable"):
            ef_base += 5.0

        # FD/RD adjustments by age, health, and EMI debt ratio
        if age > 55:
            fd_base += 10.0
        elif age > 45:
            fd_base += 5.0
        elif age < 30:
            fd_base -= 5.0

        if health_score < 50:
            fd_base += 5.0

        emi_ratio = (monthly_emi / monthly_income) if monthly_income > 0 else 0.0
        if emi_ratio > 0.30:
            fd_base += 5.0

        # Debt Mutual Funds adjustments by horizon
        if horizon == "SHORT":
            debt_base += 10.0
        elif horizon == "LONG":
            debt_base -= 5.0

        # Gold adjustments by savings rate
        if savings_rate < 15.0:
            gold_base -= 2.0

        # Clamp individual category values to sensible ranges
        ef_val = max(10.0, min(35.0, ef_base))
        fd_val = max(5.0, min(30.0, fd_base))
        debt_val = max(10.0, min(30.0, debt_base))
        gold_val = max(5.0, min(15.0, gold_base))

        fixed_total = ef_val + fd_val + debt_val + gold_val
        if fixed_total > 90.0:
            # Scale down fixed categories proportionally to sum to exactly 90.0%
            scale = 90.0 / fixed_total
            ef_val = round(ef_val * scale, 1)
            fd_val = round(fd_val * scale, 1)
            debt_val = round(debt_val * scale, 1)
            gold_val = round(90.0 - ef_val - fd_val - debt_val, 1)
            fixed_total = 90.0

        equity_total = 100.0 - fixed_total

        # 3. Dynamic Equity Bucket Split
        if strategy == "conservative":
            stock_ratio = 5.0
            index_ratio = 15.0
            active_ratio = 0.0
        elif strategy == "aggressive":
            stock_ratio = 25.0
            index_ratio = 25.0
            active_ratio = 20.0
        else: # balanced
            stock_ratio = 10.0
            index_ratio = 20.0
            active_ratio = 10.0

        # Adjust equity shares dynamically based on readiness, age, and overlap concentration
        if readiness_score < 60:
            # Shift 20% of stock_ratio to index
            shift = stock_ratio * 0.20
            stock_ratio -= shift
            index_ratio += shift

        if age > 50:
            # Shift 20% of stock_ratio to index due to age risk preservation
            shift = stock_ratio * 0.20
            stock_ratio -= shift
            index_ratio += shift

        if existing_stocks_pct > 30.0:
            # Portfolio Overlap Concentration protection: shift half of stock allocation to passive index
            shift = stock_ratio * 0.50
            stock_ratio -= shift
            index_ratio += shift

        total_ratio = stock_ratio + index_ratio + active_ratio
        if total_ratio > 0:
            stocks_pct = round(equity_total * (stock_ratio / total_ratio), 2)
            active_mf_pct = round(equity_total * (active_ratio / total_ratio), 2)
            index_pct = round(equity_total - stocks_pct - active_mf_pct, 2)
        else:
            stocks_pct = 0.0
            active_mf_pct = 0.0
            index_pct = equity_total

        return [
            {"category": "Emergency Fund", "percentage": ef_val, "priority": "HIGH",
             "rationale": "Maintain highly liquid safety buffer for unforeseen expenses."},
            {"category": "Fixed Deposits / RD", "percentage": fd_val, "priority": "MEDIUM",
             "rationale": "Capital-safe deposit for short-term goals and debt EMI protection."},
            {"category": "Debt Mutual Funds", "percentage": debt_val, "priority": "MEDIUM",
             "rationale": "Low-to-medium risk debt yield with indexing tax benefits."},
            {"category": "SIP / Index Funds", "percentage": index_pct, "priority": "HIGH",
             "rationale": "Low-cost market tracking core equity asset growth."},
            {"category": "Equity Mutual Funds", "percentage": active_mf_pct, "priority": "HIGH",
             "rationale": "Actively managed mutual funds to capture category outperformance."},
            {"category": "Direct Stocks", "percentage": stocks_pct, "priority": "MEDIUM",
             "rationale": "Direct stock investments for long-term growth and high risk alpha."},
            {"category": "Gold", "percentage": gold_val, "priority": "LOW",
             "rationale": "Sovereign Gold or ETF holding acting as currency and inflation hedge."},
        ]

    def _compute_amounts(
        self, allocations: list[dict], monthly_investable: float
    ) -> list[dict]:
        """Add monthly_amount (₹) to each allocation item."""
        result = []
        for item in allocations:
            pct = item["percentage"]
            amount = round((pct / 100.0) * monthly_investable, 2)
            result.append({
                "category": item["category"],
                "percentage": round(pct, 2),
                "monthly_amount": amount,
                "priority": item.get("priority", "MEDIUM"),
                "rationale": item.get("rationale", ""),
            })
        return result

    def _build_reasoning(
        self,
        recommended: str,
        health_score: float,
        risk_level: str,
        emergency_months: float,
        has_emergency: bool,
        monthly_emi: float,
        monthly_income: float,
        employment_type: Optional[str],
    ) -> dict:
        positive = []
        negative = []
        how_to_unlock = []

        if health_score >= 70:
            positive.append(f"Strong financial health score of {health_score:.0f}/100.")
        elif health_score >= 50:
            positive.append(f"Moderate financial health score of {health_score:.0f}/100.")
        else:
            negative.append(f"Financial health score of {health_score:.0f}/100 needs improvement.")

        if has_emergency and emergency_months >= 6:
            positive.append(f"Adequate emergency fund of {emergency_months:.1f} months.")
        elif has_emergency and emergency_months >= 3:
            positive.append(f"Partial emergency fund of {emergency_months:.1f} months (target: 6 months).")
            negative.append("Emergency fund is below the recommended 6-month benchmark.")
        else:
            negative.append("No adequate emergency fund detected.")

        emi_ratio = (monthly_emi / monthly_income * 100) if monthly_income > 0 else 0
        if emi_ratio <= 20:
            positive.append(f"Low EMI burden at {emi_ratio:.0f}% of income.")
        elif emi_ratio <= 35:
            negative.append(f"Moderate EMI burden at {emi_ratio:.0f}% of income.")
        elif emi_ratio > 35:
            negative.append(f"High EMI burden at {emi_ratio:.0f}% of income restricts investment capacity.")

        if risk_level == "AGGRESSIVE":
            positive.append("Risk profile indicates comfort with higher-risk investments.")
        elif risk_level == "CONSERVATIVE":
            positive.append("Conservative risk profile ensures capital-safe allocations.")

        # How to unlock better strategies
        if recommended == "conservative":
            how_to_unlock.append("Improve financial health score above 65 by reducing discretionary spending.")
            how_to_unlock.append("Build an emergency fund of at least 3 months before unlocking the Balanced plan.")
            how_to_unlock.append("Reduce EMI-to-income ratio below 30% to access equity-heavy strategies.")
            how_to_unlock.append("Complete your Financial Profile for a more personalised recommendation.")
        elif recommended == "balanced":
            how_to_unlock.append("Raise financial health score above 70 to qualify for an Aggressive plan.")
            how_to_unlock.append("Build emergency fund to 6 months to reduce conservative pressure.")
            how_to_unlock.append("Keep EMI-to-income ratio below 25% consistently.")
            how_to_unlock.append("Update Risk Profile to Aggressive to unlock higher equity allocation.")

        strategy_rationale = (
            f"The {recommended.capitalize()} strategy was selected because: "
            f"Health Score = {health_score:.0f}/100, Risk Profile = {risk_level}, "
            f"Emergency Fund = {emergency_months:.1f} months."
        )

        return {
            "strategy_rationale": strategy_rationale,
            "positive_signals": positive,
            "negative_signals": negative,
            "how_to_unlock": how_to_unlock,
        }

    def _build_warnings(
        self,
        health_score: float,
        emergency_months: float,
        has_emergency: bool,
        monthly_emi: float,
        monthly_income: float,
        monthly_investable: float,
        investment_readiness: str,
    ) -> list[str]:
        warnings = []

        if not has_emergency or emergency_months < 3:
            warnings.append(
                "⚠️ No adequate emergency fund. Build at least 3 months of expenses before investing in equities."
            )
        if monthly_income > 0 and monthly_emi / monthly_income > 0.40:
            warnings.append(
                "⚠️ High EMI burden (>40% of income). Focus on debt reduction before increasing investment allocations."
            )
        if health_score < 50:
            warnings.append(
                "⚠️ Financial health score is below 50. Address income stability and spending before investing."
            )
        if monthly_investable <= 0:
            warnings.append(
                "⚠️ No investable surplus after expenses, EMI, and safety buffer. Review your spending or income sources."
            )
        if investment_readiness == "NOT_READY":
            warnings.append(
                "⚠️ Investment Readiness is LOW. Complete prerequisite financial health steps first."
            )
        warnings.append(
            "📌 This plan covers category-level allocation only. Specific products should be selected with a SEBI-registered financial advisor."
        )
        warnings.append(
            "📌 Past performance of any asset class does not guarantee future returns."
        )

        return warnings

    def _build_action_plan(
        self,
        recommended: str,
        emergency_months: float,
        has_emergency: bool,
        monthly_emi: float,
        monthly_investable: float,
    ) -> dict:
        now_tasks = []
        three_months = []
        six_months = []
        one_year = []

        # NOW
        now_tasks.append("Review this investment plan with your current budget.")
        now_tasks.append("Identify any unnecessary recurring subscriptions to cut.")
        if not has_emergency or emergency_months < 3:
            now_tasks.append("Open a dedicated high-yield savings account for your emergency fund.")
        if monthly_investable > 0:
            now_tasks.append(f"Set aside ₹{monthly_investable:,.0f}/month as your investable surplus.")

        # 3 MONTHS
        three_months.append("Start a SIP (Systematic Investment Plan) in an index fund.")
        if not has_emergency or emergency_months < 6:
            three_months.append("Target 3 months of expenses in your emergency fund.")
        if recommended in ("balanced", "aggressive"):
            three_months.append("Open a mutual fund account and begin debt fund allocation.")
        three_months.append("Track monthly spending and savings rate rigorously.")

        # 6 MONTHS
        six_months.append("Reassess and recalculate your Investment Plan.")
        if not has_emergency or emergency_months < 6:
            six_months.append("Complete your 6-month emergency fund target.")
        if recommended == "conservative":
            six_months.append("Recheck if health score has improved enough for a Balanced plan.")
        if recommended in ("balanced", "aggressive"):
            six_months.append("Add equity mutual fund allocation once emergency fund is complete.")
        six_months.append("Review and renew health and life insurance if not in place.")

        # 1 YEAR
        one_year.append("Recalculate your Investment Plan annually or after major life events.")
        one_year.append("Review portfolio performance and rebalance allocations if needed.")
        one_year.append("Consult a SEBI-registered financial advisor for tax-efficient investment structuring.")
        if recommended != "aggressive":
            one_year.append(
                "Aim to upgrade to the next strategy tier by improving your financial health score."
            )
        one_year.append("Reassess risk tolerance and update your risk profile assessment.")

        return {
            "now": now_tasks,
            "three_months": three_months,
            "six_months": six_months,
            "one_year": one_year,
        }

    @staticmethod
    def _snapshot_to_dict(snap) -> dict:
        return {
            "id": str(snap.id),
            "user_id": str(snap.user_id),
            "health_score_snapshot_id": str(snap.health_score_snapshot_id) if snap.health_score_snapshot_id else None,
            "risk_profile_snapshot_id": str(snap.risk_profile_snapshot_id) if snap.risk_profile_snapshot_id else None,
            "investment_readiness": snap.investment_readiness,
            "investment_readiness_score": float(snap.investment_readiness_score) if snap.investment_readiness_score else None,
            "recommended_strategy": snap.recommended_strategy,
            "monthly_investable_amount": float(snap.monthly_investable_amount) if snap.monthly_investable_amount is not None else 0.0,
            "allocation_json": snap.allocation_json,
            "reasoning_json": snap.reasoning_json,
            "warnings_json": snap.warnings_json,
            "action_plan_json": snap.action_plan_json,
            "metadata_json": snap.metadata_json,
            "created_at": snap.created_at.isoformat(),
        }
