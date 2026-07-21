"""
WealthWise AI — Yahoo Finance Provider (Indian Stocks & ETFs)

Uses yfinance to fetch live stock & ETF metrics from NSE/BSE:
  - Stocks: current price, dividend yield, market cap (Crores), PE ratio, 52-week high/low
  - ETFs: current price
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional
import yfinance as yf

from app.core.logger import logger
from app.market.market_data_provider import MarketDataProvider
from app.market.models import UnifiedMarketMetadata
from app.providers.models import ProductRecord

_EQUITY_TYPES = {"STOCK", "ETF", "GOLD_ETF"}


class YahooFinanceProvider(MarketDataProvider):
    """
    Market Data Provider using yfinance for Indian Stocks & ETFs (.NS ticker suffix).
    """

    def supports_asset_type(self, product_type: str) -> bool:
        return product_type.upper() in _EQUITY_TYPES

    def get_provider_name(self) -> str:
        return "YahooFinanceProvider"

    async def fetch_market_data(self, products: list[ProductRecord]) -> dict[str, UnifiedMarketMetadata]:
        """
        Fetch live data for equity products (Stocks & ETFs).
        Uses asyncio.to_thread to avoid blocking event loop during yfinance API calls.
        """
        equity_products = [p for p in products if self.supports_asset_type(p.product_type)]
        if not equity_products:
            return {}

        results: dict[str, UnifiedMarketMetadata] = {}

        # Run yfinance batch queries in thread pool
        def _fetch_all():
            outcomes = {}
            for product in equity_products:
                ticker_symbol = self._resolve_ticker(product)
                if not ticker_symbol:
                    continue

                try:
                    meta = self._fetch_ticker_info(product, ticker_symbol)
                    if meta:
                        outcomes[product.id] = meta
                except Exception as exc:
                    logger.warning(
                        "YahooFinanceProvider error for ticker",
                        extra={"product_id": product.id, "ticker": ticker_symbol, "error": str(exc)},
                    )
            return outcomes

        try:
            results = await asyncio.to_thread(_fetch_all)
        except Exception as exc:
            logger.warning(f"YahooFinanceProvider batch fetch failed: {exc}")

        return results

    def _resolve_ticker(self, product: ProductRecord) -> Optional[str]:
        """Resolves NSE ticker format e.g. RELIANCE.NS, NIFTYBEES.NS."""
        symbol = product.symbol
        if not symbol and product.id.startswith("stock-"):
            symbol = product.id.replace("stock-", "").upper()

        if not symbol:
            return None

        symbol = symbol.strip().upper()
        if not (symbol.endswith(".NS") or symbol.endswith(".BO")):
            symbol = f"{symbol}.NS"
        return symbol

    def _fetch_ticker_info(self, product: ProductRecord, ticker_symbol: str) -> Optional[UnifiedMarketMetadata]:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info or {}

        # Fallback price extractors
        current_price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
            or info.get("navPrice")
        )
        if current_price is not None:
            current_price = float(current_price)

        if current_price is None:
            # If info dict is empty or failed, try fast_info
            try:
                fast = getattr(ticker, "fast_info", None)
                if fast and getattr(fast, "last_price", None):
                    current_price = float(fast.last_price)
            except Exception:
                pass

        if current_price is None:
            return None

        now = datetime.now(timezone.utc)

        # Market Cap in Crores (1 Crore = 10,000,000 INR)
        mcap_raw = info.get("marketCap")
        mcap_cr = round(float(mcap_raw) / 1e7, 2) if mcap_raw else None

        # Dividend yield (yfinance returns e.g. 0.015 for 1.5% or 1.5)
        div_yield_raw = info.get("dividendYield")
        div_yield = None
        if div_yield_raw is not None:
            div_val = float(div_yield_raw)
            div_yield = round(div_val * 100, 2) if div_val < 1.0 else round(div_val, 2)

        pe_ratio = round(float(info["trailingPE"]), 2) if info.get("trailingPE") else None
        pb_ratio = round(float(info["priceToBook"]), 2) if info.get("priceToBook") else None
        beta = round(float(info["beta"]), 2) if info.get("beta") else None
        h52 = round(float(info["fiftyTwoWeekHigh"]), 2) if info.get("fiftyTwoWeekHigh") else None
        l52 = round(float(info["fiftyTwoWeekLow"]), 2) if info.get("fiftyTwoWeekLow") else None

        return UnifiedMarketMetadata(
            product_id=product.id,
            product_type=product.product_type,
            current_price=current_price,
            nav=current_price if product.product_type == "ETF" else None,
            dividend_yield=div_yield,
            market_cap_cr=mcap_cr,
            pe_ratio=pe_ratio,
            pb_ratio=pb_ratio,
            beta=beta,
            week_52_high=h52,
            week_52_low=l52,
            last_updated=now,
        )
