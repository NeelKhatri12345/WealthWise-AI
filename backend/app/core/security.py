"""
WealthWise AI - Security Primitives

Provides:
- Password hashing and verification (bcrypt)
- JWT access and refresh token creation
- JWT token decoding and validation
- RBAC dependency factory (require_roles)
- Token JTI blacklist helpers (Redis)
"""

from datetime import datetime, timedelta, timezone
from typing import Callable
from uuid import uuid4

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.logger import logger
from app.enums.role_enum import RoleEnum
from app.exceptions.custom_exceptions import (ForbiddenException,
                                              UnauthorizedException)
from app.schemas.auth_schema import TokenPayload

settings = get_settings()

# ── Password Hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

http_bearer = HTTPBearer(auto_error=False)


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt (cost factor 12)."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Creation ────────────────────────────────────────────────────────


def create_access_token(
    subject: str,
    role: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a short-lived JWT access token.

    Args:
        subject: User UUID as string (stored in 'sub' claim)
        role: User role name (stored in 'role' claim)
        expires_delta: Custom expiry; defaults to settings value

    Returns:
        Signed JWT string
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid4()),  # Unique token ID for blacklisting
        "type": "access",
    }
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(subject: str) -> tuple[str, str]:
    """
    Create a long-lived JWT refresh token.

    Returns:
        Tuple of (encoded_token, jti) — jti stored in Redis for revocation
    """
    jti = str(uuid4())
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": jti,
        "type": "refresh",
    }
    token = jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return token, jti


def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT token.

    Raises:
        UnauthorizedException: If token is expired, malformed, or invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return TokenPayload(**payload)
    except JWTError as exc:
        logger.warning("JWT decode failed", extra={"error": str(exc)})
        raise UnauthorizedException("Invalid or expired token")


# ── RBAC Dependency Factory ───────────────────────────────────────────────────


def require_roles(*allowed_roles: RoleEnum) -> Callable:
    """
    FastAPI dependency factory for role-based access control.

    Usage:
        @router.get("/admin/users")
        async def list_users(user = Depends(require_roles(RoleEnum.ADMIN))):
            ...

    Args:
        *allowed_roles: One or more RoleEnum values that are permitted

    Returns:
        FastAPI dependency that returns the authenticated user or raises 403
    """

    async def _role_checker(
        current_user=Depends(_get_current_active_user),
    ):
        if current_user.role.name not in [r.value for r in allowed_roles]:
            logger.warning(
                "RBAC: Access denied",
                extra={
                    "user_id": str(current_user.id),
                    "user_role": current_user.role.name,
                    "required_roles": [r.value for r in allowed_roles],
                },
            )
            raise ForbiddenException(
                f"Requires one of: {', '.join(r.value for r in allowed_roles)}"
            )
        return current_user

    return _role_checker


# ── Internal Auth Dependency (imported by dependencies.py) ────────────────────


async def _get_current_active_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
):
    """
    Internal dependency — decodes bearer token and returns active user.
    Imported and wrapped by app/core/dependencies.py.
    """
    # Import here to avoid circular imports
    from app.core.dependencies import get_current_active_user

    return await get_current_active_user(credentials)
