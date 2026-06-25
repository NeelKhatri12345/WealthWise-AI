"""WealthWise AI - AI Coach Routes"""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import get_ai_coach_service, get_current_active_user
from app.schemas.ai_schema import AIChatRequest, AIChatResponse, ConversationHistoryResponse
from app.schemas.base_schema import APIResponse
from app.services.ai_coach_service import AICoachService

router = APIRouter()


@router.post("/chat", response_model=APIResponse[AIChatResponse], summary="Send a message to the AI financial coach")
async def chat(
    request: AIChatRequest,
    current_user=Depends(get_current_active_user),
    service: AICoachService = Depends(get_ai_coach_service),
):
    response = await service.chat(current_user.id, request)
    return APIResponse(success=True, message="AI response received", data=response)


@router.get("/history/{session_id}", response_model=APIResponse[ConversationHistoryResponse], summary="Get conversation history for a session")
async def get_history(
    session_id: UUID,
    current_user=Depends(get_current_active_user),
    service: AICoachService = Depends(get_ai_coach_service),
):
    history = await service.get_history(current_user.id, session_id)
    return APIResponse(success=True, message="History retrieved", data=history)


@router.delete("/session/{session_id}", response_model=APIResponse[None], summary="Delete an AI conversation session")
async def delete_session(
    session_id: UUID,
    current_user=Depends(get_current_active_user),
    service: AICoachService = Depends(get_ai_coach_service),
):
    deleted = await service.delete_session(current_user.id, session_id)
    return APIResponse(success=True, message=f"Deleted {deleted} messages from session")
