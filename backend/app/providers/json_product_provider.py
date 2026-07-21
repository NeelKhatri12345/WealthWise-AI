"""
WealthWise AI — JSON Product Provider (Milestone 1)

Loads the product catalog from the bundled product_catalog.json file.
Catalog is parsed once at first call and cached in-process for the
lifetime of the application (singleton via lru_cache in dependencies.py).

Implements AbstractProductProvider.
- load_catalog() → reads + caches product_catalog.json
- get_market_metadata() → always returns None (M1 static mode)
- supports_live_data() → False
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Optional

from app.core.logger import logger
from app.providers.abstract_product_provider import AbstractProductProvider
from app.providers.models import MarketMetadata, ProductRecord

# Resolve catalog path relative to this file's location
_CATALOG_PATH = Path(__file__).parent.parent / "data" / "product_catalog.json"


class JSONProductProvider(AbstractProductProvider):
    """
    Milestone 1 product provider — reads a bundled JSON catalog.
    Thread-safe lazy loading with in-process cache.
    """

    def __init__(self, cache: Optional[Any] = None) -> None:
        self._catalog: list[ProductRecord] | None = None
        self._lock = threading.Lock()
        self._cache = cache

    # ── AbstractProductProvider implementation ─────────────────────────────────

    def load_catalog(self) -> list[ProductRecord]:
        """
        Return all products from product_catalog.json.
        Parsed once; subsequent calls return the cached list.
        """
        if self._catalog is not None:
            return self._catalog

        with self._lock:
            # Double-checked locking
            if self._catalog is not None:
                return self._catalog

            try:
                raw = _CATALOG_PATH.read_text(encoding="utf-8")
                data: list[dict] = json.loads(raw)
                self._catalog = [ProductRecord.from_dict(item) for item in data]
                logger.info(
                    "Product catalog loaded",
                    extra={"product_count": len(self._catalog), "source": str(_CATALOG_PATH)},
                )
            except FileNotFoundError:
                logger.error("product_catalog.json not found", extra={"path": str(_CATALOG_PATH)})
                self._catalog = []
            except json.JSONDecodeError as exc:
                logger.error("product_catalog.json parse error", extra={"error": str(exc)})
                self._catalog = []

        return self._catalog

    def get_market_metadata(self, product_id: str) -> Optional[MarketMetadata]:
        """
        Retrieve cached market metadata if available.
        """
        if self._cache is None:
            return None
        try:
            unified = self._cache.get_sync(product_id)
            if not unified:
                return None
            return MarketMetadata(
                product_id=unified.product_id,
                nav=getattr(unified, "nav", None),
                current_price=getattr(unified, "current_price", None),
                expected_return_1y=unified.expected_return_1y,
                expected_return_3y=unified.expected_return_3y,
                expense_ratio=unified.expense_ratio,
                aum_cr=unified.aum_cr,
                rating=unified.rating,
                volatility=unified.volatility,
                last_updated=unified.last_updated,
                pe_ratio=unified.pe_ratio,
                pb_ratio=unified.pb_ratio,
                dividend_yield=unified.dividend_yield,
                beta=unified.beta,
                week_52_high=unified.week_52_high,
                week_52_low=unified.week_52_low,
                analyst_rating=unified.analyst_rating,
                momentum_score=unified.momentum_score,
                liquidity_score=unified.liquidity_score,
                market_cap_cr=unified.market_cap_cr,
                exit_load=unified.exit_load,
                riskometer=unified.riskometer,
                category_avg_return=unified.category_avg_return,
                tracking_error=unified.tracking_error,
                underlying_index=unified.underlying_index,
            )
        except Exception as e:
            logger.warning(f"Error mapping cached metadata for {product_id}: {e}")
            return None

    def supports_live_data(self) -> bool:
        return self._cache is not None


    # ── Convenience helpers ───────────────────────────────────────────────────

    def get_by_category(self, category: str) -> list[ProductRecord]:
        """Return all products for a given allocation category."""
        return [p for p in self.load_catalog() if p.category == category]

    def get_by_id(self, product_id: str) -> Optional[ProductRecord]:
        """Lookup a single product by its ID slug."""
        for p in self.load_catalog():
            if p.id == product_id:
                return p
        return None

    def get_all_categories(self) -> list[str]:
        """Return deduplicated list of all category names in the catalog."""
        seen: set[str] = set()
        result: list[str] = []
        for p in self.load_catalog():
            if p.category not in seen:
                seen.add(p.category)
                result.append(p.category)
        return result
