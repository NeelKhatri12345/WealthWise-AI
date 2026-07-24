"""WealthWise AI - User Schemas (Pydantic V2)"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_deleted: bool = False
    role_name: str = ""
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    @classmethod
    def from_orm_with_role(cls, user) -> "UserResponse":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_deleted=getattr(user, "is_deleted", False),
            role_name=user.role.name if user.role else "",
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=getattr(user, "last_login_at", None),
        )


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, pattern=r"^\+?[1-9]\d{6,14}$")


class AdminUserUpdate(UserUpdate):
    """Extended update schema for admin — can change active status."""

    is_active: Optional[bool] = None
