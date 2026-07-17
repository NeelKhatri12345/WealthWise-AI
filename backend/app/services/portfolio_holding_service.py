"""
WealthWise AI - Portfolio Holding Service

Manages manually entered investment holdings (Portfolio Module Milestone 1).
Independent of the OCR/statement pipeline and the AI-driven Portfolio
recommendation feature — this is plain user-entered CRUD data with
server-calculated valuation fields.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence
from uuid import UUID

from app.exceptions.custom_exceptions import NotFoundException
from app.models.portfolio_holding import PortfolioHolding
from app.repositories.portfolio_holding_repository import PortfolioHoldingRepository
from app.schemas.portfolio_holding_schema import (
    PortfolioHoldingCreateRequest,
    PortfolioHoldingResponse,
    PortfolioHoldingUpdateRequest,
)

_TWO_PLACES = Decimal("0.01")
_FOUR_PLACES = Decimal("0.0001")


class PortfolioHoldingService:
    def __init__(self, holding_repo: PortfolioHoldingRepository) -> None:
        self._holding_repo = holding_repo

    async def list_holdings(self, user_id: UUID) -> Sequence[PortfolioHoldingResponse]:
        holdings = await self._holding_repo.get_by_user(user_id)
        return [PortfolioHoldingResponse.model_validate(h) for h in holdings]

    async def get_holding(self, holding_id: UUID, user_id: UUID) -> PortfolioHoldingResponse:
        holding = await self._get_owned_or_raise(holding_id, user_id)
        return PortfolioHoldingResponse.model_validate(holding)

    async def create_holding(
        self, payload: PortfolioHoldingCreateRequest, user_id: UUID
    ) -> PortfolioHoldingResponse:
        data = payload.model_dump()
        data["user_id"] = user_id
        data.update(
            self._calculate(
                payload.quantity, payload.average_buy_price, payload.current_price
            )
        )
        holding = await self._holding_repo.create(data)
        return PortfolioHoldingResponse.model_validate(holding)

    async def update_holding(
        self,
        holding_id: UUID,
        payload: PortfolioHoldingUpdateRequest,
        user_id: UUID,
    ) -> PortfolioHoldingResponse:
        holding = await self._get_owned_or_raise(holding_id, user_id)

        update_data = payload.model_dump(exclude_unset=True)
        quantity = update_data.get("quantity", holding.quantity)
        average_buy_price = update_data.get("average_buy_price", holding.average_buy_price)
        current_price = update_data.get("current_price", holding.current_price)

        update_data.update(self._calculate(quantity, average_buy_price, current_price))

        holding = await self._holding_repo.update(holding, update_data)
        return PortfolioHoldingResponse.model_validate(holding)

    async def delete_holding(self, holding_id: UUID, user_id: UUID) -> None:
        holding = await self._get_owned_or_raise(holding_id, user_id)
        await self._holding_repo.delete(holding)

    # ── Helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def _calculate(
        quantity: Decimal, average_buy_price: Decimal, current_price: Decimal
    ) -> dict:
        invested_value = (quantity * average_buy_price).quantize(
            _TWO_PLACES, rounding=ROUND_HALF_UP
        )
        current_value = (quantity * current_price).quantize(
            _TWO_PLACES, rounding=ROUND_HALF_UP
        )
        profit_loss = current_value - invested_value

        profit_loss_percentage = Decimal("0.0000")
        if invested_value != Decimal("0.00"):
            profit_loss_percentage = (
                (profit_loss / invested_value) * Decimal("100")
            ).quantize(_FOUR_PLACES, rounding=ROUND_HALF_UP)

        return {
            "invested_value": invested_value,
            "current_value": current_value,
            "profit_loss": profit_loss,
            "profit_loss_percentage": profit_loss_percentage,
        }

    async def _get_owned_or_raise(self, holding_id: UUID, user_id: UUID) -> PortfolioHolding:
        holding = await self._holding_repo.get_by_id_and_user(holding_id, user_id)
        if not holding:
            raise NotFoundException("Portfolio holding not found")
        return holding
