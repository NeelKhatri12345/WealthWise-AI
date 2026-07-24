"""WealthWise AI - System Monitoring Service (admin dashboard)"""

import asyncio
import time
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.gemini_client import GeminiClient
from app.clients.s3_client import S3Client
from app.core.config import get_settings
from app.core.logger import logger
from app.market.providers.mfapi_provider import MFAPIProvider
from app.market.providers.yahoo_finance_provider import YahooFinanceProvider
from app.schemas.admin_schema import ServiceMonitorItem, SystemMonitoringResponse

settings = get_settings()

_CHECK_TIMEOUT_SECONDS = 8.0


class SystemMonitoringService:

    def __init__(
        self,
        db: AsyncSession,
        s3_client: S3Client,
        gemini_client: GeminiClient,
    ) -> None:
        self._db = db
        self._s3 = s3_client
        self._gemini = gemini_client

    async def get_monitoring_status(self) -> SystemMonitoringResponse:
        checks = await asyncio.gather(
            self._check_postgresql(),
            self._check_redis(),
            self._check_minio(),
            self._check_gemini(),
            self._check_yahoo_finance(),
            self._check_mfapi(),
        )
        return SystemMonitoringResponse(
            checked_at=datetime.now(timezone.utc),
            services=list(checks),
        )

    async def _run_check(
        self,
        name: str,
        label: str,
        coro,
    ) -> ServiceMonitorItem:
        start = time.perf_counter()
        try:
            await asyncio.wait_for(coro, timeout=_CHECK_TIMEOUT_SECONDS)
            latency_ms = round((time.perf_counter() - start) * 1000, 1)
            return ServiceMonitorItem(
                name=name,
                label=label,
                status="online",
                latency_ms=latency_ms,
            )
        except Exception as exc:
            latency_ms = round((time.perf_counter() - start) * 1000, 1)
            logger.warning(
                "System monitoring check failed",
                extra={"service": name, "error": str(exc)},
            )
            return ServiceMonitorItem(
                name=name,
                label=label,
                status="offline",
                latency_ms=latency_ms,
                message=str(exc)[:200],
            )

    async def _check_postgresql(self) -> ServiceMonitorItem:
        async def _probe() -> None:
            await self._db.execute(text("SELECT 1"))

        return await self._run_check("postgresql", "PostgreSQL", _probe())

    async def _check_redis(self) -> ServiceMonitorItem:
        async def _probe() -> None:
            import redis.asyncio as aioredis

            client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            try:
                pong = await client.ping()
                if not pong:
                    raise RuntimeError("Redis ping returned false")
            finally:
                await client.aclose()

        return await self._run_check("redis", "Redis", _probe())

    async def _check_minio(self) -> ServiceMonitorItem:
        return await self._run_check(
            "minio",
            "MinIO",
            self._s3.health_check(),
        )

    async def _check_gemini(self) -> ServiceMonitorItem:
        async def _probe() -> None:
            ok = await self._gemini.health_check()
            if not ok:
                raise RuntimeError("Gemini API health check failed")

        return await self._run_check("gemini_api", "Gemini API", _probe())

    async def _check_yahoo_finance(self) -> ServiceMonitorItem:
        return await self._run_check(
            "yahoo_finance",
            "Yahoo Finance",
            YahooFinanceProvider.health_check(),
        )

    async def _check_mfapi(self) -> ServiceMonitorItem:
        return await self._run_check(
            "mfapi",
            "MFAPI",
            MFAPIProvider.health_check(),
        )
