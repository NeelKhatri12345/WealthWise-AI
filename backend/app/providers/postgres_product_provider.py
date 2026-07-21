"""
WealthWise AI — PostgreSQL Product Provider

Primary product catalog provider backed by PostgreSQL database (investment_products table).
Implements AbstractProductProvider contract.

Features:
- Keeps PostgreSQL as the primary product catalog and recommendation source.
- Fallback to bundled product_catalog.json if DB is unpopulated or offline.
- Integrates with MarketMetadataCache for live market data enrichment.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import logger
from app.providers.abstract_product_provider import AbstractProductProvider
from app.providers.models import MarketMetadata, ProductRecord

_CATALOG_PATH = Path(__file__).parent.parent / "data" / "product_catalog.json"
_SEED_MARKET_PATH = Path(__file__).parent.parent / "data" / "market_metadata_seed.json"


class PostgresProductProvider(AbstractProductProvider):
    """
    Primary product catalog provider implementing AbstractProductProvider.
    Uses PostgreSQL database as the primary source for product catalog and static metadata.
    """

    def __init__(
        self,
        db_session: Optional[AsyncSession] = None,
        cache: Optional[Any] = None,
        market_provider: Optional[Any] = None,
    ) -> None:
        self._db_session = db_session
        self._cache = cache
        self._market_provider = market_provider
        self._catalog_cache: list[ProductRecord] | None = None
        self._static_market_metadata: dict[str, Any] = {}
        self._lock = threading.Lock()
        self._load_static_seed_metadata()

    @property
    def _db_market_fallback(self) -> dict[str, Any]:
        """Backwards compatibility alias for _static_market_metadata."""
        return self._static_market_metadata

    def set_db_session(self, db_session: AsyncSession) -> None:
        """Update or set DB session for async operations."""
        self._db_session = db_session

    def set_market_provider(self, market_provider: Any) -> None:
        """Inject HybridMarketDataProvider instance."""
        self._market_provider = market_provider

    def load_catalog(self) -> list[ProductRecord]:
        """
        Return all products from primary PostgreSQL catalog or pre-loaded cache.
        Fallback to product_catalog.json if cache is empty.
        """
        if self._catalog_cache is not None:
            return self._catalog_cache

        with self._lock:
            if self._catalog_cache is not None:
                return self._catalog_cache

            # Default load from product_catalog.json
            self._catalog_cache = self._load_json_catalog()
            return self._catalog_cache

    async def load_catalog_async(self, db: Optional[AsyncSession] = None) -> list[ProductRecord]:
        """
        Asynchronously loads product catalog directly from PostgreSQL.
        If DB table is empty, automatically seeds from product_catalog.json and market_metadata_seed.json.
        """
        session = db or self._db_session
        if session is None:
            return self.load_catalog()

        try:
            from app.repositories.investment_product_repository import InvestmentProductRepository
            repo = InvestmentProductRepository(session)
            db_products = await repo.get_all_catalog_products()

            static_seed = self._read_raw_json(_SEED_MARKET_PATH)
            if not db_products:
                # Seed DB from JSON catalog & static metadata seed
                json_data = self._read_raw_json(_CATALOG_PATH)
                if json_data:
                    await repo.seed_from_list(json_data, static_seed)
                    db_products = await repo.get_all_catalog_products()
            elif static_seed:
                # Upsert static metadata if missing
                await repo.seed_from_list([], static_seed)

            if db_products:
                from app.market.models import StaticInvestmentMetadata
                records = []
                for p in db_products:
                    records.append(p.to_product_record())
                    self._static_market_metadata[p.id] = StaticInvestmentMetadata(
                        product_id=p.id,
                        expected_return_1y=p.expected_return_1y,
                        expected_return_3y=p.expected_return_3y,
                        expense_ratio=p.expense_ratio,
                        aum_cr=p.aum_cr,
                        rating=p.rating,
                        exit_load=p.exit_load,
                        riskometer=p.riskometer,
                        category_avg_return=p.category_avg_return,
                        tracking_error=p.tracking_error,
                        underlying_index=p.underlying_index,
                        metadata_version=p.metadata_version or 1,
                        last_reviewed=p.last_reviewed,
                        source=p.source,
                    )
                with self._lock:
                    self._catalog_cache = records
                return records
        except Exception as exc:
            logger.warning(f"Database catalog fetch failed, falling back to JSON catalog: {exc}")

        return self.load_catalog()

    async def hydrate_market_data(self, product_ids: list[str]) -> None:
        """
        Hydrates live market metadata for candidate products missing from cache.
        Calls HybridMarketDataProvider.refresh in 1 batch call for missing IDs.
        """
        if not product_ids or self._cache is None or self._market_provider is None:
            return

        missing_ids = [pid for pid in product_ids if self._cache.get_sync(pid) is None]

        if not missing_ids:
            return

        try:
            await self._market_provider.refresh(missing_ids)
        except Exception as exc:
            logger.warning(f"Error refreshing market data during hydration: {exc}")

    def get_market_metadata(self, product_id: str) -> Optional[MarketMetadata]:
        """
        Retrieve composite market metadata for a product by merging:
        1. Primary Static Investment Metadata from PostgreSQL (_static_market_metadata)
        2. Dynamic Live Market Metadata from Cache (_cache)
        Returns a complete MarketMetadata object. Never returns all-null static fields.
        """
        from app.market.models import StaticInvestmentMetadata, LiveMarketMetadata, UnifiedMarketMetadata

        # 1. Primary Static Metadata
        static_meta = self._static_market_metadata.get(product_id)
        if static_meta is None:
            static_meta = StaticInvestmentMetadata(product_id=product_id)

        # 2. Dynamic Live Cache Metadata
        live_meta = None
        if self._cache is not None:
            try:
                cached_obj = self._cache.get_sync(product_id)
                if cached_obj:
                    if isinstance(cached_obj, LiveMarketMetadata):
                        live_meta = cached_obj
                    elif isinstance(cached_obj, UnifiedMarketMetadata):
                        live_meta = LiveMarketMetadata(
                            product_id=product_id,
                            nav=cached_obj.nav,
                            current_price=cached_obj.current_price,
                            market_cap_cr=cached_obj.market_cap_cr,
                            dividend_yield=cached_obj.dividend_yield,
                            pe_ratio=cached_obj.pe_ratio,
                            pb_ratio=cached_obj.pb_ratio,
                            beta=cached_obj.beta,
                            week_52_high=cached_obj.week_52_high,
                            week_52_low=cached_obj.week_52_low,
                            analyst_rating=cached_obj.analyst_rating,
                            last_updated=cached_obj.last_updated,
                        )
            except Exception as exc:
                logger.warning(f"Error reading live market cache for {product_id}: {exc}")



        # 3. Merge static + live
        prod_record = next((p for p in (self._catalog_cache or []) if p.id == product_id), None)
        ptype = prod_record.product_type if prod_record else ""

        merged_unified = UnifiedMarketMetadata.merge(
            static_meta=static_meta,
            live_meta=live_meta,
            product_type=ptype,
        )

        return MarketMetadata(
            product_id=merged_unified.product_id,
            nav=merged_unified.nav,
            current_price=merged_unified.current_price,
            expected_return_1y=merged_unified.expected_return_1y,
            expected_return_3y=merged_unified.expected_return_3y,
            expense_ratio=merged_unified.expense_ratio,
            aum_cr=merged_unified.aum_cr,
            rating=merged_unified.rating,
            volatility=merged_unified.volatility,
            last_updated=merged_unified.last_updated,
            pe_ratio=merged_unified.pe_ratio,
            pb_ratio=merged_unified.pb_ratio,
            dividend_yield=merged_unified.dividend_yield,
            beta=merged_unified.beta,
            week_52_high=merged_unified.week_52_high,
            week_52_low=merged_unified.week_52_low,
            analyst_rating=merged_unified.analyst_rating,
            momentum_score=merged_unified.momentum_score,
            liquidity_score=merged_unified.liquidity_score,
            market_cap_cr=merged_unified.market_cap_cr,
            exit_load=merged_unified.exit_load,
            riskometer=merged_unified.riskometer,
            category_avg_return=merged_unified.category_avg_return,
            tracking_error=merged_unified.tracking_error,
            underlying_index=merged_unified.underlying_index,
        )

    def supports_live_data(self) -> bool:
        return self._cache is not None

    def get_data_source_label(self) -> str:
        return "postgresql_live_hybrid" if self.supports_live_data() else "postgresql_catalog"

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _read_raw_json(self, path: Path = _CATALOG_PATH) -> list[dict]:
        try:
            if not path.exists():
                return []
            raw = path.read_text(encoding="utf-8")
            return json.loads(raw)
        except Exception as exc:
            logger.error(f"Failed reading JSON from {path}: {exc}")
            return []

    def _load_static_seed_metadata(self) -> None:
        from app.market.models import StaticInvestmentMetadata
        seed_items = self._read_raw_json(_SEED_MARKET_PATH)
        for item in seed_items:
            pid = item.get("product_id")
            if pid:
                self._static_market_metadata[pid] = StaticInvestmentMetadata(
                    product_id=pid,
                    expected_return_1y=item.get("expected_return_1y"),
                    expected_return_3y=item.get("expected_return_3y"),
                    expense_ratio=item.get("expense_ratio"),
                    aum_cr=item.get("aum_cr"),
                    rating=item.get("rating"),
                    exit_load=item.get("exit_load"),
                    riskometer=item.get("riskometer"),
                    category_avg_return=item.get("category_avg_return"),
                    tracking_error=item.get("tracking_error"),
                    underlying_index=item.get("underlying_index"),
                    metadata_version=item.get("metadata_version", 1),
                    last_reviewed=item.get("last_reviewed"),
                    source=item.get("source"),
                )

    def _load_json_catalog(self) -> list[ProductRecord]:
        items = self._read_raw_json(_CATALOG_PATH)
        records = []
        for item in items:
            p = ProductRecord.from_dict(item)
            records.append(p)
        return records


