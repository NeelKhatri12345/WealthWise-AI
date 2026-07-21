"""
WealthWise AI — Market Sync Service

Orchestrates refreshing market data from providers and writing to the cache layer.
Runs safe, non-blocking sync operations.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.core.logger import logger
from app.market.abstract_market_provider import AbstractMarketProvider
from app.market.market_metadata_cache import MarketMetadataCache
from app.providers.abstract_product_provider import AbstractProductProvider

settings = get_settings()


class MarketSyncService:
    """
    Coordinates raw provider calls and caching.
    Ensures that any API failures inside providers are caught and logged.
    """

    def __init__(
        self,
        provider: AbstractMarketProvider,
        cache: MarketMetadataCache,
        catalog_provider: AbstractProductProvider,
    ) -> None:
        self._provider = provider
        self._cache = cache
        self._catalog_provider = catalog_provider

    async def refresh_all(self) -> dict[str, Any]:
        """
        Refreshes market metadata for all products currently loaded in the product catalog.
        Updates the cache with dynamic TTL.
        """
        start_time = time.perf_counter()
        errors: list[str] = []
        succeeded = 0
        failed = 0

        try:
            products = self._catalog_provider.load_catalog()
        except Exception as e:
            logger.error("Failed to load catalog during market sync", extra={"error": str(e)})
            return {
                "total": 0,
                "succeeded": 0,
                "failed": 0,
                "skipped": 0,
                "duration_ms": 0.0,
                "provider": self._provider.get_provider_name(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "errors": [f"Catalog load error: {e}"],
            }

        product_ids = [p.id for p in products]

        try:
            refreshed_data = await self._provider.refresh(product_ids)
        except Exception as e:
            logger.error("Global failure in market provider sync", extra={"error": str(e)})
            return {
                "total": len(product_ids),
                "succeeded": 0,
                "failed": len(product_ids),
                "skipped": 0,
                "duration_ms": 0.0,
                "provider": self._provider.get_provider_name(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "errors": [f"Provider sync error: {e}"],
            }

        # Dynamically set TTL: 1 hour for stocks/ETFs, 24 hours for mutual funds/FDs/bonds
        ttl_short = getattr(settings, "MARKET_CACHE_TTL_SHORT", 3600)
        ttl_long = getattr(settings, "MARKET_CACHE_TTL_LONG", 86400)

        for product in products:
            pid = product.id
            if pid not in refreshed_data:
                failed += 1
                errors.append(f"No metadata returned for {pid}")
                continue

            try:
                metadata = refreshed_data[pid]
                ttl = ttl_short if product.product_type in ("STOCK", "ETF", "GOLD_ETF") else ttl_long
                await self._cache.set(pid, metadata, ttl)
                succeeded += 1
            except Exception as e:
                failed += 1
                errors.append(f"Cache write error for {pid}: {e}")

        duration_ms = (time.perf_counter() - start_time) * 1000.0
        logger.info(
            "Market sync cycle completed",
            extra={
                "provider": self._provider.get_provider_name(),
                "succeeded": succeeded,
                "failed": failed,
                "duration_ms": round(duration_ms, 2),
            },
        )

        return {
            "total": len(product_ids),
            "succeeded": succeeded,
            "failed": failed,
            "skipped": 0,
            "duration_ms": round(duration_ms, 2),
            "provider": self._provider.get_provider_name(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "errors": errors,
        }

    def get_sync_status(self) -> dict[str, Any]:
        """
        Returns the caching health and state.
        """
        stats = self._cache.get_cache_stats()
        return {
            "provider": self._provider.get_provider_name(),
            "cache_state": stats,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
