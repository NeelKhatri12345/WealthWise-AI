"""
WealthWise AI - Financial Chat Repository

Manages financial_chat_sessions and financial_chat_messages tables.
"""

from datetime import datetime, timezone
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.chat_session_status_enum import ChatSessionStatus
from app.models.financial_chat_message import FinancialChatMessage
from app.models.financial_chat_session import FinancialChatSession
from app.repositories.base_repository import BaseRepository


class FinancialChatRepository(BaseRepository[FinancialChatSession]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(FinancialChatSession, db)

    # ── Session helpers ───────────────────────────────────────────────────────

    async def create_session(self, user_id: UUID) -> FinancialChatSession:
        """Create a new active chat session for a user."""
        return await self.create(
            {"user_id": user_id, "status": ChatSessionStatus.ACTIVE, "current_step": 0}
        )

    async def get_session(self, session_id: UUID) -> Optional[FinancialChatSession]:
        """Return a session by its primary key."""
        return await self.db.get(FinancialChatSession, session_id)

    async def get_active_session(self, user_id: UUID) -> Optional[FinancialChatSession]:
        """Return the most recent active session for a user, or None."""
        stmt = (
            select(FinancialChatSession)
            .where(
                FinancialChatSession.user_id == user_id,
                FinancialChatSession.status == ChatSessionStatus.ACTIVE,
            )
            .order_by(FinancialChatSession.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_completed_session(self, user_id: UUID) -> Optional[FinancialChatSession]:
        """Return the most recent completed session for a user, or None.

        Used by start_session to resume after a page refresh instead of
        creating a brand-new step-0 session that would show 'Step 1' while
        the profile already has 100% completion stored in the database.

        Archived sessions are intentionally excluded — they belong to a
        superseded assessment and must not be resumed.
        """
        stmt = (
            select(FinancialChatSession)
            .where(
                FinancialChatSession.user_id == user_id,
                FinancialChatSession.status == ChatSessionStatus.COMPLETED,
            )
            .order_by(FinancialChatSession.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def advance_step(self, session: FinancialChatSession, step: int) -> FinancialChatSession:
        """Update current_step on a session."""
        return await self.update(session, {"current_step": step})

    async def complete_session(self, session: FinancialChatSession) -> FinancialChatSession:
        """Mark a session as completed and record the timestamp."""
        return await self.update(
            session,
            {
                "status": ChatSessionStatus.COMPLETED,
                "completed_at": datetime.now(timezone.utc),
            },
        )

    async def archive_session(self, session: FinancialChatSession) -> FinancialChatSession:
        """Archive a single specific session.

        Used when a user starts a new assessment (retake).  The archived
        session is kept in the DB for audit/history — it will never be
        resumed by start_session or get_latest_completed_session.
        """
        return await self.update(
            session,
            {"status": ChatSessionStatus.ARCHIVED},
        )

    # ── Message helpers ───────────────────────────────────────────────────────

    async def add_message(
        self,
        session_id: UUID,
        user_id: UUID,
        sender: str,
        message: str,
        extracted_fields: Optional[dict] = None,
    ) -> FinancialChatMessage:
        """Persist a single chat message."""
        instance = FinancialChatMessage(
            session_id=session_id,
            user_id=user_id,
            sender=sender,
            message=message,
            extracted_fields=extracted_fields,
        )
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_messages(self, session_id: UUID) -> Sequence[FinancialChatMessage]:
        """Return all messages for a session ordered by creation time."""
        stmt = (
            select(FinancialChatMessage)
            .where(FinancialChatMessage.session_id == session_id)
            .order_by(FinancialChatMessage.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
