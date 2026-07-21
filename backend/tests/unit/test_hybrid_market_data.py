"""
WealthWise AI — Unit Tests for Hybrid Market Data Layer

Tests:
1. MFAPIProvider (Indian Mutual Funds)
2. YahooFinanceProvider (Indian Stocks & ETFs)
3. HybridMarketDataProvider (Routing, 30-min Caching, & Graceful Fallbacks)
4. PostgresProductProvider (Catalog loading & DB integration)
5. ProductRecommendationService market metadata enrichment
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.market.hybrid_market_provider import HybridMarketDataProvider
from app.market.market_metadata_cache import MarketMetadataCache
from app.market.models import UnifiedMarketMetadata
from app.market.providers.mfapi_provider import MFAPIProvider
from app.market.providers.yahoo_finance_provider import YahooFinanceProvider
from app.providers.models import ProductRecord
from app.providers.postgres_product_provider import PostgresProductProvider


@pytest.fixture
def sample_mf_product():
    return ProductRecord(
        id="uti-nifty50-index",
        name="UTI Nifty 50 Index Fund",
        product_type="MF_INDEX",
        asset_class="Equity",
        category="SIP / Index Funds",
        fund_house="UTI Mutual Fund",
        sector="Broad Market",
        investment_style="Passive",
        symbol=None,
        isin="INF789FC1E84",
        amfi_code="120716",
        risk_level="MEDIUM",
        minimum_strategy="conservative",
        minimum_health_score=35.0,
        minimum_investable_amount=500.0,
        suitable_goals=["wealth_creation"],
        suitable_age_ranges=["18-25"],
        suitable_horizons=["long_term"],
        suitable_income_stability=["stable"],
        reason_tags=["Low cost"],
        regulatory_note="SEBI Registered",
    )


@pytest.fixture
def sample_stock_product():
    return ProductRecord(
        id="stock-reliance",
        name="Reliance Industries Ltd",
        product_type="STOCK",
        asset_class="Equity",
        category="Individual Stocks",
        fund_house=None,
        sector="Energy",
        investment_style="Growth",
        symbol="RELIANCE",
        isin="INE002A01018",
        amfi_code=None,
        risk_level="HIGH",
        minimum_strategy="aggressive",
        minimum_health_score=60.0,
        minimum_investable_amount=2000.0,
        suitable_goals=["wealth_creation"],
        suitable_age_ranges=["18-25"],
        suitable_horizons=["long_term"],
        suitable_income_stability=["stable"],
        reason_tags=["Market Leader"],
        regulatory_note="NSE/BSE Listed",
    )


@pytest.fixture
def sample_etf_product():
    return ProductRecord(
        id="etf-nippon-nifty50",
        name="Nippon India ETF Nifty 50 BeES",
        product_type="ETF",
        asset_class="Equity",
        category="ETFs",
        fund_house="Nippon India",
        sector="Broad Market",
        investment_style="Passive",
        symbol="NIFTYBEES",
        isin="INF204KB14Z7",
        amfi_code=None,
        risk_level="MEDIUM",
        minimum_strategy="conservative",
        minimum_health_score=35.0,
        minimum_investable_amount=500.0,
        suitable_goals=["wealth_creation"],
        suitable_age_ranges=["18-25"],
        suitable_horizons=["long_term"],
        suitable_income_stability=["stable"],
        reason_tags=["Oldest ETF"],
        regulatory_note="NSE Listed",
    )


# ── MFAPIProvider Tests ───────────────────────────────────────────────────────

def test_mfapi_provider_asset_support():
    provider = MFAPIProvider()
    assert provider.supports_asset_type("MF_INDEX") is True
    assert provider.supports_asset_type("MF_EQUITY") is True
    assert provider.supports_asset_type("STOCK") is False
    assert provider.supports_asset_type("ETF") is False
    assert provider.get_provider_name() == "MFAPIProvider"


@pytest.mark.asyncio
async def test_mfapi_provider_fetch_success(sample_mf_product):
    provider = MFAPIProvider()

    mock_json = {
        "meta": {"scheme_code": 120716, "scheme_name": "UTI Nifty 50 Index Fund"},
        "data": [
            {"date": "20-07-2026", "nav": "185.50"},
            {"date": "19-07-2026", "nav": "184.20"},
        ],
    }

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(return_value=mock_json)

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        res = await provider.fetch_market_data([sample_mf_product])

    assert sample_mf_product.id in res
    meta = res[sample_mf_product.id]
    assert meta.nav == 185.50
    assert meta.current_price == 185.50
    assert meta.product_type == "MF_INDEX"


@pytest.mark.asyncio
async def test_mfapi_provider_graceful_error(sample_mf_product):
    provider = MFAPIProvider()

    with patch("httpx.AsyncClient.get", side_effect=Exception("Network Timeout")):
        res = await provider.fetch_market_data([sample_mf_product])

    # Should return empty dict without crashing
    assert res == {}


# ── YahooFinanceProvider Tests ────────────────────────────────────────────────

def test_yahoo_finance_provider_asset_support():
    provider = YahooFinanceProvider()
    assert provider.supports_asset_type("STOCK") is True
    assert provider.supports_asset_type("ETF") is True
    assert provider.supports_asset_type("MF_INDEX") is False
    assert provider.get_provider_name() == "YahooFinanceProvider"


def test_yahoo_finance_ticker_resolution(sample_stock_product, sample_etf_product):
    provider = YahooFinanceProvider()
    assert provider._resolve_ticker(sample_stock_product) == "RELIANCE.NS"
    assert provider._resolve_ticker(sample_etf_product) == "NIFTYBEES.NS"


@pytest.mark.asyncio
async def test_yahoo_finance_fetch_stock_success(sample_stock_product):
    provider = YahooFinanceProvider()

    mock_info = {
        "currentPrice": 2950.0,
        "dividendYield": 0.012,  # 1.2%
        "marketCap": 20000000000000.0,  # 20,00,000 Crores
        "trailingPE": 28.5,
        "priceToBook": 3.2,
        "fiftyTwoWeekHigh": 3200.0,
        "fiftyTwoWeekLow": 2200.0,
    }

    mock_ticker = MagicMock()
    mock_ticker.info = mock_info

    with patch("yfinance.Ticker", return_value=mock_ticker):
        res = await provider.fetch_market_data([sample_stock_product])

    assert sample_stock_product.id in res
    meta = res[sample_stock_product.id]
    assert meta.current_price == 2950.0
    assert meta.dividend_yield == 1.2
    assert meta.market_cap_cr == 2000000.0
    assert meta.pe_ratio == 28.5


# ── HybridMarketDataProvider Tests ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_hybrid_provider_routing_and_caching(sample_mf_product, sample_stock_product):
    cache = MarketMetadataCache()
    catalog_mock = MagicMock()
    catalog_mock.load_catalog.return_value = [sample_mf_product, sample_stock_product]

    hybrid = HybridMarketDataProvider(cache=cache, catalog_provider=catalog_mock, live_cache_ttl=1800)

    # Mock MFAPI and Yahoo finance fetches
    mf_meta = UnifiedMarketMetadata(product_id=sample_mf_product.id, product_type="MF_INDEX", nav=185.5)
    stock_meta = UnifiedMarketMetadata(
        product_id=sample_stock_product.id, product_type="STOCK", current_price=2950.0, dividend_yield=1.2, market_cap_cr=2000000.0
    )

    with patch.object(hybrid._mf_provider, "fetch_market_data", new_callable=AsyncMock) as mock_mf, \
         patch.object(hybrid._yf_provider, "fetch_market_data", new_callable=AsyncMock) as mock_yf:

        mock_mf.return_value = {sample_mf_product.id: mf_meta}
        mock_yf.return_value = {sample_stock_product.id: stock_meta}

        results = await hybrid.refresh([sample_mf_product.id, sample_stock_product.id])

        assert sample_mf_product.id in results
        assert sample_stock_product.id in results
        assert results[sample_mf_product.id].nav == 185.5
        assert results[sample_stock_product.id].current_price == 2950.0

        # Second call should hit 30-minute in-memory cache without re-querying live providers
        mock_mf.reset_mock()
        mock_yf.reset_mock()

        cached_results = await hybrid.refresh([sample_mf_product.id, sample_stock_product.id])
        assert cached_results[sample_mf_product.id].nav == 185.5
        mock_mf.assert_not_called()
        mock_yf.assert_not_called()


@pytest.mark.asyncio
async def test_hybrid_provider_fallback_on_failure(sample_stock_product):
    cache = MarketMetadataCache()
    catalog_mock = MagicMock()
    catalog_mock.load_catalog.return_value = [sample_stock_product]

    hybrid = HybridMarketDataProvider(cache=cache, catalog_provider=catalog_mock)

    # Live calls fail
    with patch.object(hybrid._yf_provider, "fetch_market_data", side_effect=Exception("API limit reached")):
        results = await hybrid.refresh([sample_stock_product.id])

    # Must return dictionary without throwing an unhandled exception
    assert isinstance(results, dict)


# ── PostgresProductProvider & Hydration Tests ──────────────────────────────────

def test_postgres_product_provider_fallback():
    provider = PostgresProductProvider()
    catalog = provider.load_catalog()
    assert isinstance(catalog, list)
    assert len(catalog) > 0
    assert catalog[0].id is not None


@pytest.mark.asyncio
async def test_postgres_provider_cache_hit(sample_mf_product):
    cache = MarketMetadataCache()
    from app.market.models import LiveMarketMetadata
    live_meta = LiveMarketMetadata(
        product_id=sample_mf_product.id,
        nav=210.75,
        current_price=210.75,
    )
    await cache.set(sample_mf_product.id, live_meta, ttl_seconds=1800)

    provider = PostgresProductProvider(cache=cache)
    meta = provider.get_market_metadata(sample_mf_product.id)

    assert meta is not None
    assert meta.nav == 210.75
    assert meta.current_price == 210.75
    # Static expected_return_1y comes from PostgreSQL / seed metadata
    assert meta.expected_return_1y is not None


@pytest.mark.asyncio
async def test_postgres_provider_cache_miss_hydration(sample_mf_product, sample_stock_product):
    cache = MarketMetadataCache()
    catalog_mock = MagicMock()
    catalog_mock.load_catalog.return_value = [sample_mf_product, sample_stock_product]

    hybrid = HybridMarketDataProvider(cache=cache, catalog_provider=catalog_mock, live_cache_ttl=1800)
    provider = PostgresProductProvider(cache=cache, market_provider=hybrid)

    mf_meta = UnifiedMarketMetadata(
        product_id=sample_mf_product.id,
        product_type="MF_INDEX",
        nav=185.50,
        current_price=185.50,
    )
    stock_meta = UnifiedMarketMetadata(
        product_id=sample_stock_product.id,
        product_type="STOCK",
        current_price=2950.00,
        pe_ratio=28.5,
    )

    with patch.object(hybrid._mf_provider, "fetch_market_data", new_callable=AsyncMock) as mock_mf, \
         patch.object(hybrid._yf_provider, "fetch_market_data", new_callable=AsyncMock) as mock_yf:

        mock_mf.return_value = {sample_mf_product.id: mf_meta}
        mock_yf.return_value = {sample_stock_product.id: stock_meta}

        # Hydrate missing candidate products
        await provider.hydrate_market_data([sample_mf_product.id, sample_stock_product.id])

        # Verify live values populated in cache
        meta_mf = provider.get_market_metadata(sample_mf_product.id)
        meta_stock = provider.get_market_metadata(sample_stock_product.id)

        assert meta_mf.nav == 185.50
        assert meta_mf.current_price == 185.50
        assert meta_stock.current_price == 2950.00
        assert meta_stock.pe_ratio == 28.5


@pytest.mark.asyncio
async def test_provider_failure_db_fallback(sample_stock_product):
    cache = MarketMetadataCache()
    catalog_mock = MagicMock()
    catalog_mock.load_catalog.return_value = [sample_stock_product]

    hybrid = HybridMarketDataProvider(cache=cache, catalog_provider=catalog_mock)
    provider = PostgresProductProvider(cache=cache, market_provider=hybrid)

    # Live call fails
    with patch.object(hybrid._yf_provider, "fetch_market_data", side_effect=Exception("API Limit")):
        await provider.hydrate_market_data([sample_stock_product.id])

    # Should fall back to static PostgreSQL metadata without crashing
    meta = provider.get_market_metadata(sample_stock_product.id)
    assert meta is not None
    # Live price defaults to None when API is offline, but static expected return is intact from PostgreSQL
    assert meta.current_price is None
    assert meta.expected_return_1y is not None


@pytest.mark.asyncio
async def test_multiple_products_client_hydration(sample_mf_product, sample_stock_product):
    cache = MarketMetadataCache()
    provider_mock = MagicMock()

    from app.services.product_recommendation_service import ProductRecommendationService
    rec_repo = AsyncMock()
    profile_repo = AsyncMock()

    snapshot = MagicMock()
    snapshot.created_at = datetime.now(timezone.utc)
    snapshot.recommended_strategy = "balanced"
    snapshot.investment_readiness = "READY"
    snapshot.monthly_investable_amount = 10000.0
    snapshot.investment_readiness_score = 75.0
    snapshot.allocation_json = [{"category": "SIP / Index Funds", "monthly_amount": 5000, "percentage": 50}]
    snapshot.metadata_json = {"calculation_inputs": {"health_score": 70, "risk_level": "MODERATE"}}
    rec_repo.get_latest_by_user.return_value = snapshot

    provider_mock.load_catalog.return_value = [sample_mf_product, sample_stock_product]
    provider_mock.get_data_source_label.return_value = "postgresql_live_hybrid"
    provider_mock.hydrate_market_data = AsyncMock()

    from app.providers.models import MarketMetadata

    mf_market_meta = MarketMetadata(
        product_id=sample_mf_product.id,
        nav=185.5,
        current_price=185.5,
        expected_return_1y=15.0,
        expected_return_3y=14.0,
        expense_ratio=0.1,
        rating=4.5,
        volatility="MEDIUM",
    )
    stock_market_meta = MarketMetadata(
        product_id=sample_stock_product.id,
        nav=None,
        current_price=2950.0,
        expected_return_1y=18.0,
        expected_return_3y=16.0,
        expense_ratio=None,
        rating=4.8,
        volatility="HIGH",
    )

    def mock_get_market_meta(pid):
        if pid == sample_mf_product.id:
            return mf_market_meta
        if pid == sample_stock_product.id:
            return stock_market_meta
        return None

    provider_mock.get_market_metadata.side_effect = mock_get_market_meta

    service = ProductRecommendationService(
        provider=provider_mock,
        rec_repo=rec_repo,
        profile_repo=profile_repo,
    )

    from uuid import uuid4
    res = await service.get_product_suggestions(user_id=uuid4())

    assert "categories" in res
    provider_mock.hydrate_market_data.assert_called_once()
    products = res["categories"][0]["products"]
    assert len(products) > 0
    assert products[0]["market_data"]["nav"] == 185.5
    assert products[0]["market_data"]["current_price"] == 185.5



def test_static_metadata_seed_validation():
    from app.repositories.investment_product_repository import InvestmentProductRepository

    # Valid static metadata
    valid_data = {
        "product_id": "test-prod",
        "expense_ratio": 0.25,
        "rating": 4.5,
        "expected_return_1y": 14.0,
        "expected_return_3y": 12.5,
        "aum_cr": 1000.0,
    }
    InvestmentProductRepository.validate_static_metadata(valid_data)

    # Invalid expense_ratio > 5%
    with pytest.raises(ValueError, match="expense_ratio"):
        InvestmentProductRepository.validate_static_metadata({**valid_data, "expense_ratio": 6.5})

    # Invalid rating > 5
    with pytest.raises(ValueError, match="rating"):
        InvestmentProductRepository.validate_static_metadata({**valid_data, "rating": 5.5})

    # Invalid expected_return_1y > 50%
    with pytest.raises(ValueError, match="expected_return_1y"):
        InvestmentProductRepository.validate_static_metadata({**valid_data, "expected_return_1y": 60.0})

    # Invalid aum_cr <= 0
    with pytest.raises(ValueError, match="aum_cr"):
        InvestmentProductRepository.validate_static_metadata({**valid_data, "aum_cr": 0.0})


@pytest.mark.asyncio
async def test_static_and_live_merging(sample_mf_product):
    cache = MarketMetadataCache()
    provider = PostgresProductProvider(cache=cache)

    # Seed static metadata for sbi-liquid-fund
    static_meta = provider._static_market_metadata.get("sbi-liquid-fund")
    assert static_meta is not None
    assert static_meta.expected_return_1y == 6.8
    assert static_meta.expense_ratio == 0.22
    assert static_meta.aum_cr == 45892.0
    assert static_meta.rating == 4.6

    # Verify that get_market_metadata returns non-null static fields even before live cache is populated
    meta_before = provider.get_market_metadata("sbi-liquid-fund")
    assert meta_before.expected_return_1y == 6.8
    assert meta_before.expense_ratio == 0.22
    assert meta_before.aum_cr == 45892.0
    assert meta_before.rating == 4.6
    assert meta_before.nav is None

    # Populate live cache
    from app.market.models import LiveMarketMetadata
    live_data = LiveMarketMetadata(
        product_id="sbi-liquid-fund",
        nav=192.45,
        current_price=192.45,
    )
    await cache.set("sbi-liquid-fund", live_data, ttl_seconds=1800)

    # Verify merged result has static fields + live NAV
    meta_after = provider.get_market_metadata("sbi-liquid-fund")
    assert meta_after.nav == 192.45
    assert meta_after.current_price == 192.45
    assert meta_after.expected_return_1y == 6.8
    assert meta_after.expense_ratio == 0.22
    assert meta_after.aum_cr == 45892.0
    assert meta_after.rating == 4.6


@pytest.mark.asyncio
async def test_partial_live_cache_update(sample_mf_product, sample_stock_product):
    cache = MarketMetadataCache()
    catalog_mock = MagicMock()
    catalog_mock.load_catalog.return_value = [sample_mf_product, sample_stock_product]

    hybrid = HybridMarketDataProvider(cache=cache, catalog_provider=catalog_mock)
    provider = PostgresProductProvider(cache=cache, market_provider=hybrid)

    mf_live = UnifiedMarketMetadata(
        product_id=sample_mf_product.id,
        product_type="MF_INDEX",
        nav=185.50,
        current_price=185.50,
    )

    # MFAPI succeeds, Yahoo Finance fails
    with patch.object(hybrid._mf_provider, "fetch_market_data", new_callable=AsyncMock, return_value={sample_mf_product.id: mf_live}), \
         patch.object(hybrid._yf_provider, "fetch_market_data", side_effect=Exception("Yahoo API Down")):

        await provider.hydrate_market_data([sample_mf_product.id, sample_stock_product.id])

    meta_mf = provider.get_market_metadata(sample_mf_product.id)
    meta_stock = provider.get_market_metadata(sample_stock_product.id)

    # MF has live NAV
    assert meta_mf.nav == 185.50

    # Stock live fields remain None, but static fields are preserved from PostgresProductProvider
    assert meta_stock.current_price is None
    assert meta_stock.expected_return_1y is not None


