"""
WealthWise AI - AI Advisor Routes
"""

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_active_user, get_ai_advisor_service
from app.schemas.ai_advisor_schema import AIAdvisorQueryRequest, AIAdvisorAdviceResponse
from app.schemas.base_schema import APIResponse
from app.services.ai_advisor_service import AIAdvisorService

router = APIRouter()


@router.post(
    "/query",
    response_model=APIResponse[AIAdvisorAdviceResponse],
    status_code=status.HTTP_200_OK,
    summary="Ask a query to the AI Advisor",
    description="Invokes the advisor explainability layer based on user context.",
)
async def query_advisor(
    body: AIAdvisorQueryRequest,
    current_user=Depends(get_current_active_user),
    service: AIAdvisorService = Depends(get_ai_advisor_service),
):
    advice = await service.get_advice(user_id=current_user.id, question=body.question)
    return APIResponse(
        success=True,
        message="AI Advisor recommendations successfully generated",
        data=advice,
    )
