"""
WealthWise AI - AI Coach Repository

Manages ai_coach_conversations and ai_coach_messages tables.
"""

from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ai_coach_conversation import AICoachConversation
from app.models.ai_coach_message import AICoachMessage
from app.repositories.base_repository import BaseRepository


class AICoachRepository(BaseRepository[AICoachConversation]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AICoachConversation, db)

    # ── Conversation helpers ───────────────────────────────────────────────────

    async def create_conversation(
        self, user_id: UUID, title: str = "New Conversation"
    ) -> AICoachConversation:
        """Create a new conversation for a user."""
        return await self.create({"user_id": user_id, "title": title})

    async def get_conversation(
        self, conversation_id: UUID, user_id: UUID
    ) -> Optional[AICoachConversation]:
        """
        Fetch a conversation by primary key and owner, eagerly loading messages.
        Returns None when not found or belongs to a different user.
        """
        stmt = (
            select(AICoachConversation)
            .where(
                AICoachConversation.id == conversation_id,
                AICoachConversation.user_id == user_id,
            )
            .options(selectinload(AICoachConversation.messages))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_conversations(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> Sequence[AICoachConversation]:
        """
        Return the user conversations ordered newest-first.
        Messages are NOT eagerly loaded here — use for the summary list.
        """
        stmt = (
            select(AICoachConversation)
            .where(AICoachConversation.user_id == user_id)
            .order_by(AICoachConversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete_conversation(
        self, conversation_id: UUID, user_id: UUID
    ) -> bool:
        """
        Hard-delete a conversation (cascades to messages).
        Returns True when a row was deleted, False if not found / unauthorized.
        """
        conv = await self.get_conversation(conversation_id, user_id)
        if not conv:
            return False
        await self.delete(conv)
        return True

    # ── Message helpers ────────────────────────────────────────────────────────

    async def add_message(
        self,
        conversation_id: UUID,
        user_id: UUID,
        role: str,
        content: str,
        intent: Optional[str] = None,
        context_snapshot_json: Optional[dict] = None,
    ) -> AICoachMessage:
        """Persist a single AI Coach message and flush."""
        instance = AICoachMessage(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content,
            intent=intent,
            context_snapshot_json=context_snapshot_json,
        )
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_recent_messages(
        self, conversation_id: UUID, limit: int = 20
    ) -> Sequence[AICoachMessage]:
        """Return the most-recent messages for context-window construction."""
        stmt = (
            select(AICoachMessage)
            .where(AICoachMessage.conversation_id == conversation_id)
            .order_by(AICoachMessage.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        # Reverse so chronological order is preserved for the LLM
        return list(reversed(result.scalars().all()))

    async def count_messages(self, conversation_id: UUID) -> int:
        """Return total messages in a conversation."""
        stmt = select(func.count()).where(
            AICoachMessage.conversation_id == conversation_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
