"""
WealthWise AI — MFAPI Market Data Provider (Indian Mutual Funds)

Fetches live NAV and metadata for Indian Mutual Funds using the free MFAPI endpoint:
  https://api.mfapi.in/mf/{amfi_code}
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional
import httpx

from app.core.logger import logger
from app.market.market_data_provider import MarketDataProvider
from app.market.models import UnifiedMarketMetadata
from app.providers.models import ProductRecord

_MFAPI_BASE_URL = "https://api.mfapi.in/mf"
_MUTUAL_FUND_TYPES = {
    "MF_INDEX",
    "MF_EQUITY",
    "MF_DEBT",
    "GOLD_MF",
    "LIQUID_FUND",
    "OVERNIGHT_FUND",
}


class MFAPIProvider(MarketDataProvider):
    """
    Market Data Provider for Indian Mutual Funds using MFAPI.in.
    """

    def __init__(self, timeout_seconds: float = 5.0) -> None:
        self._timeout_seconds = timeout_seconds

    def supports_asset_type(self, product_type: str) -> bool:
        return product_type.upper() in _MUTUAL_FUND_TYPES

    def get_provider_name(self) -> str:
        return "MFAPIProvider"

    async def fetch_market_data(self, products: list[ProductRecord]) -> dict[str, UnifiedMarketMetadata]:
        """
        Fetches live NAV for all mutual fund products with an AMFI code.
        Executes concurrent requests with asyncio.gather.
        """
        mf_products = [p for p in products if p.amfi_code and self.supports_asset_type(p.product_type)]
        if not mf_products:
            return {}

        results: dict[str, UnifiedMarketMetadata] = {}

        async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
            tasks = [self._fetch_single_fund(client, product) for product in mf_products]
            outcomes = await asyncio.gather(*tasks, return_exceptions=True)

            for product, outcome in zip(mf_products, outcomes):
                if isinstance(outcome, UnifiedMarketMetadata):
                    results[product.id] = outcome
                elif isinstance(outcome, Exception):
                    logger.warning(
                        "MFAPIProvider failed for product",
                        extra={"product_id": product.id, "amfi_code": product.amfi_code, "error": str(outcome)},
                    )

        return results

    async def _fetch_single_fund(
        self, client: httpx.AsyncClient, product: ProductRecord
    ) -> Optional[UnifiedMarketMetadata]:
        url = f"{_MFAPI_BASE_URL}/{product.amfi_code}"
        response = await client.get(url)
        response.raise_for_status()

        payload = response.json()
        meta = payload.get("meta", {})
        data = payload.get("data", [])

        if not data:
            return None

        latest_entry = data[0]
        latest_nav = float(latest_entry.get("nav", 0.0))

        # Parse last updated date (Format in MFAPI: "DD-MM-YYYY")
        raw_date = latest_entry.get("date", "")
        last_updated = datetime.now(timezone.utc)
        if raw_date:
            try:
                dt = datetime.strptime(raw_date, "%d-%m-%Y")
                last_updated = dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass

        # Calculate rough 1Y return if 250 trading days data exists
        ret_1y = None
        if len(data) >= 250:
            try:
                nav_1y_ago = float(data[249].get("nav", 0.0))
                if nav_1y_ago > 0:
                    ret_1y = round(((latest_nav - nav_1y_ago) / nav_1y_ago) * 100, 2)
            except (ValueError, IndexError):
                pass

        return UnifiedMarketMetadata(
            product_id=product.id,
            product_type=product.product_type,
            nav=latest_nav,
            current_price=latest_nav,  # NAV acts as price for MFs
            expected_return_1y=ret_1y,
            last_updated=last_updated,
        )
