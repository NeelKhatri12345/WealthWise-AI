"""WealthWise AI - Portfolio Routes"""

from fastapi import APIRouter, Depends

from app.core.dependencies import (get_current_active_user,
                                   get_portfolio_service)
from app.schemas.base_schema import APIResponse
from app.schemas.portfolio_schema import PortfolioRecommendationResponse
from app.services.portfolio_service import PortfolioService

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=APIResponse[PortfolioRecommendationResponse],
    summary="Get latest portfolio recommendations",
)
async def get_recommendations(
    current_user=Depends(get_current_active_user),
    service: PortfolioService = Depends(get_portfolio_service),
):
    portfolio = await service.get_recommendations(current_user.id)
    return APIResponse(success=True, message="Portfolio retrieved", data=portfolio)


@router.post(
    "/generate",
    response_model=APIResponse[PortfolioRecommendationResponse],
    status_code=201,
    summary="Generate new portfolio recommendations",
)
async def generate_recommendations(
    current_user=Depends(get_current_active_user),
    service: PortfolioService = Depends(get_portfolio_service),
):
    portfolio = await service.generate_recommendations(current_user.id)
    return APIResponse(
        success=True, message="Portfolio generated successfully", data=portfolio
    )
