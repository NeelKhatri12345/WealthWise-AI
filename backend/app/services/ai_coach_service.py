"""WealthWise AI - AI Coach Service"""

from uuid import UUID, uuid4

from app.clients.gemini_client import GeminiClient
from app.core.constants import AI_COACH_MAX_HISTORY_MESSAGES, AI_COACH_SYSTEM_PROMPT
from app.core.logger import logger
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.ai_schema import (
    AIChatRequest,
    AIChatResponse,
    ConversationHistoryResponse,
    ConversationMessageSchema,
)


class AICoachService:

    def __init__(
        self,
        analytics_repo: AnalyticsRepository,
        gemini_client: GeminiClient,
    ) -> None:
        self._repo = analytics_repo
        self._gemini = gemini_client

    async def chat(
        self,
        user_id: UUID,
        request: AIChatRequest,
    ) -> AIChatResponse:
        """
        Process a user message and return AI coach reply.
        1. Determine or create session
        2. Load conversation history for context
        3. Build enriched system prompt with user's financial context
        4. Call Gemini API
        5. Persist both user message and assistant reply
        """
        session_id = request.session_id or uuid4()

        # Retrieve conversation history for context window
        history = await self._repo.get_conversation_history(
            user_id, session_id, limit=AI_COACH_MAX_HISTORY_MESSAGES
        )

        # Build Gemini history format
        gemini_history = [
            {"role": msg.role, "parts": [{"text": msg.message}]} for msg in history
        ]

        # Enrich system prompt with financial context
        system_prompt = await self._build_system_prompt(user_id)

        # Call Gemini
        reply, tokens_used = await self._gemini.generate(
            system_prompt=system_prompt,
            history=gemini_history,
            user_message=request.message,
        )

        # Persist user message
        await self._repo.save_ai_message(
            {
                "user_id": user_id,
                "session_id": session_id,
                "role": "user",
                "message": request.message,
            }
        )

        # Persist assistant reply
        await self._repo.save_ai_message(
            {
                "user_id": user_id,
                "session_id": session_id,
                "role": "assistant",
                "message": reply,
                "tokens_used": tokens_used,
                "model_version": "gemini-2.5-flash",
            }
        )

        logger.info(
            "AI coach interaction",
            extra={
                "user_id": str(user_id),
                "session_id": str(session_id),
                "tokens": tokens_used,
            },
        )

        return AIChatResponse(
            reply=reply,
            session_id=session_id,
            tokens_used=tokens_used,
            model_version="gemini-2.5-flash",
        )

    async def get_history(
        self,
        user_id: UUID,
        session_id: UUID,
    ) -> ConversationHistoryResponse:
        messages = await self._repo.get_conversation_history(user_id, session_id)
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=[
                ConversationMessageSchema(
                    id=msg.id,
                    role=msg.role,
                    message=msg.message,
                    created_at=msg.created_at,
                )
                for msg in messages
            ],
            total_messages=len(messages),
        )

    async def delete_session(self, user_id: UUID, session_id: UUID) -> int:
        return await self._repo.delete_session(user_id, session_id)

    async def _build_system_prompt(self, user_id: UUID) -> str:
        """Enrich base system prompt with user's financial snapshot."""
        context_lines = [AI_COACH_SYSTEM_PROMPT]

        try:
            health = await self._repo.get_latest_health_score(user_id)
            if health:
                context_lines.append(
                    f"\nUser's current financial health score: {health.overall_score}/100. "
                    f"Savings rate: {health.savings_rate}%."
                )

            risk = await self._repo.get_latest_risk_profile(user_id)
            if risk:
                context_lines.append(
                    f"User's risk profile: {risk.risk_level.value} "
                    f"(confidence: {risk.confidence})."
                )
        except Exception as exc:
            logger.warning(
                "Failed to load financial context for AI prompt", exc_info=exc
            )

        return "\n".join(context_lines)
