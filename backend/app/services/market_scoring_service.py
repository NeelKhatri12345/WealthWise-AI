"""
WealthWise AI — Market Scoring Service

Converts raw asset-specific market metadata into normalized [0, 1] scores
across 8 key dimensions. Independent of any market data provider.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class MarketScore:
    overall_score: float
    valuation_score: float
    growth_score: float
    volatility_score: float
    liquidity_score: float
    quality_score: float
    cost_efficiency_score: float
    consistency_score: float

    def to_dict(self) -> dict[str, float]:
        return {
            "overall_score": self.overall_score,
            "valuation_score": self.valuation_score,
            "growth_score": self.growth_score,
            "volatility_score": self.volatility_score,
            "liquidity_score": self.liquidity_score,
            "quality_score": self.quality_score,
            "cost_efficiency_score": self.cost_efficiency_score,
            "consistency_score": self.consistency_score,
        }


class MarketScoringService:
    """
    Normalizes raw market metadata parameters independently based on asset type.
    Outputs are guaranteed to be float values bounded strictly in [0.0, 1.0].
    """

    def score_product(self, metadata: Any, product_type: str) -> MarketScore:
        """
        Calculates normalized scores for the given metadata according to its asset type rules.
        """
        # Safe checks: if metadata is missing, return a completely neutral score block
        if not metadata:
            return MarketScore(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5)

        p_type = str(product_type).upper()

        if p_type == "STOCK":
            return self._score_stock(metadata)
        elif p_type in ("MF_INDEX", "MF_EQUITY", "MF_DEBT", "GOLD_MF"):
            return self._score_mutual_fund(metadata)
        elif p_type in ("ETF", "GOLD_ETF"):
            return self._score_etf(metadata)
        elif p_type in ("FD", "SGB", "LIQUID_FUND", "OVERNIGHT_FUND"):
            return self._score_fixed_income_safe(metadata, p_type)

        # Fallback default
        return MarketScore(0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5)

    # ── Asset-Specific Normalisation Routines ──────────────────────────────────

    def _score_stock(self, meta: Any) -> MarketScore:
        # 1. Valuation: PE and PB normalisation
        pe = getattr(meta, "pe_ratio", None)
        pb = getattr(meta, "pb_ratio", None)

        pe_score = 0.5
        if pe is not None:
            # PE <= 15 is 1.0, PE >= 50 is 0.0, linear in between
            pe_score = 1.0 - ((pe - 15) / 35) if pe > 15 else 1.0

        pb_score = 0.5
        if pb is not None:
            # PB <= 1.5 is 1.0, PB >= 8.0 is 0.0, linear in between
            pb_score = 1.0 - ((pb - 1.5) / 6.5) if pb > 1.5 else 1.0

        pe_score = min(1.0, max(0.0, pe_score))
        pb_score = min(1.0, max(0.0, pb_score))
        val_score = pe_score * 0.7 + pb_score * 0.3

        # 2. Growth: Expected returns + Momentum
        ret_1y = getattr(meta, "expected_return_1y", None)
        mom = getattr(meta, "momentum_score", None)

        ret_score = 0.5
        if ret_1y is not None:
            # <= 0% = 0.0, >= 25% = 1.0, linear in between
            ret_score = ret_1y / 25.0

        ret_score = min(1.0, max(0.0, ret_score))
        mom_score = min(1.0, max(0.0, mom if mom is not None else 0.5))
        growth_score = ret_score * 0.6 + mom_score * 0.4

        # 3. Volatility: Beta + Volatility Label
        beta = getattr(meta, "beta", None)
        vol_label = getattr(meta, "volatility", None)

        beta_score = 0.5
        if beta is not None:
            # Ideal beta is near 1.0 (neutral 0.5).
            # Low beta < 0.8 gets higher score (up to 0.8), high beta > 1.4 gets lower score (down to 0.2)
            if beta < 1.0:
                beta_score = 0.5 + (1.0 - beta) * 0.3
            else:
                beta_score = 0.5 - (beta - 1.0) * 0.5

        vol_lbl_score = 0.6
        if vol_label == "LOW":
            vol_lbl_score = 1.0
        elif vol_label == "MEDIUM":
            vol_lbl_score = 0.6
        elif vol_label == "HIGH":
            vol_lbl_score = 0.2

        beta_score = min(1.0, max(0.0, beta_score))
        vol_score = beta_score * 0.5 + vol_lbl_score * 0.5

        # 4. Liquidity: Liquidity Score + Market Cap
        liq = getattr(meta, "liquidity_score", None)
        mcap = getattr(meta, "market_cap_cr", None)

        liq_score = min(1.0, max(0.0, liq if liq is not None else 0.8))
        mcap_score = 0.5
        if mcap is not None:
            # Saturates at 100,000 Crores
            mcap_score = mcap / 100000.0

        mcap_score = min(1.0, max(0.0, mcap_score))
        liquidity_score = liq_score * 0.7 + mcap_score * 0.3

        # 5. Quality: Analyst Rating
        rating = getattr(meta, "analyst_rating", None)
        if rating is None:
            rating = getattr(meta, "rating", None)  # fallback

        quality_score = min(1.0, max(0.0, rating / 5.0)) if rating is not None else 0.6

        # 6. Cost Efficiency: Stocks have no expense ratios
        cost_score = 1.0

        # 7. Consistency: 52W range stability
        h52 = getattr(meta, "week_52_high", None)
        l52 = getattr(meta, "week_52_low", None)

        consistency_score = 0.7
        if h52 and l52 and h52 > 0:
            # Narrower 52W range represents higher stability/consistency
            consistency_score = l52 / h52

        consistency_score = min(1.0, max(0.0, consistency_score))

        # Overall Score
        overall = (
            val_score * 0.15
            + growth_score * 0.20
            + vol_score * 0.15
            + liquidity_score * 0.15
            + quality_score * 0.15
            + cost_score * 0.10
            + consistency_score * 0.10
        )

        return MarketScore(
            overall_score=round(overall, 3),
            valuation_score=round(val_score, 3),
            growth_score=round(growth_score, 3),
            volatility_score=round(vol_score, 3),
            liquidity_score=round(liquidity_score, 3),
            quality_score=round(quality_score, 3),
            cost_efficiency_score=round(cost_score, 3),
            consistency_score=round(consistency_score, 3),
        )

    def _score_mutual_fund(self, meta: Any) -> MarketScore:
        # 1. Cost Efficiency: Expense Ratio
        er = getattr(meta, "expense_ratio", None)
        cost_score = 0.5
        if er is not None:
            # 0% = 1.0, >= 2.0% = 0.0, linear in between
            cost_score = 1.0 - (er / 2.0)

        cost_score = min(1.0, max(0.0, cost_score))

        # 2. Quality: Fund Rating
        rating = getattr(meta, "rating", None)
        quality_score = min(1.0, max(0.0, rating / 5.0)) if rating is not None else 0.7

        # 3. Growth: returns over 3Y / 5Y
        ret_3y = getattr(meta, "expected_return_3y", None)
        ret_5y = getattr(meta, "expected_return_5y", None)

        growth_val = 0.5
        if ret_5y is not None:
            growth_val = ret_5y
        elif ret_3y is not None:
            growth_val = ret_3y

        # Scale expected return: <= 4% = 0.0, >= 18% = 1.0, linear
        growth_score = (growth_val - 4.0) / 14.0 if growth_val > 4.0 else 0.0
        growth_score = min(1.0, max(0.0, growth_score))

        # 4. Consistency: Category average outperformance + exit load
        cat_avg = getattr(meta, "category_avg_return", None)
        exit_ld = getattr(meta, "exit_load", None)

        consistency_score = 0.6
        if ret_3y is not None and cat_avg is not None:
            diff = ret_3y - cat_avg
            # outperforming category by 5% is peak, lagging by -5% is bottom
            consistency_score = 0.6 + (diff / 10.0)

        if exit_ld and "Nil" not in exit_ld and "0%" not in exit_ld:
            consistency_score -= 0.1  # penalty for exit load friction

        consistency_score = min(1.0, max(0.0, consistency_score))

        # 5. Liquidity: Fund size (AUM)
        aum = getattr(meta, "aum_cr", None)
        liq_score = 0.5
        if aum is not None:
            # AUM: <= 100 Cr = 0.1, >= 10,000 Cr = 1.0, linear
            liq_score = 0.1 + (aum / 11111.0)

        liq_score = min(1.0, max(0.0, liq_score))

        # 6. Volatility: Riskometer
        risk = getattr(meta, "riskometer", None)
        vol_score = 0.6
        if risk:
            risk_clean = risk.lower()
            if "low" in risk_clean:
                vol_score = 1.0
            elif "moderate" in risk_clean:
                vol_score = 0.8
            elif "moderately high" in risk_clean:
                vol_score = 0.5
            elif "high" in risk_clean:
                vol_score = 0.3
            elif "very high" in risk_clean:
                vol_score = 0.1

        # 7. Valuation: Neutral fallback for MFs
        val_score = 0.5

        # Overall Score
        overall = (
            val_score * 0.05
            + growth_score * 0.20
            + vol_score * 0.15
            + liq_score * 0.15
            + quality_score * 0.15
            + cost_score * 0.20
            + consistency_score * 0.10
        )

        return MarketScore(
            overall_score=round(overall, 3),
            valuation_score=round(val_score, 3),
            growth_score=round(growth_score, 3),
            volatility_score=round(vol_score, 3),
            liquidity_score=round(liq_score, 3),
            quality_score=round(quality_score, 3),
            cost_efficiency_score=round(cost_score, 3),
            consistency_score=round(consistency_score, 3),
        )

    def _score_etf(self, meta: Any) -> MarketScore:
        # 1. Cost Efficiency: Expense Ratio (ETFs are cheaper, so scale down threshold)
        er = getattr(meta, "expense_ratio", None)
        cost_score = 0.7
        if er is not None:
            # 0% = 1.0, >= 0.8% = 0.0
            cost_score = 1.0 - (er / 0.8)

        cost_score = min(1.0, max(0.0, cost_score))

        # 2. Consistency: Tracking Error
        te = getattr(meta, "tracking_error", None)
        consistency_score = 0.8
        if te is not None:
            # 0% tracking error = 1.0, >= 0.5% tracking error = 0.0
            consistency_score = 1.0 - (te / 0.5)

        consistency_score = min(1.0, max(0.0, consistency_score))

        # 3. Liquidity: Liquidity Score + AUM
        liq = getattr(meta, "liquidity_score", None)
        aum = getattr(meta, "aum_cr", None)

        liq_val = liq if liq is not None else 0.8
        aum_val = (aum / 10000.0) if aum is not None else 0.5

        liq_score = liq_val * 0.7 + aum_val * 0.3
        liq_score = min(1.0, max(0.0, liq_score))

        # 4. Growth: returns over 5Y / 3Y / 1Y
        ret_5y = getattr(meta, "return_5y", None)
        ret_1y = getattr(meta, "expected_return_1y", None)

        growth_val = 0.5
        if ret_5y is not None:
            growth_val = ret_5y
        elif ret_1y is not None:
            growth_val = ret_1y

        # Scale expected return: <= 5% = 0.0, >= 15% = 1.0
        growth_score = (growth_val - 5.0) / 10.0 if growth_val > 5.0 else 0.0
        growth_score = min(1.0, max(0.0, growth_score))

        # 5. Volatility: Volatility label
        vol = getattr(meta, "volatility", None)
        vol_score = 0.6
        if vol == "LOW":
            vol_score = 1.0
        elif vol == "MEDIUM":
            vol_score = 0.6
        elif vol == "HIGH":
            vol_score = 0.2

        # 6. Quality: Fund rating
        rating = getattr(meta, "rating", None)
        quality_score = min(1.0, max(0.0, rating / 5.0)) if rating is not None else 0.7

        # 7. Valuation: Neutral fallback for ETFs
        val_score = 0.5

        # Overall Score
        overall = (
            val_score * 0.05
            + growth_score * 0.15
            + vol_score * 0.15
            + liq_score * 0.20
            + quality_score * 0.10
            + cost_score * 0.15
            + consistency_score * 0.20
        )

        return MarketScore(
            overall_score=round(overall, 3),
            valuation_score=round(val_score, 3),
            growth_score=round(growth_score, 3),
            volatility_score=round(vol_score, 3),
            liquidity_score=round(liq_score, 3),
            quality_score=round(quality_score, 3),
            cost_efficiency_score=round(cost_score, 3),
            consistency_score=round(consistency_score, 3),
        )

    def _score_fixed_income_safe(self, meta: Any, p_type: str) -> MarketScore:
        # FDs, SGBs, Liquid/Overnight Funds
        # 1. Quality (Safety)
        if p_type == "SGB":
            quality_score = 1.0  # sovereign guarantee
        elif p_type == "FD":
            quality_score = 0.95  # bank DICGC protection
        elif p_type in ("OVERNIGHT_FUND", "LIQUID_FUND"):
            quality_score = 0.88  # ultra low duration money market
        else:
            quality_score = 0.8

        # 2. Liquidity
        if p_type in ("LIQUID_FUND", "OVERNIGHT_FUND"):
            liq_score = 1.0  # instant redemption T+1/T+0
        elif p_type == "FD":
            liq_score = 0.3  # premature penalty applies
        elif p_type == "SGB":
            liq_score = 0.1  # 5-8 year lock-in
        else:
            liq_score = 0.5

        # 3. Consistency (Return Stability)
        if p_type in ("FD", "SGB"):
            consistency_score = 1.0  # fixed/locked guarantee
        elif p_type in ("LIQUID_FUND", "OVERNIGHT_FUND"):
            consistency_score = 0.8  # slightly variable money market yields
        else:
            consistency_score = 0.7

        # 4. Cost Efficiency
        if p_type in ("FD", "SGB"):
            cost_score = 1.0  # zero expense
        else:
            er = getattr(meta, "expense_ratio", None)
            # liquid/overnight are ultra low fee
            cost_score = min(1.0, max(0.0, 1.0 - (er / 0.5))) if er is not None else 0.9

        # 5. Growth: fixed rates
        ret_1y = getattr(meta, "expected_return_1y", None)
        growth_score = 0.5
        if ret_1y is not None:
            # fixed income: <= 5% = 0.0, >= 9% = 1.0
            growth_score = (ret_1y - 5.0) / 4.0 if ret_1y > 5.0 else 0.0

        growth_score = min(1.0, max(0.0, growth_score))

        # 6. Volatility: Fixed assets are capital preserved, so volatility is always 0 (i.e. stability is 1.0)
        vol_score = 1.0

        # 7. Valuation: Neutral fallback
        val_score = 0.5

        # Overall Score
        overall = (
            val_score * 0.05
            + growth_score * 0.10
            + vol_score * 0.20
            + liq_score * 0.20
            + quality_score * 0.25
            + cost_score * 0.10
            + consistency_score * 0.10
        )

        return MarketScore(
            overall_score=round(overall, 3),
            valuation_score=round(val_score, 3),
            growth_score=round(growth_score, 3),
            volatility_score=round(vol_score, 3),
            liquidity_score=round(liq_score, 3),
            quality_score=round(quality_score, 3),
            cost_efficiency_score=round(cost_score, 3),
            consistency_score=round(consistency_score, 3),
        )
