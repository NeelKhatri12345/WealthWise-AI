"""
WealthWise AI - AI Coach Routes (Phase 1: CRUD foundation)

Endpoints:
  POST   /api/v1/ai-coach/conversations
  GET    /api/v1/ai-coach/conversations
  GET    /api/v1/ai-coach/conversations/{conversation_id}
  POST   /api/v1/ai-coach/conversations/{conversation_id}/messages
  DELETE /api/v1/ai-coach/conversations/{conversation_id}
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_ai_coach_repository, get_current_active_user, get_ai_coach_service
from app.repositories.ai_coach_repository import AICoachRepository
from app.schemas.ai_coach_schema import (
    AICoachMessageResponse,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    CreateConversationRequest,
    SendMessageRequest,
    SendMessageResponse,
)
from app.schemas.base_schema import APIResponse

router = APIRouter()


@router.post(
    "/conversations",
    response_model=APIResponse[ConversationDetailResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new AI Coach conversation",
)
async def create_conversation(
    body: CreateConversationRequest,
    current_user=Depends(get_current_active_user),
    repo: AICoachRepository = Depends(get_ai_coach_repository),
):
    conv = await repo.create_conversation(
        user_id=current_user.id, title=body.title
    )
    return APIResponse(
        success=True,
        message="Conversation created",
        data=ConversationDetailResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=[],
        ),
    )


@router.get(
    "/conversations",
    response_model=APIResponse[list[ConversationSummaryResponse]],
    summary="List all conversations for the authenticated user",
)
async def list_conversations(
    skip: int = 0,
    limit: int = 20,
    current_user=Depends(get_current_active_user),
    repo: AICoachRepository = Depends(get_ai_coach_repository),
):
    convs = await repo.list_conversations(
        user_id=current_user.id, skip=skip, limit=limit
    )
    summaries = [
        ConversationSummaryResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=await repo.count_messages(c.id),
        )
        for c in convs
    ]
    return APIResponse(
        success=True,
        message="Conversations retrieved",
        data=summaries,
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=APIResponse[ConversationDetailResponse],
    summary="Get a conversation with all messages",
)
async def get_conversation(
    conversation_id: UUID,
    current_user=Depends(get_current_active_user),
    repo: AICoachRepository = Depends(get_ai_coach_repository),
):
    conv = await repo.get_conversation(conversation_id, current_user.id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return APIResponse(
        success=True,
        message="Conversation retrieved",
        data=ConversationDetailResponse(
            id=conv.id,
            user_id=conv.user_id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=[
                AICoachMessageResponse(
                    id=m.id,
                    conversation_id=m.conversation_id,
                    user_id=m.user_id,
                    role=m.role,
                    content=m.content,
                    intent=m.intent,
                    created_at=m.created_at,
                )
                for m in conv.messages
            ],
        ),
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=APIResponse[SendMessageResponse],
    summary="Send a message and receive the AI Coach reply",
    description=(
        "Persists the user message, classifies intent, builds financial context, "
        "calls the AI provider, and returns both user and assistant messages."
    ),
)
async def send_message(
    conversation_id: UUID,
    body: SendMessageRequest,
    current_user=Depends(get_current_active_user),
    service=Depends(get_ai_coach_service),
    repo: AICoachRepository = Depends(get_ai_coach_repository),
):
    from app.services.ai_coach_service import AICoachService
    from app.schemas.ai_coach_schema import AIChatRequest

    conv = await repo.get_conversation(conversation_id, current_user.id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Call Phase 2 Service
    chat_req = AIChatRequest(message=body.content, conversation_id=conversation_id)
    chat_resp = await service.chat(user_id=current_user.id, request=chat_req)

    # Automatically generate conversation titles after the user's first message instead of generic names.
    message_count = await repo.count_messages(conversation_id)
    if message_count <= 2 and (conv.title == "New Conversation" or not conv.title):
        title_text = body.content.strip()
        if len(title_text) > 40:
            title_text = title_text[:37] + "..."
        conv.title = title_text

    # Retrieve the persisted user and assistant messages
    # Since chat() persisted user message and assistant message, the last two messages in the conversation are what we want.
    messages = await repo.get_recent_messages(conversation_id, limit=2)
    user_msg = next((m for m in messages if m.role == "user"), None)
    assistant_msg = next((m for m in messages if m.role == "assistant"), None)

    if not user_msg or not assistant_msg:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve persisted chat messages",
        )

    return APIResponse(
        success=True,
        message="Message processed",
        data=SendMessageResponse(
            conversation_id=conversation_id,
            user_message=AICoachMessageResponse(
                id=user_msg.id,
                conversation_id=user_msg.conversation_id,
                user_id=user_msg.user_id,
                role=user_msg.role,
                content=user_msg.content,
                intent=user_msg.intent,
                created_at=user_msg.created_at,
            ),
            assistant_message=AICoachMessageResponse(
                id=assistant_msg.id,
                conversation_id=assistant_msg.conversation_id,
                user_id=assistant_msg.user_id,
                role=assistant_msg.role,
                content=assistant_msg.content,
                intent=assistant_msg.intent,
                created_at=assistant_msg.created_at,
            ),
        ),
    )



@router.delete(
    "/conversations/{conversation_id}",
    response_model=APIResponse[None],
    summary="Delete a conversation and all its messages",
)
async def delete_conversation(
    conversation_id: UUID,
    current_user=Depends(get_current_active_user),
    repo: AICoachRepository = Depends(get_ai_coach_repository),
):
    deleted = await repo.delete_conversation(conversation_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return APIResponse(success=True, message="Conversation deleted")
