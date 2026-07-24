"""WealthWise AI - User Repository"""

from datetime import datetime, timezone
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    def _active_users_filter(self, stmt, *, include_deleted: bool = False):
        if not include_deleted:
            stmt = stmt.where(User.is_deleted.is_(False))
        return stmt

    async def get_by_id(
        self, user_id: UUID, *, include_deleted: bool = False
    ) -> Optional[User]:
        """Fetch user by ID with role eagerly loaded."""
        stmt = (
            select(User)
            .options(selectinload(User.role))
            .where(User.id == user_id)
        )
        stmt = self._active_users_filter(stmt, include_deleted=include_deleted)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email (case-insensitive) with role loaded."""
        stmt = (
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email.lower())
        )
        stmt = self._active_users_filter(stmt)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role_filter: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        include_deleted: bool = False,
    ) -> Sequence[User]:
        """Admin: paginated list of all users with optional filters."""
        stmt = select(User).options(selectinload(User.role))
        stmt = self._active_users_filter(stmt, include_deleted=include_deleted)
        if role_filter:
            stmt = stmt.join(User.role).where(User.role.has(name=role_filter))
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(User.full_name.ilike(pattern), User.email.ilike(pattern))
            )
        stmt = stmt.order_by(User.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_users(
        self,
        role_filter: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        include_deleted: bool = False,
    ) -> int:
        """Admin: count users matching list filters."""
        stmt = select(func.count()).select_from(User)
        if not include_deleted:
            stmt = stmt.where(User.is_deleted.is_(False))
        if role_filter:
            stmt = stmt.join(User.role).where(User.role.has(name=role_filter))
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(User.full_name.ilike(pattern), User.email.ilike(pattern))
            )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def deactivate(self, user: User) -> User:
        """Soft-disable a user account."""
        return await self.update(user, {"is_active": False})

    async def activate(self, user: User) -> User:
        """Re-enable a user account."""
        return await self.update(user, {"is_active": True})

    async def soft_delete(self, user: User) -> User:
        """Mark user as deleted without removing data."""
        return await self.update(
            user,
            {
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc),
                "is_active": False,
            },
        )

    async def record_login(self, user: User) -> User:
        """Update last login timestamp."""
        return await self.update(
            user, {"last_login_at": datetime.now(timezone.utc)}
        )

    async def email_exists(self, email: str) -> bool:
        stmt = select(User).where(User.email == email.lower(), User.is_deleted.is_(False)).limit(1)
        result = await self.db.execute(stmt)
        return result.scalar() is not None

    async def count_active(self) -> int:
        """Return count of active, non-deleted user accounts."""
        stmt = (
            select(func.count())
            .select_from(User)
            .where(User.is_active.is_(True), User.is_deleted.is_(False))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
