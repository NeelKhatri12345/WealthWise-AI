"""
WealthWise AI — Abstract Market Provider Interface

Defines the contract that any raw market intelligence provider must implement.
Allows hot-swapping providers (e.g. Yahoo Finance, NSE/BSE API, Mock) easily.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from app.market.models import UnifiedMarketMetadata


class AbstractMarketProvider(ABC):
    """
    Interface for market data providers.
    Responsible for refreshing and loading live/mock market metrics.
    """

    @abstractmethod
    async def refresh(self, product_ids: list[str]) -> dict[str, UnifiedMarketMetadata]:
        """
        Fetch fresh market metadata for the given product IDs.
        Returns a dictionary mapping product_id to UnifiedMarketMetadata.
        Should handle individual product failures gracefully by omitting or
        returning partial data for that product, rather than raising.
        """
        ...

    @abstractmethod
    def supports_live_data(self) -> bool:
        """
        True if this is a live data provider fetching from external web/APIs.
        False if this is a local/mock provider.
        """
        ...

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Returns a friendly identifier name of the provider (e.g., "MockProvider").
        """
        ...
