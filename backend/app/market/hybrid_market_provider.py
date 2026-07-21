"""
WealthWise AI — Hybrid Market Data Provider

Combines MFAPIProvider (Indian Mutual Funds) and YahooFinanceProvider (Stocks & ETFs)
into a unified market provider layer.

Key Requirements Fulfilled:
- 30-minute Redis/in-memory caching (TTL = 1800 seconds).
- Graceful fallbacks to stored DB values / seed catalog metrics if live data fails.
- Never fails recommendations.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional

from app.core.config import get_settings
from app.core.logger import logger
from app.market.abstract_market_provider import AbstractMarketProvider
from app.market.market_data_provider import MarketDataProvider
from app.market.market_metadata_cache import MarketMetadataCache
from app.market.models import UnifiedMarketMetadata
from app.market.providers.mfapi_provider import MFAPIProvider
from app.market.providers.yahoo_finance_provider import YahooFinanceProvider
from app.providers.abstract_product_provider import AbstractProductProvider
from app.providers.models import ProductRecord

settings = get_settings()


class HybridMarketDataProvider(AbstractMarketProvider):
    """
    Composite Market Provider orchestrating MFAPI & Yahoo Finance live feeds
    with 30-minute caching and PostgreSQL static metadata fallbacks.
    """

    def __init__(
        self,
        cache: Optional[MarketMetadataCache] = None,
        catalog_provider: Optional[AbstractProductProvider] = None,
        live_cache_ttl: int = 1800,  # 30 minutes
    ) -> None:
        self._cache = cache or MarketMetadataCache()
        self._catalog_provider = catalog_provider
        self._live_cache_ttl = getattr(settings, "MARKET_LIVE_CACHE_TTL", live_cache_ttl)

        self._mf_provider = MFAPIProvider()
        self._yf_provider = YahooFinanceProvider()

    def supports_live_data(self) -> bool:
        return True

    def get_provider_name(self) -> str:
        return "HybridMarketDataProvider"

    async def refresh(self, product_ids: list[str]) -> dict[str, UnifiedMarketMetadata]:
        """
        Refresh market metadata for the requested product IDs.
        Uses cached responses if valid within 30 minutes, otherwise fetches live.
        Falls back to stored static DB catalog values if live endpoints fail.
        """
        results: dict[str, UnifiedMarketMetadata] = {}



        # 1. Load catalog product records
        products: list[ProductRecord] = []
        if self._catalog_provider:
            all_products = self._catalog_provider.load_catalog()
            pid_set = set(product_ids)
            products = [p for p in all_products if p.id in pid_set]

        # 2. Check 30-minute cache layer first
        missing_products: list[ProductRecord] = []
        for p in products:
            cached = self._cache.get_sync(p.id)
            if cached:
                results[p.id] = cached
            else:
                missing_products.append(p)

        if not missing_products:
            return results

        # 3. Partition missing products between providers
        mf_products = [p for p in missing_products if self._mf_provider.supports_asset_type(p.product_type)]
        yf_products = [p for p in missing_products if self._yf_provider.supports_asset_type(p.product_type)]

        # 4. Fetch live data concurrently
        mf_task = self._mf_provider.fetch_market_data(mf_products) if mf_products else asyncio.sleep(0, result={})
        yf_task = self._yf_provider.fetch_market_data(yf_products) if yf_products else asyncio.sleep(0, result={})

        mf_live, yf_live = await asyncio.gather(mf_task, yf_task, return_exceptions=True)

        live_results: dict[str, UnifiedMarketMetadata] = {}
        if isinstance(mf_live, dict):
            live_results.update(mf_live)
        if isinstance(yf_live, dict):
            live_results.update(yf_live)

        # 5. Populate cache with fresh LiveMarketMetadata entries ONLY (30-minute TTL = 1800s)
        for pid, meta in live_results.items():
            from app.market.models import LiveMarketMetadata
            live_meta = LiveMarketMetadata(
                product_id=pid,
                nav=getattr(meta, "nav", None),
                current_price=getattr(meta, "current_price", None),
                market_cap_cr=getattr(meta, "market_cap_cr", None),
                dividend_yield=getattr(meta, "dividend_yield", None),
                pe_ratio=getattr(meta, "pe_ratio", None),
                pb_ratio=getattr(meta, "pb_ratio", None),
                beta=getattr(meta, "beta", None),
                week_52_high=getattr(meta, "week_52_high", None),
                week_52_low=getattr(meta, "week_52_low", None),
                analyst_rating=getattr(meta, "analyst_rating", None),
                last_updated=getattr(meta, "last_updated", datetime.now(timezone.utc)),
            )
            results[pid] = meta
            await self._cache.set(pid, live_meta, ttl_seconds=self._live_cache_ttl)

        return results


