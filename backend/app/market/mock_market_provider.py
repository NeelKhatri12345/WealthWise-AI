"""
WealthWise AI — Mock Market Provider

Implements AbstractMarketProvider using deterministic seed-based mock data.
Provides realistic and stable values for stocks, mutual funds, and ETFs.
"""

from __future__ import annotations

import hashlib
import random
from datetime import datetime, timezone
from typing import Optional

from app.market.abstract_market_provider import AbstractMarketProvider
from app.market.models import UnifiedMarketMetadata


class MockMarketProvider(AbstractMarketProvider):
    """
    Mock implementation of AbstractMarketProvider.
    Guarantees deterministic mock data by using seed = md5(product_id) % 2^32.
    """

    async def refresh(self, product_ids: list[str]) -> dict[str, UnifiedMarketMetadata]:
        """
        Generates realistic data for each product.
        We expect the product_ids to map to catalog entries, but if any are unknown,
        we infer product type from their prefix or ID.
        """
        results: dict[str, UnifiedMarketMetadata] = {}
        for pid in product_ids:
            try:
                meta = self._generate_mock_metadata(pid)
                results[pid] = meta
            except Exception:
                # Silently skip on error to ensure robustness
                continue
        return results

    def supports_live_data(self) -> bool:
        return False

    def get_provider_name(self) -> str:
        return "MockMarketProvider"

    # ── Deterministic Data Generator ──────────────────────────────────────────

    def _generate_mock_metadata(self, product_id: str) -> UnifiedMarketMetadata:
        seed = int(hashlib.md5(product_id.encode("utf-8")).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)

        # Infer category and product type from ID
        # product_id examples:
        # - uti-nifty50-index (MF_INDEX)
        # - parag-parikh-flexi-cap (MF_EQUITY)
        # - hdfc-short-term-debt (MF_DEBT)
        # - sbi-fd (FD)
        # - nippon-gold-etf (GOLD_ETF)
        # - sovereign-gold-bond (SGB)
        # - sbi-liquid-fund (LIQUID_FUND)
        # - sbi-overnight-fund (OVERNIGHT_FUND)
        # - stock-reliance (STOCK)
        # - etf-nippon-nifty50 (ETF)

        p_type = "MF_EQUITY"
        if "index" in product_id or "nifty50-index" in product_id:
            p_type = "MF_INDEX"
        elif "debt" in product_id or "corporate-bond" in product_id or "banking-psu" in product_id:
            p_type = "MF_DEBT"
        elif "fd" in product_id or "ppf" in product_id or "nsc" in product_id:
            p_type = "FD"
        elif "liquid" in product_id:
            p_type = "LIQUID_FUND"
        elif "overnight" in product_id:
            p_type = "OVERNIGHT_FUND"
        elif "gold-etf" in product_id or "bees" in product_id and "gold" in product_id:
            p_type = "GOLD_ETF"
        elif "gold-savings" in product_id or "gold-fund" in product_id:
            p_type = "GOLD_MF"
        elif "sgb" in product_id or "sovereign-gold" in product_id:
            p_type = "SGB"
        elif product_id.startswith("stock-"):
            p_type = "STOCK"
        elif product_id.startswith("etf-"):
            p_type = "ETF"

        # Universal fields defaults
        exp_ret_1y = None
        exp_ret_3y = None
        exp_ratio = None
        aum = None
        rating = None
        volatility = "MEDIUM"

        # Stock specific
        pe = None
        pb = None
        div_yield = None
        beta = None
        h52 = None
        l52 = None
        analyst_rating = None
        momentum = None
        liquidity = None
        mcap = None

        # MF specific
        exit_load = None
        riskometer = None
        cat_avg = None
        tracking_err = None

        # ETF specific
        underlying = None

        now = datetime.now(timezone.utc)

        if p_type == "STOCK":
            # High quality Indian Large caps
            exp_ret_1y = rng.uniform(8.0, 25.0)
            exp_ret_3y = exp_ret_1y + rng.uniform(-3.0, 3.0)
            rating = rng.uniform(3.5, 4.8)
            volatility = rng.choice(["MEDIUM", "HIGH"])
            pe = rng.uniform(18.0, 48.0)
            pb = rng.uniform(2.5, 9.0)
            div_yield = rng.uniform(0.5, 3.5)
            beta = rng.uniform(0.7, 1.4)
            l52 = rng.uniform(1000.0, 2000.0)
            h52 = l52 * rng.uniform(1.2, 1.5)
            analyst_rating = rng.uniform(3.5, 4.8)
            momentum = rng.uniform(0.4, 0.95)
            liquidity = rng.uniform(0.8, 0.99)
            mcap = rng.uniform(50000.0, 1500000.0)  # Crores

        elif p_type in ("MF_INDEX", "ETF", "GOLD_ETF"):
            exp_ret_1y = rng.uniform(10.0, 15.0)
            exp_ret_3y = exp_ret_1y + rng.uniform(-1.5, 1.5)
            exp_ratio = rng.uniform(0.06, 0.25)
            aum = rng.uniform(1000.0, 35000.0)
            rating = rng.uniform(3.8, 4.7)
            volatility = "MEDIUM" if p_type != "GOLD_ETF" else "LOW"
            tracking_err = rng.uniform(0.03, 0.12)
            riskometer = "Moderately High" if p_type != "GOLD_ETF" else "Moderate"
            if p_type == "ETF":
                underlying = rng.choice(["NIFTY 50", "NIFTY NEXT 50", "NASDAQ 100", "NYSE FANG+"])
                liquidity = rng.uniform(0.7, 0.95)
            elif p_type == "GOLD_ETF":
                underlying = "Domestic Physical Gold"
                liquidity = rng.uniform(0.75, 0.9)

        elif p_type in ("MF_EQUITY", "GOLD_MF"):
            exp_ret_1y = rng.uniform(12.0, 24.0)
            exp_ret_3y = exp_ret_1y + rng.uniform(-2.5, 2.5)
            exp_ratio = rng.uniform(0.5, 1.4)
            aum = rng.uniform(500.0, 48000.0)
            rating = rng.uniform(3.2, 4.9)
            volatility = rng.choice(["MEDIUM", "HIGH"])
            riskometer = "Very High" if p_type != "GOLD_MF" else "Moderate"
            exit_load = "1.00% if redeemed within 365 days"
            cat_avg = exp_ret_3y * rng.uniform(0.9, 1.05)

        elif p_type == "MF_DEBT":
            exp_ret_1y = rng.uniform(6.5, 8.5)
            exp_ret_3y = exp_ret_1y + rng.uniform(-0.5, 0.5)
            exp_ratio = rng.uniform(0.2, 0.6)
            aum = rng.uniform(2000.0, 25000.0)
            rating = rng.uniform(4.0, 4.8)
            volatility = "LOW"
            riskometer = "Moderate"
            exit_load = "Nil"
            cat_avg = exp_ret_3y * rng.uniform(0.95, 1.02)

        elif p_type in ("LIQUID_FUND", "OVERNIGHT_FUND"):
            exp_ret_1y = rng.uniform(6.3, 7.2)
            exp_ret_3y = exp_ret_1y + rng.uniform(-0.2, 0.2)
            exp_ratio = rng.uniform(0.05, 0.20)
            aum = rng.uniform(5000.0, 65000.0)
            rating = rng.uniform(4.2, 4.7)
            volatility = "LOW"
            riskometer = "Low to Moderate"
            exit_load = "0.0070% on Day 1, Nil after Day 7" if p_type == "LIQUID_FUND" else "Nil"
            cat_avg = exp_ret_1y * 0.98

        elif p_type in ("FD", "SGB"):
            # Static style fixed assets
            exp_ret_1y = rng.uniform(7.0, 7.8)
            exp_ret_3y = exp_ret_1y
            volatility = "LOW"
            riskometer = "Low"
            exit_load = "Nil" if p_type == "SGB" else "1.00% premature withdrawal penalty"

        return UnifiedMarketMetadata(
            product_id=product_id,
            product_type=p_type,
            expected_return_1y=round(exp_ret_1y, 2) if exp_ret_1y is not None else None,
            expected_return_3y=round(exp_ret_3y, 2) if exp_ret_3y is not None else None,
            expense_ratio=round(exp_ratio, 2) if exp_ratio is not None else None,
            aum_cr=round(aum, 1) if aum is not None else None,
            rating=round(rating, 1) if rating is not None else None,
            volatility=volatility,
            last_updated=now,
            pe_ratio=round(pe, 1) if pe is not None else None,
            pb_ratio=round(pb, 1) if pb is not None else None,
            dividend_yield=round(div_yield, 2) if div_yield is not None else None,
            beta=round(beta, 2) if beta is not None else None,
            week_52_high=round(h52, 1) if h52 is not None else None,
            week_52_low=round(l52, 1) if l52 is not None else None,
            analyst_rating=round(analyst_rating, 1) if analyst_rating is not None else None,
            momentum_score=round(momentum, 2) if momentum is not None else None,
            liquidity_score=round(liquidity, 2) if liquidity is not None else None,
            market_cap_cr=round(mcap, 1) if mcap is not None else None,
            exit_load=exit_load,
            riskometer=riskometer,
            category_avg_return=round(cat_avg, 2) if cat_avg is not None else None,
            tracking_error=round(tracking_err, 3) if tracking_err is not None else None,
            underlying_index=underlying,
        )
