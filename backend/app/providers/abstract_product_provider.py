"""
WealthWise AI — Abstract Product Provider

Defines the interface that all product providers must implement.
The ProductRecommendationService depends only on this ABC, never on
a concrete provider, ensuring full provider-swap transparency.

Milestone 1: JSONProductProvider
Milestone 2: MarketDataProvider (live MFAPI / NSE / BSE)
Milestone 3+: extensible
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.providers.models import MarketMetadata, ProductRecord


class AbstractProductProvider(ABC):
    """
    Interface contract for all product data providers.

    A provider is responsible for:
    1. Supplying the product catalog (identity records)
    2. Optionally enriching products with live market metadata

    The recommendation engine only calls these two methods.
    """

    @abstractmethod
    def load_catalog(self) -> list[ProductRecord]:
        """
        Return the full product catalog as a list of ProductRecord objects.
        Must be idempotent and safe to call multiple times (implementations
        should cache after first load).
        """
        ...

    @abstractmethod
    def get_market_metadata(self, product_id: str) -> Optional[MarketMetadata]:
        """
        Return live market metadata for a product, or None if not available.

        In Milestone 1 (JSONProductProvider), this always returns None.
        In Milestone 2+, this returns live enrichment data from an external
        data source (MFAPI, NSE, BSE, etc.).

        Must never raise — return None on any error.
        """
        ...

    @abstractmethod
    def supports_live_data(self) -> bool:
        """
        Declare whether this provider can return live market metadata.
        Used by the service to set the `data_source` field in API responses.
        """
        ...

    async def hydrate_market_data(self, product_ids: list[str]) -> None:
        """
        Optional async method to hydrate market metadata cache for a list of products.
        Default implementation is a no-op.
        """
        pass

    def get_data_source_label(self) -> str:
        """
        Human-readable label for the API response `data_source` field.
        Override in concrete providers if needed.
        """
        return "live" if self.supports_live_data() else "static_catalog"

