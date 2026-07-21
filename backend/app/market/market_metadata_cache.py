"""
WealthWise AI — Market Metadata Cache

Implements a two-layer cache pattern:
1. Sync in-memory dictionary for sub-millisecond, non-blocking reads during scoring.
2. Redis for persistent cross-process caching.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional, Any
import redis.asyncio as aioredis

from app.core.config import get_settings
from app.core.logger import logger
from app.market.models import LiveMarketMetadata, UnifiedMarketMetadata

settings = get_settings()


class MarketMetadataCache:
    """
    Two-layer cache for Live Market Metadata.
    Ensures zero database/external calls are made during hot path scoring.
    """

    def __init__(self) -> None:
        self._memory_cache: dict[str, Any] = {}
        self._redis_url = settings.REDIS_URL
        self._initialized = False

    def get_sync(self, product_id: str) -> Optional[Any]:
        """
        Synchronously fetches live metadata from local memory.
        Guarantees non-blocking sub-millisecond execution.
        """
        return self._memory_cache.get(product_id)

    async def initialize(self) -> None:
        """
        Initializes cache by pulling all active keys from Redis.
        """
        if self._initialized:
            return
        await self.load_from_redis()
        self._initialized = True

    async def load_from_redis(self) -> None:
        """
        Scans Redis and copies matching cache values into the in-memory layer.
        """
        try:
            client = aioredis.from_url(self._redis_url, decode_responses=True)
            keys = await client.keys("market:metadata:*")
            if not keys:
                await client.aclose()
                return

            loaded = 0
            for key in keys:
                product_id = key.replace("market:metadata:", "")
                val_json = await client.get(key)
                if val_json:
                    try:
                        data = json.loads(val_json)
                        if "product_type" in data:
                            self._memory_cache[product_id] = UnifiedMarketMetadata.from_dict(data)
                        else:
                            self._memory_cache[product_id] = LiveMarketMetadata.from_dict(data)
                        loaded += 1
                    except Exception as e:
                        logger.warning(
                            "Failed to parse cached metadata for key",
                            extra={"product_id": product_id, "error": str(e)},
                        )
            await client.aclose()
            logger.info(
                "Loaded market metadata from Redis into memory cache",
                extra={"loaded_count": loaded},
            )
        except Exception as e:
            logger.warning(
                "Redis connection failed for market cache. Falling back to memory-only.",
                extra={"error": str(e)},
            )

    async def set(self, product_id: str, metadata: Any, ttl_seconds: int) -> None:
        """
        Updates the local memory cache and persists in Redis.
        """
        self._memory_cache[product_id] = metadata



        try:
            client = aioredis.from_url(self._redis_url, decode_responses=True)
            key = f"market:metadata:{product_id}"
            serialized = json.dumps(metadata.to_dict() if hasattr(metadata, "to_dict") else metadata)
            await client.set(key, serialized, ex=ttl_seconds)
            await client.aclose()
        except Exception as e:
            logger.warning(
                "Failed to persist market metadata to Redis",
                extra={"product_id": product_id, "error": str(e)},
            )


    async def set_bulk(self, entries: dict[str, UnifiedMarketMetadata], ttl_map: dict[str, int]) -> None:
        """
        Pipes multiple metadata items into both cache layers.
        """
        for pid, meta in entries.items():
            ttl = ttl_map.get(pid, 86400)
            await self.set(pid, meta, ttl)

    async def invalidate(self, product_id: str) -> None:
        """
        Clears cache for a specific product ID.
        """
        self._memory_cache.pop(product_id, None)
        try:
            client = aioredis.from_url(self._redis_url, decode_responses=True)
            await client.delete(f"market:metadata:{product_id}")
            await client.aclose()
        except Exception as e:
            logger.warning(
                "Failed to invalidate key in Redis",
                extra={"product_id": product_id, "error": str(e)},
            )

    async def invalidate_all(self) -> None:
        """
        Nukes the entire cache.
        """
        self._memory_cache.clear()
        try:
            client = aioredis.from_url(self._redis_url, decode_responses=True)
            keys = await client.keys("market:metadata:*")
            if keys:
                await client.delete(*keys)
            await client.aclose()
        except Exception as e:
            logger.warning("Failed to flush Redis market cache", extra={"error": str(e)})

    def get_cache_stats(self) -> dict[str, Any]:
        return {
            "memory_cache_size": len(self._memory_cache),
            "cached_product_ids": list(self._memory_cache.keys()),
            "initialized": self._initialized,
        }
