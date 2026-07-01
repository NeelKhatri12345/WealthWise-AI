"""
WealthWise AI - FastAPI Dependency Injection Providers

All reusable FastAPI dependencies are defined here.
Imported by route handlers via Depends().

Providers:
- get_db()                  → yields AsyncSession
- get_current_user()        → decodes JWT, returns User model
- get_current_active_user() → get_current_user + checks is_active
- get_admin_user()          → shorthand for ADMIN role
- get_*_repository()        → repository instances
- get_*_service()           → service instances (with injected repos)
"""

from typing import AsyncGenerator
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logger import logger
from app.database.session import AsyncSessionLocal
from app.enums.role_enum import RoleEnum
from app.exceptions.custom_exceptions import ForbiddenException, UnauthorizedException

settings = get_settings()
http_bearer = HTTPBearer(auto_error=False)


# ── Database Session ──────────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields an async database session.
    Commits on success, rolls back on exception, always closes.

    Usage:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Authentication Dependencies ───────────────────────────────────────────────


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: AsyncSession = Depends(get_db),
):
    """
    Decodes the Bearer JWT and returns the corresponding User ORM instance.

    Raises:
        UnauthorizedException: Token missing, invalid, expired, or blacklisted
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication credentials not provided")

    from app.core.security import decode_token
    from app.repositories.user_repository import UserRepository

    token_payload = decode_token(credentials.credentials)

    # Check JWT blacklist (Redis)
    await _check_token_blacklist(token_payload.jti)

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(token_payload.sub))
    if not user:
        raise UnauthorizedException("User not found")

    return user


async def get_current_active_user(
    current_user=Depends(get_current_user),
):
    """
    Extends get_current_user with an is_active check.

    Raises:
        ForbiddenException: User account is deactivated
    """
    if not current_user.is_active:
        raise ForbiddenException("User account is deactivated")
    return current_user


async def get_admin_user(
    current_user=Depends(get_current_active_user),
):
    """Shorthand dependency requiring ADMIN role."""
    if current_user.role.name != RoleEnum.ADMIN.value:
        raise ForbiddenException("Admin access required")
    return current_user


# ── Repository Dependencies ───────────────────────────────────────────────────


def get_user_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository

    return UserRepository(db)


def get_statement_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.statement_repository import StatementRepository

    return StatementRepository(db)


def get_transaction_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.transaction_repository import TransactionRepository

    return TransactionRepository(db)


def get_analytics_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.analytics_repository import AnalyticsRepository

    return AnalyticsRepository(db)


# ── Service Dependencies ──────────────────────────────────────────────────────


def get_auth_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository
    from app.services.auth_service import AuthService

    return AuthService(user_repo=UserRepository(db))


def get_user_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository
    from app.services.user_service import UserService

    return UserService(user_repo=UserRepository(db))


def get_statement_service(db: AsyncSession = Depends(get_db)):
    from app.clients.s3_client import S3Client
    from app.repositories.statement_repository import StatementRepository
    from app.services.statement_service import StatementService

    return StatementService(
        statement_repo=StatementRepository(db),
        s3_client=S3Client(settings),
    )


def get_statement_processing_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.statement_repository import StatementRepository
    from app.services.statement_processing_service import StatementProcessingService

    return StatementProcessingService(
        statement_repo=StatementRepository(db),
    )


def get_analytics_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.services.analytics_service import AnalyticsService

    return AnalyticsService(analytics_repo=AnalyticsRepository(db))


def get_portfolio_service(db: AsyncSession = Depends(get_db)):
    from app.clients.gemini_client import GeminiClient
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.services.portfolio_service import PortfolioService

    return PortfolioService(
        analytics_repo=AnalyticsRepository(db),
        gemini_client=GeminiClient(settings),
    )


def get_ai_coach_service(db: AsyncSession = Depends(get_db)):
    from app.clients.gemini_client import GeminiClient
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.services.ai_coach_service import AICoachService

    return AICoachService(
        analytics_repo=AnalyticsRepository(db),
        gemini_client=GeminiClient(settings),
    )


def get_admin_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.statement_repository import StatementRepository
    from app.repositories.user_repository import UserRepository
    from app.services.admin_service import AdminService

    return AdminService(
        user_repo=UserRepository(db),
        statement_repo=StatementRepository(db),
    )


def get_dashboard_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.dashboard_service import DashboardService

    return DashboardService(
        transaction_repo=TransactionRepository(db),
        analytics_repo=AnalyticsRepository(db),
    )


# ── Internal Helpers ──────────────────────────────────────────────────────────


async def _check_token_blacklist(jti: str) -> None:
    """
    Checks Redis for blacklisted JWT (logout / token revocation).
    If Redis is unavailable, logs a warning and allows the request (fail-open).
    """
    try:
        import redis.asyncio as aioredis

        client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        from app.core.constants import REDIS_BLACKLIST_PREFIX

        is_blacklisted = await client.exists(f"{REDIS_BLACKLIST_PREFIX}{jti}")
        await client.aclose()
        if is_blacklisted:
            raise UnauthorizedException("Token has been revoked")
    except UnauthorizedException:
        raise
    except Exception as exc:
        logger.warning(
            "Redis blacklist check failed (fail-open)", extra={"error": str(exc)}
        )
