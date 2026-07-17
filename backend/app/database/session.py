"""
WealthWise AI - Async SQLAlchemy Engine & Session Factory

Configuration:
- Production (postgresql+asyncpg):
    - Connection pool: size=10, overflow=20 (handles up to 30 concurrent connections)
    - pool_pre_ping=True detects and replaces stale connections
    - pool_recycle=1800 prevents connections from aging out
- Tests / local (sqlite+aiosqlite):
    - StaticPool reuses a single connection so in-memory DB state persists
      across sessions within a test run
    - Pool-tuning kwargs (pool_size, max_overflow, pool_timeout) are omitted
      because the SQLite dialect rejects them
- expire_on_commit=False keeps ORM objects usable after commit
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings

settings = get_settings()


def _build_engine_kwargs(database_url: str, echo: bool) -> dict[str, Any]:
    """Return create_async_engine kwargs appropriate for the given URL.

    PostgreSQL gets production-grade connection pooling. SQLite (used by the
    test suite) falls back to a single shared StaticPool connection — which
    is required for in-memory databases and which avoids the SQLite dialect
    rejecting Postgres-only pool-tuning kwargs.
    """
    common: dict[str, Any] = {
        "echo": echo,
        "echo_pool": False,
    }

    if database_url.startswith("sqlite"):
        return {
            **common,
            "poolclass": StaticPool,
            "connect_args": {"check_same_thread": False},
        }

    return {
        **common,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }


engine = create_async_engine(
    settings.DATABASE_URL,
    **_build_engine_kwargs(settings.DATABASE_URL, settings.DB_ECHO),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Allow attribute access after commit without re-query
    autoflush=False,  # Manual flush control
    autocommit=False,  # Explicit transaction control
)
