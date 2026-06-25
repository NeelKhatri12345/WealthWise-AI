"""
WealthWise AI - Auth Schemas (Pydantic V2)
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    phone: Optional[str] = Field(default=None, pattern=r"^\+?[1-9]\d{6,14}$")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenPayload(BaseModel):
    """Internal token payload — decoded from JWT claims."""
    sub: str          # User UUID
    role: str = ""    # User role
    exp: datetime
    iat: datetime
    jti: str          # Unique token ID for blacklisting
    type: str = "access"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Must contain uppercase")
        if not any(c.isdigit() for c in v):
            raise ValueError("Must contain a digit")
        return v
