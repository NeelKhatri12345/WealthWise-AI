"""
WealthWise AI — Market Data Service

Orchestrates live market data enrichment and caching for product recommendations.
"""

from __future__ import annotations

from typing import Any, Optional
from app.core.logger import logger
from app.market.hybrid_market_provider import HybridMarketDataProvider
from app.market.market_metadata_cache import MarketMetadataCache
from app.market.models import UnifiedMarketMetadata
from app.providers.abstract_product_provider import AbstractProductProvider
from app.providers.models import ProductRecord


class MarketDataService:
    """
    High-level service for querying and refreshing live market metadata.
    """

    def __init__(
        self,
        hybrid_provider: Optional[HybridMarketDataProvider] = None,
        cache: Optional[MarketMetadataCache] = None,
        catalog_provider: Optional[AbstractProductProvider] = None,
    ) -> None:
        self._cache = cache or MarketMetadataCache()
        self._catalog_provider = catalog_provider
        self._hybrid_provider = hybrid_provider or HybridMarketDataProvider(
            cache=self._cache,
            catalog_provider=catalog_provider,
        )

    async def get_market_data_for_products(
        self, products: list[ProductRecord]
    ) -> dict[str, UnifiedMarketMetadata]:
        """
        Retrieves live or cached market metadata for a list of ProductRecord objects.
        Automatically triggers live refresh for any cache misses.
        """
        pids = [p.id for p in products]
        try:
            return await self._hybrid_provider.refresh(pids)
        except Exception as exc:
            logger.warning(f"Error fetching hybrid market data: {exc}")
            return {}

    async def get_metadata_by_product_id(self, product_id: str) -> Optional[UnifiedMarketMetadata]:
        """
        Returns cached market metadata for a single product ID.
        """
        return self._cache.get_sync(product_id)
