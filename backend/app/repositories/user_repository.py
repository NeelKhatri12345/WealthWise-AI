"""WealthWise AI - User Repository"""

from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Fetch user by ID with role eagerly loaded."""
        stmt = (
            select(User)
            .options(selectinload(User.role))
            .where(User.id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email (case-insensitive) with role loaded."""
        stmt = (
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email.lower())
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role_filter: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Sequence[User]:
        """Admin: paginated list of all users with optional filters."""
        stmt = select(User).options(selectinload(User.role))
        if role_filter:
            stmt = stmt.join(User.role).where(User.role.has(name=role_filter))
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def deactivate(self, user: User) -> User:
        """Soft-disable a user account."""
        return await self.update(user, {"is_active": False})

    async def activate(self, user: User) -> User:
        """Re-enable a user account."""
        return await self.update(user, {"is_active": True})

    async def email_exists(self, email: str) -> bool:
        return await self.exists(email=email.lower())
