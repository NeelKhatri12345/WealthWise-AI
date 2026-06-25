"""
WealthWise AI - Async SQLAlchemy Engine & Session Factory

Configuration:
- Uses asyncpg driver (postgresql+asyncpg)
- Connection pool: size=10, overflow=20 (handles up to 30 concurrent connections)
- pool_pre_ping=True detects and replaces stale connections
- pool_recycle=1800 prevents connections from aging out
- expire_on_commit=False keeps ORM objects usable after commit
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    # Connection pooling
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,  # Seconds to wait for a connection from the pool
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Issue SELECT 1 before using a connection
    # Debugging
    echo=settings.DB_ECHO,  # Log all SQL — dev only
    echo_pool=False,  # Set True to debug pool events
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Allow attribute access after commit without re-query
    autoflush=False,  # Manual flush control
    autocommit=False,  # Explicit transaction control
)
