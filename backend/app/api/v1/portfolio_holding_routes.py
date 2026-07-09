"""
WealthWise AI - Portfolio Holding Routes

Manual investment holdings CRUD (Portfolio Module Milestone 1).
All routes are JWT-protected via ``get_current_active_user`` and scoped to
the authenticated user.

Independent of the AI-driven /portfolio/recommendations and /portfolio/generate
endpoints (see portfolio_routes.py) — this router owns the base "/portfolio"
collection paths under the same "/portfolio" prefix.

GET    /portfolio        → List holdings for the authenticated user
GET    /portfolio/{id}   → Get a single holding
POST   /portfolio        → Create a holding
PUT    /portfolio/{id}   → Update a holding
DELETE /portfolio/{id}   → Delete a holding
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_active_user, get_portfolio_holding_service
from app.schemas.base_schema import APIResponse
from app.schemas.portfolio_holding_schema import (
    PortfolioHoldingCreateRequest,
    PortfolioHoldingResponse,
    PortfolioHoldingUpdateRequest,
)
from app.services.portfolio_holding_service import PortfolioHoldingService

router = APIRouter()


@router.get(
    "/",
    response_model=APIResponse[List[PortfolioHoldingResponse]],
    summary="List portfolio holdings for the current user",
)
async def list_portfolio_holdings(
    current_user=Depends(get_current_active_user),
    service: PortfolioHoldingService = Depends(get_portfolio_holding_service),
):
    holdings = await service.list_holdings(current_user.id)
    return APIResponse(
        success=True,
        message=f"{len(holdings)} holding(s) retrieved",
        data=holdings,
    )


@router.get(
    "/{holding_id}",
    response_model=APIResponse[PortfolioHoldingResponse],
    summary="Get a portfolio holding by ID",
)
async def get_portfolio_holding(
    holding_id: UUID,
    current_user=Depends(get_current_active_user),
    service: PortfolioHoldingService = Depends(get_portfolio_holding_service),
):
    holding = await service.get_holding(holding_id, current_user.id)
    return APIResponse(success=True, message="Holding retrieved", data=holding)


@router.post(
    "/",
    response_model=APIResponse[PortfolioHoldingResponse],
    status_code=201,
    summary="Create a portfolio holding",
)
async def create_portfolio_holding(
    payload: PortfolioHoldingCreateRequest,
    current_user=Depends(get_current_active_user),
    service: PortfolioHoldingService = Depends(get_portfolio_holding_service),
):
    holding = await service.create_holding(payload, current_user.id)
    return APIResponse(success=True, message="Holding created", data=holding)


@router.put(
    "/{holding_id}",
    response_model=APIResponse[PortfolioHoldingResponse],
    summary="Update a portfolio holding",
)
async def update_portfolio_holding(
    holding_id: UUID,
    payload: PortfolioHoldingUpdateRequest,
    current_user=Depends(get_current_active_user),
    service: PortfolioHoldingService = Depends(get_portfolio_holding_service),
):
    holding = await service.update_holding(holding_id, payload, current_user.id)
    return APIResponse(success=True, message="Holding updated", data=holding)


@router.delete(
    "/{holding_id}",
    response_model=APIResponse[None],
    summary="Delete a portfolio holding",
)
async def delete_portfolio_holding(
    holding_id: UUID,
    current_user=Depends(get_current_active_user),
    service: PortfolioHoldingService = Depends(get_portfolio_holding_service),
):
    await service.delete_holding(holding_id, current_user.id)
    return APIResponse(success=True, message="Holding deleted")
