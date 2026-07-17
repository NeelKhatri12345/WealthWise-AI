"""
WealthWise AI - Auth Service

Handles: registration, login, token refresh, logout.
Orchestrates: user repo, password hashing, JWT creation, Redis blacklist.
"""

from app.core.config import get_settings
from app.core.constants import REDIS_BLACKLIST_PREFIX, REDIS_REFRESH_PREFIX
from app.core.logger import logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.exceptions.custom_exceptions import ConflictException, UnauthorizedException
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)

settings = get_settings()


class AuthService:

    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    async def register(self, data: RegisterRequest) -> TokenResponse:
        """
        Register a new user.
        1. Check email uniqueness
        2. Hash password
        3. Assign default USER role
        4. Create user record
        5. Issue tokens
        """
        if await self._user_repo.email_exists(data.email):
            raise ConflictException(f"Email '{data.email}' is already registered")

        # Fetch default USER role ID
        from sqlalchemy import select

        from app.enums.role_enum import RoleEnum
        from app.models.role import Role

        role_result = await self._user_repo.db.execute(
            select(Role).where(Role.name == RoleEnum.USER)
        )
        role = role_result.scalar_one_or_none()
        if not role:
            raise RuntimeError("Default USER role not seeded in database")

        user = await self._user_repo.create(
            {
                "email": data.email.lower(),
                "hashed_password": hash_password(data.password),
                "full_name": data.full_name,
                "phone": data.phone,
                "role_id": role.id,
            }
        )

        logger.info("New user registered", extra={"user_id": str(user.id)})
        return self._generate_tokens(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Authenticate user credentials and issue JWT pair.
        Raises UnauthorizedException for invalid credentials (no info leakage).
        """
        user = await self._user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        logger.info("User logged in", extra={"user_id": str(user.id)})
        return self._generate_tokens(user)

    async def refresh(self, data: RefreshTokenRequest) -> TokenResponse:
        """
        Validate refresh token and issue a new access token.
        Implements refresh token rotation (invalidates old refresh token).
        """
        payload = decode_token(data.refresh_token)
        if payload.type != "refresh":
            raise UnauthorizedException("Invalid token type")

        # Verify refresh token is still valid in Redis
        redis = await self._get_redis()
        stored = await redis.get(f"{REDIS_REFRESH_PREFIX}{payload.jti}")
        if not stored:
            raise UnauthorizedException("Refresh token expired or revoked")

        user = await self._user_repo.get_by_id(payload.sub)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        # Rotate: invalidate old refresh token
        await redis.delete(f"{REDIS_REFRESH_PREFIX}{payload.jti}")
        await redis.aclose()

        return self._generate_tokens(user)

    async def logout(self, access_jti: str) -> None:
        """Blacklist the access token JTI in Redis."""
        redis = await self._get_redis()
        expire = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        await redis.setex(
            f"{REDIS_BLACKLIST_PREFIX}{access_jti}",
            expire,
            "1",
        )
        await redis.aclose()

    def _generate_tokens(self, user) -> TokenResponse:
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.name if user.role else "user",
        )
        refresh_token, jti = create_refresh_token(subject=str(user.id))

        # Store refresh JTI in Redis for validation
        import asyncio

        asyncio.create_task(self._store_refresh_jti(jti))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def _store_refresh_jti(self, jti: str) -> None:
        redis = await self._get_redis()
        expire = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400
        await redis.setex(f"{REDIS_REFRESH_PREFIX}{jti}", expire, "1")
        await redis.aclose()

    @staticmethod
    async def _get_redis():
        import redis.asyncio as aioredis

        return aioredis.from_url(settings.REDIS_URL, decode_responses=True)
