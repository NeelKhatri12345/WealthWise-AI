"""
WealthWise AI - Investment Recommendation Routes

Endpoints:
  POST  /api/v1/investments/recommendation/calculate
  GET   /api/v1/investments/recommendation/latest
  GET   /api/v1/investments/recommendation/history
  GET   /api/v1/investments/product-suggestions
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    get_current_active_user,
    get_investment_recommendation_service,
    get_product_recommendation_service,
    get_admin_user,
    get_market_sync_service,
)
from app.schemas.base_schema import APIResponse
from typing import Optional

router = APIRouter()


@router.post(
    "/recommendation/calculate",
    response_model=APIResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Calculate and persist a new Investment Plan",
    description=(
        "Reads the latest Health Score Snapshot, Risk Profile, Financial Profile, "
        "and Transaction metrics. Generates all three strategies (Conservative / "
        "Balanced / Aggressive) and selects the recommended one using financial "
        "safety rules. Persists and returns the result. "
        "No specific products, stocks, or funds are recommended."
    ),
)
async def calculate_recommendation(
    current_user=Depends(get_current_active_user),
    service=Depends(get_investment_recommendation_service),
):
    try:
        snapshot = await service.calculate(user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    return APIResponse(
        success=True,
        message="Investment recommendation calculated successfully",
        data=snapshot,
    )


@router.get(
    "/recommendation/latest",
    response_model=APIResponse[dict | None],
    summary="Fetch the latest Investment Plan snapshot",
)
async def get_latest_recommendation(
    current_user=Depends(get_current_active_user),
    service=Depends(get_investment_recommendation_service),
):
    snapshot = await service.get_latest(user_id=current_user.id)
    return APIResponse(
        success=True,
        message="Latest investment recommendation retrieved" if snapshot else "No recommendation found",
        data=snapshot,
    )


@router.get(
    "/recommendation/history",
    response_model=APIResponse[list],
    summary="List Investment Plan history",
)
async def get_recommendation_history(
    limit: int = 10,
    current_user=Depends(get_current_active_user),
    service=Depends(get_investment_recommendation_service),
):
    history = await service.get_history(user_id=current_user.id, limit=limit)
    return APIResponse(
        success=True,
        message=f"{len(history)} recommendation(s) retrieved",
        data=history,
    )


@router.get(
    "/product-suggestions",
    response_model=APIResponse[dict],
    summary="Get ranked product suggestions for the latest Investment Plan",
    description=(
        "Returns deterministic, ranked product suggestions per allocation category "
        "based on the user's latest investment recommendation snapshot. "
        "Products are scored using a 7-signal weighted algorithm: risk alignment, "
        "strategy fit, health score, goal match, investment horizon, income stability, "
        "and age suitability. "
        "No AI is used. All recommendations are rule-based and reproducible. "
        "In Milestone 1, market_data is null (static catalog). "
        "In Milestone 2+, market_data is populated with live provider data."
    ),
)
async def get_product_suggestions(
    sort_by: Optional[str] = None,
    provider: Optional[str] = None,
    current_user=Depends(get_current_active_user),
    service=Depends(get_product_recommendation_service),
):
    try:
        suggestions = await service.get_product_suggestions(
            user_id=current_user.id, sort_by=sort_by, provider=provider
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    return APIResponse(
        success=True,
        message="Product suggestions retrieved successfully",
        data=suggestions,
    )


@router.post(
    "/market/sync",
    response_model=APIResponse[dict],
    summary="Trigger market metadata sync (Admin only)",
    description="Fetches live/mock market metrics for all products and populates the cache.",
)
async def trigger_market_sync(
    current_user=Depends(get_admin_user),
    sync_service=Depends(get_market_sync_service),
):
    result = await sync_service.refresh_all()
    return APIResponse(
        success=True,
        message="Market metadata sync completed successfully",
        data=result,
    )


@router.get(
    "/market/status",
    response_model=APIResponse[dict],
    summary="Check market metadata cache status (Admin only)",
    description="Returns stats and parameters of the market intelligence cache layer.",
)
async def check_market_status(
    current_user=Depends(get_admin_user),
    sync_service=Depends(get_market_sync_service),
):
    status_data = sync_service.get_sync_status()
    return APIResponse(
        success=True,
        message="Market cache status retrieved successfully",
        data=status_data,
    )


