"""
WealthWise AI - Integration Test Fixtures

Integration tests run against the real PostgreSQL database (the same engine
used in production), not the in-memory SQLite used by unit tests. These
fixtures override the SQLite ``test_engine`` / ``db_session`` defined in the
parent ``tests/conftest.py`` for everything under ``tests/integration/``.

Schema lifecycle is owned by Alembic (CI runs ``alembic upgrade head`` against
the provisioned database), so these fixtures connect to the existing schema
instead of calling ``create_all`` / ``drop_all``. Each test runs inside an
outer transaction that is always rolled back, giving full isolation even when
the application layer commits — ``join_transaction_mode="create_savepoint"``
turns those inner commits into savepoint releases.
"""

from typing import AsyncGenerator

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    from app.core.config import get_settings

    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    connection = await test_engine.connect()
    transaction = await connection.begin()
    session_factory = async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    session = session_factory()
    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()
