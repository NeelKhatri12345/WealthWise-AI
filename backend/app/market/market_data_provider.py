"""
WealthWise AI — Market Data Provider Abstraction

Defines the contract that individual asset-class market providers (e.g., MFAPI, YahooFinance)
must implement.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from app.market.models import UnifiedMarketMetadata
from app.providers.models import ProductRecord


class MarketDataProvider(ABC):
    """
    Abstract Base Class for live market data providers.
    Each provider specializes in specific asset types (e.g. Mutual Funds, Stocks, ETFs).
    """

    @abstractmethod
    async def fetch_market_data(self, products: list[ProductRecord]) -> dict[str, UnifiedMarketMetadata]:
        """
        Fetch fresh market metadata for the supported products.
        Returns a dictionary mapping product.id -> UnifiedMarketMetadata.
        Must handle individual product failures gracefully without throwing global exceptions.
        """
        ...

    @abstractmethod
    def supports_asset_type(self, product_type: str) -> bool:
        """
        Returns True if this provider can handle the specified product_type.
        """
        ...

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Returns provider identifier string (e.g. "MFAPIProvider", "YahooFinanceProvider").
        """
        ...
