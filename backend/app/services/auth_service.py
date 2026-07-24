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
from app.enums.activity_type_enum import ActivityTypeEnum
from app.enums.admin_audit_action_enum import AdminAuditActionEnum
from app.enums.role_enum import RoleEnum
from app.exceptions.custom_exceptions import ConflictException, UnauthorizedException
from app.repositories.user_repository import UserRepository
from app.repositories.password_reset_token_repository import PasswordResetTokenRepository
from app.services.email_service import EmailService
from app.services.activity_log_service import ActivityLogService
from app.services.admin_audit_log_service import AdminAuditLogService
from app.schemas.auth_schema import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)

settings = get_settings()


class AuthService:

    def __init__(
        self,
        user_repo: UserRepository,
        password_reset_token_repo: PasswordResetTokenRepository | None = None,
        email_service: EmailService | None = None,
        activity_log: ActivityLogService | None = None,
        admin_audit_log: AdminAuditLogService | None = None,
    ) -> None:
        self._user_repo = user_repo
        self._password_reset_token_repo = password_reset_token_repo
        self._email_service = email_service
        self._activity_log = activity_log
        self._admin_audit_log = admin_audit_log

    async def register(self, data: RegisterRequest):
        """
        Register a new user.
        1. Check email uniqueness
        2. Hash password
        3. Assign default USER role
        4. Create user record
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

        user.role = role  # Set role to prevent lazy loading exception in v1/auth_routes
        logger.info("New user registered", extra={"user_id": str(user.id)})
        return user

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

        if user.is_deleted:
            raise UnauthorizedException("Account is deactivated")

        await self._user_repo.record_login(user)
        if self._activity_log:
            await self._activity_log.log(
                user_id=user.id,
                activity_type=ActivityTypeEnum.LOGIN,
                description="User signed in",
            )
        if (
            self._admin_audit_log
            and user.role
            and user.role.name == RoleEnum.ADMIN.value
        ):
            await self._admin_audit_log.log(
                admin_id=user.id,
                action=AdminAuditActionEnum.ADMIN_LOGIN,
                description="Admin signed in",
            )
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
        if not user or not user.is_active or user.is_deleted:
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

    async def forgot_password(self, email: str) -> None:
        """
        Initiate password reset.
        Generates reset token and sends email. Same response regardless of user existence.
        """
        user = await self._user_repo.get_by_email(email)
        if not user:
            logger.info(f"Forgot password requested for non-existent email: {email}")
            return

        import secrets
        import hashlib
        from datetime import datetime, timezone, timedelta

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        if self._password_reset_token_repo:
            # Invalidate existing unused active reset tokens
            await self._password_reset_token_repo.invalidate_tokens_for_user(user.id)
            # Save new reset token
            await self._password_reset_token_repo.create({
                "token_hash": token_hash,
                "user_id": user.id,
                "expires_at": expires_at,
                "is_used": False,
            })

        if self._email_service:
            await self._email_service.send_password_reset_email(user.email, token)

        logger.info(f"Password reset token generated and sent for user {user.id}")

    async def reset_password(self, token: str, new_password: str) -> None:
        """
        Reset user's password using the provided reset token.
        """
        import hashlib
        from datetime import datetime, timezone

        token_hash = hashlib.sha256(token.encode()).hexdigest()

        if not self._password_reset_token_repo:
            raise UnauthorizedException("Password reset service unavailable")

        reset_token = await self._password_reset_token_repo.get_by_hash(token_hash)
        if (
            not reset_token
            or reset_token.is_used
            or reset_token.expires_at < datetime.now(timezone.utc)
        ):
            raise UnauthorizedException("Invalid or expired reset token")

        # Update user's password
        user = reset_token.user
        if not user or user.is_deleted or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        await self._user_repo.update(user, {"hashed_password": hash_password(new_password)})

        # Mark token as used
        await self._password_reset_token_repo.update(reset_token, {"is_used": True})

        if self._activity_log:
            await self._activity_log.log(
                user_id=user.id,
                activity_type=ActivityTypeEnum.PROFILE_UPDATE,
                description="Password reset via token",
            )

        logger.info(f"Password successfully reset for user {user.id}")
