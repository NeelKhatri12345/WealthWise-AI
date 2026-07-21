"""
WealthWise AI — Market Intelligence Module

Exports:
  AbstractMarketProvider  — contract interface
  MockMarketProvider      — deterministic simulation provider
  MarketMetadataCache     — two-layer persistent cache
  MarketSyncService       — refresh task runner
  UnifiedMarketMetadata   — normalisation model
"""

from app.market.abstract_market_provider import AbstractMarketProvider
from app.market.mock_market_provider import MockMarketProvider
from app.market.market_metadata_cache import MarketMetadataCache
from app.market.market_sync_service import MarketSyncService
from app.market.models import (
    UnifiedMarketMetadata,
    StockRawMetadata,
    MutualFundRawMetadata,
    ETFRawMetadata,
)

__all__ = [
    "AbstractMarketProvider",
    "MockMarketProvider",
    "MarketMetadataCache",
    "MarketSyncService",
    "UnifiedMarketMetadata",
    "StockRawMetadata",
    "MutualFundRawMetadata",
    "ETFRawMetadata",
]
