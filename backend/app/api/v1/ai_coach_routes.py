"""
WealthWise AI - AI Coach Routes

Endpoints:
  POST   /api/v1/ai-coach/conversations
  GET    /api/v1/ai-coach/conversations
  GET    /api/v1/ai-coach/conversations/{conversation_id}
  POST   /api/v1/ai-coach/conversations/{conversation_id}/messages
  DELETE /api/v1/ai-coach/conversations/{conversation_id}

  POST   /api/v1/ai-coach/analyze   — compute FinancialSummary from a statement
  POST   /api/v1/ai-coach/chat      — stateless Gemini coaching (no DB writes)
"""


from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    get_ai_coach_repository,
    get_ai_coach_service,
    get_current_active_user,
    get_financial_analysis_service,
    get_health_score_snapshot_repository,
    get_analytics_service,
)
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
from app.schemas.financial_analysis_schema import (
    AnalyzeStatementRequest,
    ChatRequest,
)
from app.services.financial_analysis_service import FinancialAnalysisService

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


# ── Financial-analysis-based endpoints ──────────────────────────────────────


@router.post(
    "/analyze",
    summary="Analyze a completed statement and return a FinancialSummary",
    description=(
        "Reads the already-extracted transaction data stored in the statement's "
        "processing_metadata.extracted_data field, normalizes the rows, and computes "
        "a rich FinancialSummary. No Docling re-extraction or OCR is performed."
    ),
)
async def analyze_statement(
    body: AnalyzeStatementRequest,
    current_user=Depends(get_current_active_user),
    analysis_service: FinancialAnalysisService = Depends(get_financial_analysis_service),
    snapshot_repo=Depends(get_health_score_snapshot_repository),
    analytics_service=Depends(get_analytics_service),
):
    from app.schemas.financial_analysis_schema import AnalyzeStatementResponse

    # Fetch user's latest health score from the single source of truth (snapshot or shared analytics service)
    health_score_val = 0
    try:
        snapshot = await snapshot_repo.get_latest_by_user(current_user.id)
        if snapshot:
            health_score_val = int(round(snapshot.score))
        else:
            score_detail = await analytics_service.get_latest_health_score(current_user.id)
            health_score_val = int(round(score_detail.score))
    except Exception:
        try:
            score_detail = await analytics_service.get_health_score_by_statement(
                current_user.id, body.statement_id
            )
            health_score_val = int(round(score_detail.score))
        except Exception:
            health_score_val = 0

    summary = await analysis_service.analyze_statement(
        statement_id=body.statement_id,
        user_id=current_user.id,
        health_score=health_score_val,
    )
    return APIResponse(
        success=True,
        message="Financial analysis complete",
        data=AnalyzeStatementResponse(summary=summary).model_dump(),
    )


@router.post(
    "/chat",
    summary="Stateless AI coaching — send financial summary + question, get Gemini response",
    description=(
        "Accepts a FinancialSummary dict (from /analyze) and a user question. "
        "Builds a context-aware Gemini prompt and returns the AI reply. "
        "Stateless — no conversation history is stored in the database."
    ),
)
async def chat(
    body: ChatRequest,
    current_user=Depends(get_current_active_user),
):
    from app.schemas.financial_analysis_schema import ChatResponse
    from app.clients.gemini_client import GeminiClient
    from app.core.config import get_settings
    import json as _json

    cfg = get_settings()

    # ── Build system prompt ───────────────────────────────────────────────────
    system_prompt = (
        "You are WealthWise AI, a professional and empathetic personal finance assistant. "
        "Your sole job is to help users understand their own financial data and make better decisions.\n\n"
        "STRICT REPLY LENGTH & STYLE CONSTRAINTS:\n"
        "• Maximum 150 words (prefer 80–120 words).\n"
        "• Answer ONLY the user's question.\n"
        "• Do not repeat the financial summary.\n"
        "• Do not restate all metrics; mention only the metrics relevant to the question.\n"
        "• Use bullet points wherever possible.\n"
        "• Avoid long/unnecessary introductions or motivational/fluff paragraphs.\n"
        "• Finish with at most one optional follow-up question.\n\n"
        "You MUST:\n"
        "• Use ONLY the financial summary provided — never invent transactions or figures.\n"
        "• Cite specific numbers from the summary when making observations.\n"
        "• Give clear, actionable advice (budgeting, savings targets, investment habits).\n"
        "• Explain financial concepts in plain language.\n"
        "• Encourage emergency fund building, insurance, and regular investing.\n"
        "• Detect and highlight overspending, recurring costs, and risky patterns.\n\n"
        "You MUST NOT:\n"
        "• Recommend specific stocks, crypto, or fixed-return guarantees.\n"
        "• Provide tax advice or legal opinions.\n"
        "• Hallucinate data, percentages, or transaction details not in the summary.\n"
        "• Give predictions about market performance.\n\n"
        "If the user asks about something not covered by the financial summary, say so clearly and "
        "offer to help with what IS available.\n\n"
        f"Currency: {body.currency}"
    )

    # ── Format the financial context into the user message ────────────────────
    summary_text = _json.dumps(body.financial_summary, indent=2, default=str)
    period_info = ""
    period = body.financial_summary.get("statement_period")
    if period:
        start = period.get("start", "")
        end   = period.get("end", "")
        if start and end:
            period_info = f"\nStatement period: {start} to {end}"

    user_message = (
        f"Here is my financial summary for this period:{period_info}\n\n"
        f"```json\n{summary_text}\n```\n\n"
        f"My question: {body.user_question}"
    )

    # ── Call Gemini ───────────────────────────────────────────────────────────
    gemini = GeminiClient(cfg)
    reply_text, tokens_used = await gemini.generate(
        system_prompt=system_prompt,
        history=[],          # Stateless — no conversation history
        user_message=user_message,
    )

    return APIResponse(
        success=True,
        message="AI response generated",
        data=ChatResponse(reply=reply_text, tokens_used=tokens_used).model_dump(),
    )

