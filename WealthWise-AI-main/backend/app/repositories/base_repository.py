"""
WealthWise AI - Base Repository

Generic async CRUD mixin using SQLAlchemy 2.x.
All domain repositories inherit from this.
"""

from typing import Any, Generic, Optional, Sequence, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """
    Generic async CRUD operations.
    Concrete repositories extend this and add domain-specific queries.
    """

    def __init__(self, model: Type[ModelT], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    async def get(self, id: UUID) -> Optional[ModelT]:
        """Fetch a single record by primary key."""
        result = await self.db.get(self.model, id)
        return result

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[ModelT]:
        """Fetch paginated records ordered by created_at descending."""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count(self) -> int:
        """Return total number of records."""
        stmt = select(func.count()).select_from(self.model)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create(self, data: dict[str, Any]) -> ModelT:
        """Create a new record and flush to DB (does not commit)."""
        instance = self.model(**data)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(
        self,
        instance: ModelT,
        data: dict[str, Any],
    ) -> ModelT:
        """Update fields on an existing instance and flush."""
        for key, value in data.items():
            setattr(instance, key, value)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        """Hard delete an instance."""
        await self.db.delete(instance)
        await self.db.flush()

    async def exists(self, **kwargs: Any) -> bool:
        """Check existence by filter kwargs."""
        stmt = select(self.model).filter_by(**kwargs).limit(1)
        result = await self.db.execute(stmt)
        return result.scalar() is not None
