"""
WealthWise AI - AI Coach Service (Phase 2)

Orchestrates the full AI coaching pipeline:

  1. Classify intent (guardrail pre-check)
  2. Short-circuit out-of-scope questions
  3. Build user financial context (ContextBuilder)
  4. Build enriched, safety-aware prompt (PromptBuilder)
  5. Call AI provider (Gemini or rule-based fallback)
  6. Post-process response through guardrails
  7. Persist conversation to DB (AICoachRepository)
  8. Return structured AIChatResponse

Conversation management:
  - New session: create_conversation → UUID
  - Existing session: load messages for history context
  - Each turn persists user + assistant messages
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID, uuid4

from app.core.logger import logger
from app.repositories.ai_coach_repository import AICoachRepository
from app.schemas.ai_coach_schema import (
    AIChatRequest,
    AIChatResponse,
    ConversationHistoryResponse,
    ConversationMessageSchema,
    ConversationListItem,
    ConversationListResponse,
)
from app.services.ai_prompt_builder import AIPromptBuilder
from app.services.ai_provider_service import AIProviderService
from app.services.ai_response_guardrail_service import (
    AIResponseGuardrailService,
    OUT_OF_SCOPE_REPLY,
)
from app.services.financial_context_builder import FinancialContextBuilder


class AICoachService:
    """
    High-level orchestrator for the AI Coach chat flow.

    Constructor receives all collaborators via dependency injection
    to keep the service fully testable without a live DB or AI API.
    """

    def __init__(
        self,
        ai_coach_repo: AICoachRepository,
        context_builder: FinancialContextBuilder,
        prompt_builder: AIPromptBuilder,
        provider_service: AIProviderService,
        guardrail_service: type[AIResponseGuardrailService] = AIResponseGuardrailService,
    ) -> None:
        self._repo = ai_coach_repo
        self._ctx_builder = context_builder
        self._prompt_builder = prompt_builder
        self._provider = provider_service
        self._guardrail = guardrail_service

    # ── Chat ──────────────────────────────────────────────────────────────────

    async def chat(
        self,
        user_id: UUID,
        request: AIChatRequest,
    ) -> AIChatResponse:
        """
        Process one user message and return the AI coach reply.

        Pipeline:
          classify intent → context → prompt → AI call → guardrail → persist
        """
        user_message = request.message.strip()

        # ── Step 1: Pre-classify intent ──────────────────────────────────────
        intent = self._guardrail.classify_intent(user_message)
        logger.info(
            "AI Coach: intent classified",
            extra={"user_id": str(user_id), "intent": intent},
        )

        # ── Step 2: Out-of-scope short-circuit ───────────────────────────────
        if intent == "out_of_scope":
            conversation_id = await self._resolve_conversation(
                user_id, request.conversation_id
            )
            await self._persist_turn(
                user_id, conversation_id, user_message, OUT_OF_SCOPE_REPLY, intent
            )
            return AIChatResponse(
                reply=OUT_OF_SCOPE_REPLY,
                conversation_id=conversation_id,
                intent=intent,
                tokens_used=None,
                model_version="rule-based",
                provider=self._provider.provider_name,
            )

        # ── Step 3: Build financial context ──────────────────────────────────
        ctx = await self._ctx_builder.build(user_id)

        # ── Step 4: Resolve / create conversation & load history ─────────────
        conversation_id = await self._resolve_conversation(
            user_id, request.conversation_id
        )
        history_messages = await self._repo.get_recent_messages(
            conversation_id, limit=12
        )
        history_dicts = [
            {"role": m.role, "content": m.content} for m in history_messages
        ]
        history_summary = self._prompt_builder.condense_history(history_dicts)

        # ── Step 5: Build prompt ─────────────────────────────────────────────
        system_prompt = self._prompt_builder.build_system_prompt(ctx)

        # ── Step 6: Call AI provider ─────────────────────────────────────────
        raw_reply, tokens_used = await self._provider.generate(
            system_prompt=system_prompt,
            history=history_dicts,
            user_message=user_message,
            intent=intent,
            ctx=ctx,
        )

        # ── Step 7: Post-process through guardrails ──────────────────────────
        final_reply = self._guardrail.sanitise_response(raw_reply, intent)

        # ── Step 8: Persist conversation turn ───────────────────────────────
        await self._persist_turn(
            user_id, conversation_id, user_message, final_reply, intent
        )

        model_version = self._provider.model_name if tokens_used else "rule-based"

        logger.info(
            "AI Coach: response generated",
            extra={
                "user_id": str(user_id),
                "conversation_id": str(conversation_id),
                "intent": intent,
                "tokens": tokens_used,
                "provider": self._provider.provider_name,
            },
        )

        return AIChatResponse(
            reply=final_reply,
            conversation_id=conversation_id,
            intent=intent,
            tokens_used=tokens_used,
            model_version=model_version,
            provider=self._provider.provider_name,
        )

    # ── Conversation management ───────────────────────────────────────────────

    async def list_conversations(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> ConversationListResponse:
        """Return a paginated list of the user's conversations."""
        convs = await self._repo.list_conversations(user_id, skip=skip, limit=limit)
        return ConversationListResponse(
            conversations=[
                ConversationListItem(
                    id=c.id,
                    title=c.title,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                    message_count=0,  # avoid extra query on list view
                )
                for c in convs
            ],
            total=len(convs),
        )

    async def get_conversation_history(
        self, user_id: UUID, conversation_id: UUID
    ) -> ConversationHistoryResponse:
        """Return all messages in a conversation (ownership verified)."""
        conv = await self._repo.get_conversation(conversation_id, user_id)
        if not conv:
            return ConversationHistoryResponse(
                conversation_id=conversation_id,
                messages=[],
                total_messages=0,
            )
        messages = [
            ConversationMessageSchema(
                id=m.id,
                role=m.role,
                content=m.content,
                intent=m.intent,
                created_at=m.created_at,
            )
            for m in (conv.messages or [])
        ]
        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=messages,
            total_messages=len(messages),
        )

    async def delete_conversation(self, user_id: UUID, conversation_id: UUID) -> bool:
        """Hard-delete a conversation and its messages. Returns True if deleted."""
        return await self._repo.delete_conversation(conversation_id, user_id)

    async def create_conversation(
        self, user_id: UUID, title: str = "New Conversation"
    ) -> UUID:
        """Explicitly create a new conversation and return its ID."""
        conv = await self._repo.create_conversation(user_id, title)
        return conv.id

    # ── Private helpers ───────────────────────────────────────────────────────

    async def _resolve_conversation(
        self,
        user_id: UUID,
        conversation_id: Optional[UUID],
    ) -> UUID:
        """
        If conversation_id is provided and belongs to the user, use it.
        Otherwise create a new conversation.
        """
        if conversation_id:
            conv = await self._repo.get_conversation(conversation_id, user_id)
            if conv:
                return conv.id
        # Create new
        conv = await self._repo.create_conversation(user_id)
        return conv.id

    async def _persist_turn(
        self,
        user_id: UUID,
        conversation_id: UUID,
        user_message: str,
        assistant_reply: str,
        intent: str,
    ) -> None:
        """Persist user message then assistant reply to the DB."""
        try:
            await self._repo.add_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="user",
                content=user_message,
                intent=intent,
            )
            await self._repo.add_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role="assistant",
                content=assistant_reply,
                intent=intent,
            )
        except Exception as exc:
            logger.error(
                "AI Coach: failed to persist conversation turn",
                exc_info=exc,
            )
