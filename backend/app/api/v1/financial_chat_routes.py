"""
WealthWise AI - Financial Chat Routes

Endpoints:
  POST /api/v1/financial-chat/start               — Start a new chat session
  POST /api/v1/financial-chat/retake              — Retake the assessment (archive + reset + new session)
  POST /api/v1/financial-chat/{session_id}/message — Send a user message
  GET  /api/v1/financial-chat/{session_id}         — Get session + all messages
"""

from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_current_active_user,
    get_financial_chat_service,
)
from app.schemas.base_schema import APIResponse
from app.schemas.financial_chat_schema import (
    ChatSessionResponse,
    RetakeChatResponse,
    SendMessageRequest,
    SendMessageResponse,
    StartChatResponse,
)
from app.services.financial_chat_service import FinancialChatService

router = APIRouter()


@router.post(
    "/start",
    response_model=APIResponse[StartChatResponse],
    summary="Start a financial profile chat session",
    description=(
        "Creates a new guided chat session for the authenticated user. "
        "Requires at least one accepted transaction to exist. "
        "Returns the first assistant question."
    ),
)
async def start_financial_chat(
    current_user=Depends(get_current_active_user),
    service: FinancialChatService = Depends(get_financial_chat_service),
):
    result = await service.start_session(user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Financial profile chat session started",
        data=result,
    )


@router.post(
    "/retake",
    response_model=APIResponse[RetakeChatResponse],
    summary="Retake the financial profile assessment",
    description=(
        "Archives the user's current active or completed chat session, "
        "resets all financial profile fields to null, and starts a brand-new "
        "session at Step 0. Returns the fresh session state together with the "
        "initial assistant message — no follow-up GET call required."
    ),
)
async def retake_assessment(
    current_user=Depends(get_current_active_user),
    service: FinancialChatService = Depends(get_financial_chat_service),
):
    result = await service.retake_assessment(user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Assessment reset. Starting fresh financial profile.",
        data=result,
    )


@router.post(
    "/{session_id}/message",
    response_model=APIResponse[SendMessageResponse],
    summary="Send a message in the financial profile chat",
    description=(
        "Accepts the user's free-text reply, extracts structured profile fields, "
        "advances the step counter, and returns the next assistant question."
    ),
)
async def send_chat_message(
    session_id: UUID,
    body: SendMessageRequest,
    current_user=Depends(get_current_active_user),
    service: FinancialChatService = Depends(get_financial_chat_service),
):
    result = await service.send_message(
        session_id=session_id,
        user_id=current_user.id,
        user_text=body.message,
    )
    return APIResponse(
        success=True,
        message="Message processed",
        data=result,
    )


@router.post(
    "/{session_id}/previous",
    response_model=APIResponse[SendMessageResponse],
    summary="Go to previous step in financial profile chat",
    description="Moves the chat session back by 1 step, allowing correction and preserving other profile data.",
)
async def previous_chat_step(
    session_id: UUID,
    current_user=Depends(get_current_active_user),
    service: FinancialChatService = Depends(get_financial_chat_service),
):
    result = await service.go_to_previous_step(
        session_id=session_id,
        user_id=current_user.id,
    )
    return APIResponse(
        success=True,
        message="Moved to previous step",
        data=result,
    )


@router.get(
    "/{session_id}",
    response_model=APIResponse[ChatSessionResponse],
    summary="Get a chat session with all messages",
)
async def get_chat_session(
    session_id: UUID,
    current_user=Depends(get_current_active_user),
    service: FinancialChatService = Depends(get_financial_chat_service),
):
    result = await service.get_session(
        session_id=session_id, user_id=current_user.id
    )
    return APIResponse(
        success=True,
        message="Chat session retrieved",
        data=result,
    )
