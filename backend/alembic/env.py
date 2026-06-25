"""
Alembic Environment Configuration

Handles both sync (offline) and async (online) migration execution.
All models must be imported here (via app.models) for autogenerate to detect changes.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

# Alembic Config object
config = context.config

# Setup Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import all models so Base.metadata is populated ──────────────────────────
from app.database.base import Base
from app.models import *  # noqa: F401, F403 — side-effect import

target_metadata = Base.metadata


def get_url() -> str:
    """Load database URL from app settings (reads .env file)."""
    from app.core.config import get_settings
    return get_settings().DATABASE_URL


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    Emits SQL to stdout without a live connection (useful for review).
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        include_schemas=False,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode against a live async database connection.
    """
    # Override sqlalchemy.url from app settings
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No pool for migration runner
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
