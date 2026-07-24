"""WealthWise AI - Password Reset Token Repository"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.password_reset_token import PasswordResetToken
from app.repositories.base_repository import BaseRepository


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(PasswordResetToken, db)

    async def get_by_hash(self, token_hash: str) -> Optional[PasswordResetToken]:
        """Fetch token by its SHA256 hash."""
        stmt = (
            select(PasswordResetToken)
            .options(selectinload(PasswordResetToken.user))
            .where(PasswordResetToken.token_hash == token_hash)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def invalidate_tokens_for_user(self, user_id: UUID) -> None:
        """Mark all unused, non-expired reset tokens for a user as used."""
        stmt = (
            update(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.is_used.is_(False),
                PasswordResetToken.expires_at > datetime.now(timezone.utc),
            )
            .values(is_used=True)
        )
        await self.db.execute(stmt)
        await self.db.flush()
