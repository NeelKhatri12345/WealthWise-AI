"""
WealthWise AI — Product Recommendation Service

Deterministic product recommendation engine layered on top of the existing
InvestmentRecommendationService. This service does NOT touch strategy
selection, allocation percentages, or the InvestmentRecommendationService.

Algorithm:
  1. Load the latest InvestmentRecommendationSnapshot for the user
  2. Load the user's FinancialProfile to build a UserContext
  3. For each allocation category in the snapshot:
       a. Retrieve all catalog products for that category
       b. Apply hard eligibility filters (risk, strategy, health, investable)
       c. Score remaining products across 7 weighted signals
       d. Generate deterministic match_reasons for each product
       e. Return full ranked list (descending confidence)
  4. For supplementary categories (Stocks, ETFs) when strategy >= balanced:
       a. Same scoring logic applied
       b. Returned as additional_categories in the response
  5. Attach MarketMetadata from the provider (null in M1)

API Constraint:
  - Same inputs → same outputs (no randomness)
  - Provider-agnostic (depends on AbstractProductProvider)
  - No Gemini/AI calls
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from app.core.logger import logger
from app.providers.abstract_product_provider import AbstractProductProvider
from app.providers.models import ProductRecord, UserContext
from app.repositories.financial_profile_repository import FinancialProfileRepository
from app.repositories.investment_recommendation_repository import (
    InvestmentRecommendationRepository,
)

# ── Strategy / risk ordering maps ─────────────────────────────────────────────

_STRATEGY_ORDER = {"conservative": 0, "balanced": 1, "aggressive": 2}
_RISK_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
_USER_RISK_MAP = {
    # Maps user's declared risk_level (from risk profile) to internal order
    "CONSERVATIVE": 0,
    "LOW": 0,
    "MODERATE": 1,
    "MEDIUM": 1,
    "AGGRESSIVE": 2,
    "HIGH": 2,
}

# Categories that are supplementary (not in base allocations) but added when
# strategy allows
_SUPPLEMENTARY_CATEGORIES = {"Individual Stocks", "ETFs"}


class ProductRecommendationService:
    """
    Deterministic multi-signal product recommendation engine.
    Depends on AbstractProductProvider — never on a concrete provider type.
    """

    def __init__(
        self,
        provider: AbstractProductProvider,
        rec_repo: InvestmentRecommendationRepository,
        profile_repo: FinancialProfileRepository,
        scoring_service: Any = None,
    ) -> None:
        self._provider = provider
        self._rec_repo = rec_repo
        self._profile_repo = profile_repo
        self._scoring_service = scoring_service


    # ── Public API ─────────────────────────────────────────────────────────────

    async def get_product_suggestions(
        self,
        user_id: UUID,
        sort_by: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> dict:
        """
        Return ranked product suggestions for the user's latest investment
        recommendation snapshot.

        Raises ValueError if no snapshot exists yet.
        """
        # Step 1: Load latest snapshot
        snapshot = await self._rec_repo.get_latest_by_user(user_id)
        if snapshot is None:
            raise ValueError(
                "No investment recommendation found. Please calculate your "
                "Investment Plan first."
            )

        # Step 2: Load financial profile
        profile = await self._profile_repo.get_by_user_id(user_id)

        # Step 3: Build UserContext
        ctx = self._build_user_context(snapshot, profile)

        # Step 4: Load catalog
        all_products = self._provider.load_catalog()

        # Step 4b: Extract unique providers list dynamically (excluding stocks)
        providers_list = sorted(list(set(p.fund_house for p in all_products if p.fund_house and p.product_type != "STOCK")))
        companies_list = sorted(list(set(p.name for p in all_products if p.product_type == "STOCK")))

        # Step 4c: Filter by provider if specified
        if provider:
            all_products = [p for p in all_products if p.fund_house == provider]

        # Step 4d: Load user portfolio holdings for overlap detection
        from app.repositories.portfolio_holding_repository import PortfolioHoldingRepository
        try:
            holding_repo = PortfolioHoldingRepository(self._rec_repo.db)
            holdings = await holding_repo.get_by_user(user_id)
        except Exception:
            holdings = []

        # Step 5: Build category suggestions from allocation_json
        allocation = snapshot.allocation_json or []
        categories_output: list[dict] = []

        for alloc_item in allocation:
            cat_name = alloc_item.get("category", "")
            if cat_name in _SUPPLEMENTARY_CATEGORIES:
                continue  # handled separately

            monthly_alloc = float(alloc_item.get("monthly_amount", 0))
            alloc_pct = float(alloc_item.get("percentage", 0))

            cat_products = [p for p in all_products if p.category == cat_name]
            ranked = self._rank_products(cat_products, ctx, monthly_alloc, holdings=holdings, sort_by=sort_by)

            if ranked:
                categories_output.append({
                    "category": cat_name,
                    "monthly_allocation": monthly_alloc,
                    "allocation_pct": alloc_pct,
                    "products": ranked,
                })

        # Step 6: Supplementary categories for balanced/aggressive
        supplementary_output: list[dict] = []
        if _STRATEGY_ORDER.get(ctx.recommended_strategy, 0) >= 1:  # balanced+
            for supp_cat in ["Individual Stocks", "ETFs"]:
                cat_products = [p for p in all_products if p.category == supp_cat]
                # Allocate 0 monthly amount (supplementary, informational)
                ranked = self._rank_products(cat_products, ctx, monthly_alloc=0.0, holdings=holdings, sort_by=sort_by)
                if ranked:
                    supplementary_output.append({
                        "category": supp_cat,
                        "monthly_allocation": None,
                        "allocation_pct": None,
                        "products": ranked,
                        "note": (
                            "Supplementary category — not part of your core allocation. "
                            "Consider after core allocation is established."
                        ),
                    })

        # Step 7: Hydrate live market data ONLY for top products returned to client
        returned_pids = [
            p["id"]
            for cat in (categories_output + supplementary_output)
            for p in cat.get("products", [])
        ]
        if returned_pids and hasattr(self._provider, "hydrate_market_data"):
            print("=== HYDRATE MARKET DATA CALLED ===")
            await self._provider.hydrate_market_data(returned_pids)

            # Update market_data with fresh hydrated metadata for returned products
            for cat in (categories_output + supplementary_output):
                for p in cat.get("products", []):
                    fresh_meta = self._provider.get_market_metadata(p["id"])
                    if fresh_meta:
                        p["market_data"] = self._format_market_data(fresh_meta)
                        if self._scoring_service:
                            try:
                                m_score = self._scoring_service.score_product(fresh_meta, p["product_type"])
                                p["market_scores"] = m_score.to_dict()
                            except Exception:
                                pass

        return {
            "strategy": ctx.recommended_strategy,
            "investment_readiness": ctx.investment_readiness,
            "health_score": round(ctx.health_score, 1),
            "monthly_investable_amount": round(ctx.monthly_investable_amount, 2),
            "generated_at": snapshot.created_at.isoformat(),
            "data_source": self._provider.get_data_source_label(),
            "categories": categories_output,
            "supplementary_categories": supplementary_output,
            "providers": providers_list,
            "companies": companies_list,
        }

    # ── UserContext builder ────────────────────────────────────────────────────

    def _build_user_context(self, snapshot, profile) -> UserContext:
        """
        Assemble a UserContext from an ORM snapshot + optional FinancialProfile.
        Applies sensible defaults when profile fields are missing.
        """
        calc = {}
        if snapshot.metadata_json:
            calc = snapshot.metadata_json.get("calculation_inputs", {})

        health_score = float(calc.get("health_score", 0))
        risk_level = str(calc.get("risk_level", "MODERATE")).upper()
        monthly_income = float(calc.get("monthly_income", 0))
        monthly_emi = float(calc.get("monthly_emi", 0))

        # Normalise risk_level to canonical form
        if risk_level in ("MODERATE",):
            risk_level = "MODERATE"
        elif risk_level in ("CONSERVATIVE", "LOW"):
            risk_level = "CONSERVATIVE"
        elif risk_level in ("AGGRESSIVE", "HIGH"):
            risk_level = "AGGRESSIVE"

        monthly_investable = (
            float(snapshot.monthly_investable_amount)
            if snapshot.monthly_investable_amount is not None
            else 0.0
        )

        readiness_score = (
            float(snapshot.investment_readiness_score)
            if snapshot.investment_readiness_score is not None
            else 50.0
        )

        # Profile-sourced fields
        age_range = None
        financial_goals: list[str] = []
        income_stability: str | None = None
        emergency_fund_months: float = float(calc.get("emergency_months", 0))
        has_emergency_fund: bool = bool(calc.get("has_emergency_fund", False))
        investment_types: list[str] = []

        if profile:
            age_range = profile.age_range
            financial_goals = list(profile.financial_goals or [])
            income_stability = profile.income_stability
            investment_types = list(profile.investment_types or [])
            if profile.emergency_fund_months is not None:
                emergency_fund_months = float(profile.emergency_fund_months)
            if profile.has_emergency_fund is not None:
                has_emergency_fund = bool(profile.has_emergency_fund)
            if profile.monthly_emi is not None:
                monthly_emi = float(profile.monthly_emi)
            if profile.monthly_income is not None:
                monthly_income = float(profile.monthly_income)

        return UserContext(
            recommended_strategy=snapshot.recommended_strategy,
            investment_readiness=snapshot.investment_readiness,
            health_score=health_score,
            monthly_investable_amount=monthly_investable,
            investment_readiness_score=readiness_score,
            age_range=age_range,
            risk_level=risk_level,
            financial_goals=financial_goals,
            income_stability=income_stability,
            emergency_fund_months=emergency_fund_months,
            has_emergency_fund=has_emergency_fund,
            monthly_emi=monthly_emi,
            monthly_income=monthly_income,
            investment_types=investment_types,
        )

    # ── Product ranking ────────────────────────────────────────────────────────

    def _rank_products(
        self,
        products: list[ProductRecord],
        ctx: UserContext,
        monthly_alloc: float,
        holdings: list[Any] = None,
        sort_by: Optional[str] = None,
    ) -> list[dict]:
        """
        Apply eligibility filters, score, explain, and rank products.
        Returns full ranked list — frontend decides truncation.
        """
        scored: list[tuple[float, ProductRecord, Any, Any, dict]] = []

        holdings_list = holdings or []
        existing_symbols = {h.symbol.upper() for h in holdings_list if h.symbol}
        existing_ids = {h.id for h in holdings_list}
        total_portfolio_value = sum(float(h.current_value) for h in holdings_list)

        for product in products:
            if not self._passes_hard_filters(product, ctx, monthly_alloc):
                continue

            market_data = self._provider.get_market_metadata(product.id)

            market_score_obj = None
            if self._scoring_service and market_data:
                try:
                    market_score_obj = self._scoring_service.score_product(market_data, product.product_type)
                except Exception as e:
                    logger.warning(f"Error calculating market scores for {product.id}: {e}")

            # Overlap checking
            is_symbol_overlap = bool(product.symbol and product.symbol.upper() in existing_symbols) or product.id in existing_ids

            # Concentration checking: total value of holdings in this product's category / total portfolio value
            cat_holdings_val = sum(float(h.current_value) for h in holdings_list if h.asset_type.lower() == product.asset_class.lower() or (hasattr(h, 'category') and h.category == product.category))
            is_concentrated = (cat_holdings_val / total_portfolio_value > 0.40) if total_portfolio_value > 0 else False

            score, breakdown = self._compute_score(
                product, ctx, monthly_alloc, market_data, market_score_obj,
                is_overlap=is_symbol_overlap, is_concentrated=is_concentrated
            )
            scored.append((score, product, market_data, market_score_obj, breakdown))

        # Sort based on sort_by parameter
        if sort_by == "SCORE":
            # Overall market score descending
            scored.sort(key=lambda t: t[3].overall_score if t[3] else 0.6, reverse=True)
        elif sort_by == "RISK":
            # Risk badges lowest first
            scored.sort(key=lambda t: _RISK_ORDER.get(t[1].risk_level.upper(), 1))
        elif sort_by == "RETURN":
            # Expected CAGR descending
            scored.sort(key=lambda t: t[2].expected_return_3y or t[2].expected_return_1y or 0.0 if t[2] else 0.0, reverse=True)
        elif sort_by == "EXPENSE":
            # Lowest expense ratio first
            scored.sort(key=lambda t: t[2].expense_ratio if t[2] and t[2].expense_ratio is not None else 999.0)
        else:
            # Default: Highest Fit Confidence (overall_fit_score descending)
            scored.sort(key=lambda t: t[0], reverse=True)

        result: list[dict] = []
        for rank, (score, product, market_data, market_score_obj, breakdown) in enumerate(scored, start=1):
            match_reasons = self._build_match_reasons(product, ctx, score, market_data)

            # Overlap penalty warning
            is_symbol_overlap = bool(product.symbol and product.symbol.upper() in existing_symbols) or product.id in existing_ids
            if is_symbol_overlap:
                match_reasons.append("⚠️ Note: Already exists in portfolio (diversification penalty applied)")

            product_dict: dict = {
                "id": product.id,
                "name": product.name,
                "product_type": product.product_type,
                "asset_class": product.asset_class,
                "fund_house": product.fund_house,
                "sector": product.sector,
                "investment_style": product.investment_style,
                "risk_level": product.risk_level,
                "symbol": product.symbol,
                "isin": product.isin,
                "amfi_code": product.amfi_code,
                "confidence_pct": round(score * 100, 1),
                "rank": rank,
                "match_reasons": match_reasons,
                "reason_tags": product.reason_tags,
                "regulatory_note": product.regulatory_note,
                
                # Dynamic Transparency Fields
                "overall_fit_score": round(score, 4),
                "score_breakdown": breakdown,
                "recommendation_reason": match_reasons[0] if match_reasons else "Highly matches your investment strategy",

                "market_data": self._format_market_data(market_data),
                "market_scores": market_score_obj.to_dict() if market_score_obj else None,
            }
            result.append(product_dict)

        return result

    def _format_market_data(self, market_data: Any) -> Optional[dict]:
        if not market_data:
            return None
        return {
            "nav": getattr(market_data, "nav", None),
            "current_price": getattr(market_data, "current_price", None),
            "expected_return_1y": market_data.expected_return_1y,
            "expected_return_3y": market_data.expected_return_3y,
            "expense_ratio": market_data.expense_ratio,
            "aum_cr": market_data.aum_cr,
            "rating": market_data.rating,
            "volatility": market_data.volatility,
            "last_updated": market_data.last_updated.isoformat()
            if market_data.last_updated
            else None,
            # M2 Stock fields
            "pe_ratio": getattr(market_data, "pe_ratio", None),
            "pb_ratio": getattr(market_data, "pb_ratio", None),
            "dividend_yield": getattr(market_data, "dividend_yield", None),
            "beta": getattr(market_data, "beta", None),
            "week_52_high": getattr(market_data, "week_52_high", None),
            "week_52_low": getattr(market_data, "week_52_low", None),
            "analyst_rating": getattr(market_data, "analyst_rating", None),
            "momentum_score": getattr(market_data, "momentum_score", None),
            "liquidity_score": getattr(market_data, "liquidity_score", None),
            "market_cap_cr": getattr(market_data, "market_cap_cr", None),
            # M2 Mutual Fund fields
            "exit_load": getattr(market_data, "exit_load", None),
            "riskometer": getattr(market_data, "riskometer", None),
            "category_avg_return": getattr(market_data, "category_avg_return", None),
            "tracking_error": getattr(market_data, "tracking_error", None),
            # M2 ETF fields
            "underlying_index": getattr(market_data, "underlying_index", None),
        }


    # ── Hard eligibility filters ───────────────────────────────────────────────

    def _passes_hard_filters(
        self,
        product: ProductRecord,
        ctx: UserContext,
        monthly_alloc: float,
    ) -> bool:
        """
        Return False if any hard disqualification condition is met.
        Excluded products are never scored.
        """
        # 1. Risk level must not exceed user's profile
        product_risk_ord = _RISK_ORDER.get(product.risk_level.upper(), 1)
        user_risk_ord = _USER_RISK_MAP.get(ctx.risk_level.upper(), 1)
        if product_risk_ord > user_risk_ord:
            return False

        # 2. Minimum strategy must not exceed recommended
        product_strat_ord = _STRATEGY_ORDER.get(product.minimum_strategy, 0)
        user_strat_ord = _STRATEGY_ORDER.get(ctx.recommended_strategy, 0)
        if product_strat_ord > user_strat_ord:
            return False

        # 3. Minimum health score must be met
        if product.minimum_health_score > ctx.health_score:
            return False

        # 4. Minimum investable amount (skip for supplementary categories)
        if monthly_alloc > 0 and product.minimum_investable_amount > monthly_alloc:
            return False

        # 5. Investment Readiness Gate
        if ctx.investment_readiness == "NOT_READY":
            if product.product_type in ("STOCK", "ETF", "MF_EQUITY"):
                return False

        return True

    # ── Scoring algorithm ──────────────────────────────────────────────────────

    def _compute_score(
        self,
        product: ProductRecord,
        ctx: UserContext,
        monthly_alloc: float,
        market_data: Any = None,
        market_score_obj: Any = None,
        is_overlap: bool = False,
        is_concentrated: bool = False,
    ) -> tuple[float, dict]:
        """
        Rebalanced scoring engine weights.
        Returns overall_fit_score and score_breakdown.
        """
        # 1. Risk Match (0-1)
        product_risk_ord = _RISK_ORDER.get(product.risk_level.upper(), 1)
        user_risk_ord = _USER_RISK_MAP.get(ctx.risk_level.upper(), 1)
        risk_score = 1.0 if product_risk_ord <= user_risk_ord else 0.0

        # 2. Goal Match (0-1)
        user_goals = set(ctx.financial_goals or [])
        suitable = set(product.suitable_goals or [])
        goal_score = (
            len(user_goals & suitable) / len(suitable)
            if suitable
            else 0.5
        )

        # 3. Investment Horizon Match (0-1)
        suitable_horizons = set(product.suitable_horizons or [])
        horizon_score = 1.0 if ctx.goal_horizon_tag in suitable_horizons else (
            0.5 if suitable_horizons else 0.5
        )

        # 4. Market Score (0-1)
        market_score = market_score_obj.overall_score if market_score_obj else 0.6

        # 5. Expense Ratio Score (0-1): Lower expense ratio -> higher score
        if product.product_type == "STOCK":
            expense_score = 1.0
        elif market_data and market_data.expense_ratio is not None:
            expense_score = max(0.0, 1.0 - market_data.expense_ratio / 2.0)
        else:
            expense_score = 0.6

        # 6. Historical Performance (0-1)
        if market_data and market_data.expected_return_3y is not None:
            performance_score = min(1.0, max(0.0, market_data.expected_return_3y / 20.0))
        elif market_data and market_data.expected_return_1y is not None:
            performance_score = min(1.0, max(0.0, market_data.expected_return_1y / 20.0))
        else:
            performance_score = 0.6

        # 7. Diversification & Overlap Score (0-1)
        p_type = product.product_type.upper()
        if p_type in ("MF_INDEX", "MF_EQUITY", "MF_DEBT", "ETF", "LIQUID_FUND", "OVERNIGHT_FUND"):
            base_div = 1.0
        elif p_type in ("GOLD_ETF", "GOLD_MF", "SGB"):
            base_div = 0.8
        elif p_type == "STOCK":
            base_div = 0.5
        else:
            base_div = 0.8

        # Apply Overlap Penalty
        if is_overlap:
            base_div = max(0.0, base_div - 0.20)
        if is_concentrated:
            base_div = max(0.0, base_div - 0.10)

        # 8. Volatility Score (0-1)
        if market_data and market_data.volatility:
            vol_map = {"LOW": 1.0, "MEDIUM": 0.7, "HIGH": 0.4}
            vol_score = vol_map.get(market_data.volatility.upper(), 0.6)
        else:
            vol_score = 0.6

        # 9. Liquidity Score (0-1)
        if market_data and getattr(market_data, "liquidity_score", None) is not None:
            liq_score = market_data.liquidity_score
        else:
            if p_type in ("STOCK", "LIQUID_FUND", "OVERNIGHT_FUND", "ETF"):
                liq_score = 1.0
            elif p_type in ("MF_INDEX", "MF_EQUITY"):
                liq_score = 0.8
            else:
                liq_score = 0.5

        # 10. Health Score Compatibility (0-1)
        if ctx.health_score > 0:
            headroom = (ctx.health_score - product.minimum_health_score) / max(
                1.0, ctx.health_score
            )
            health_score_comp = min(1.0, max(0.0, headroom))
        else:
            health_score_comp = 0.0

        # 11. Investment Readiness Compatibility (0-1)
        readiness_score_comp = ctx.investment_readiness_score / 100.0

        # Rebalanced Score Weights
        # Risk 20%, Goal 15%, Horizon 15%, Diversification 15%, Liquidity 10%, Valuation 10%, Readiness 10%, returns 5%
        valuation_score = market_score_obj.valuation_score if market_score_obj else (expense_score * 0.4 + market_score * 0.6)

        final_score = (
            risk_score * 0.20
            + goal_score * 0.15
            + horizon_score * 0.15
            + base_div * 0.15
            + liq_score * 0.10
            + valuation_score * 0.10
            + readiness_score_comp * 0.10
            + performance_score * 0.05
        )

        breakdown = {
            "risk_match": round(risk_score, 4),
            "goal_match": round(goal_score, 4),
            "horizon_match": round(horizon_score, 4),
            "market_score": round(market_score, 4),
            "expense_ratio_score": round(expense_score, 4),
            "historical_performance_score": round(performance_score, 4),
            "diversification": round(base_div, 4),
            "volatility_score": round(vol_score, 4),
            "liquidity_score": round(liq_score, 4),
            "health_score_compatibility": round(health_score_comp, 4),
            "investment_readiness_compatibility": round(readiness_score_comp, 4)
        }

        return round(min(1.0, max(0.0, final_score)), 4), breakdown

    # ── Match reason builder ───────────────────────────────────────────────────

    def _build_match_reasons(
        self,
        product: ProductRecord,
        ctx: UserContext,
        score: float,
        market_data: Any = None,
    ) -> list[str]:
        """
        Generate a deterministic list of human-readable match reasons.
        """
        reasons: list[str] = []

        # Risk match — always present
        risk_label = ctx.risk_level.capitalize().replace("_", " ")
        reasons.append(f"Matches your {risk_label} risk profile")

        # M2 Specific insights if market data available
        if market_data:
            if market_data.expense_ratio is not None and market_data.expense_ratio < 0.30:
                reasons.append(f"Very low expense ratio of {market_data.expense_ratio:.2f}%")
            if getattr(market_data, "analyst_rating", None) is not None and market_data.analyst_rating >= 4.0:
                reasons.append("Highly rated by market analysts")
            if market_data.rating is not None and market_data.rating >= 4.0:
                reasons.append("Top-rated fund in its category")
            if (
                getattr(market_data, "category_avg_return", None) is not None
                and market_data.expected_return_3y is not None
                and market_data.expected_return_3y > market_data.category_avg_return
            ):
                reasons.append("Outperforms category average returns")

        # Age alignment
        if ctx.age_range and ctx.age_range in (product.suitable_age_ranges or []):
            reasons.append(f"Well suited for your {ctx.age_range} age group")

        # Goal alignment
        user_goals = set(ctx.financial_goals or [])
        matched_goals = user_goals & set(product.suitable_goals or [])
        if matched_goals:
            top_goal = next(iter(matched_goals)).replace("_", " ").capitalize()
            reasons.append(f"Aligned with your {top_goal} goal")

        # Horizon alignment
        if ctx.goal_horizon_tag in (product.suitable_horizons or []):
            horizon_label = ctx.goal_horizon_tag.replace("_", " ").capitalize()
            reasons.append(f"Suitable for {horizon_label} investment horizon")

        # Income stability match
        suitable_stability = product.suitable_income_stability or []
        if ctx.income_stability and ctx.income_stability in suitable_stability:
            stability_label = ctx.income_stability.replace("_", " ").capitalize()
            reasons.append(f"Compatible with {stability_label} income profile")

        # Investable fit
        if (
            product.minimum_investable_amount > 0
            and ctx.monthly_investable_amount >= product.minimum_investable_amount
        ):
            reasons.append(
                f"Works within your ₹{ctx.monthly_investable_amount:,.0f}/mo investable surplus"
            )

        # Strategy alignment
        if product.minimum_strategy == ctx.recommended_strategy:
            strategy_label = ctx.recommended_strategy.capitalize()
            reasons.append(f"Optimised for {strategy_label} strategy")

        return reasons[:5]  # Cap at 5 for UI display
