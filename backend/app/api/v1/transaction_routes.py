"""WealthWise AI - Transaction Routes"""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import (
    get_current_active_user,
    get_transaction_parser_service,
    get_transaction_repository,
    get_statement_repository,
)
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.base_schema import APIResponse
from app.schemas.transaction_schema import MonthlySummary, TransactionResponse, TransactionSyncRequest
from app.services.transaction_parser_service import TransactionParserService
from app.repositories.statement_repository import StatementRepository

router = APIRouter()


@router.get(
    "/",
    response_model=APIResponse[List[TransactionResponse]],
    summary="List transactions with optional filters",
)
async def list_transactions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    category: Optional[str] = Query(default=None),
    transaction_type: Optional[str] = Query(default=None, pattern="^(debit|credit)$"),
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    transactions = await repo.get_by_user_filtered(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        date_from=date_from,
        date_to=date_to,
        category=category,
        transaction_type=transaction_type,
    )
    return APIResponse(
        success=True,
        message="Transactions retrieved",
        data=[TransactionResponse.model_validate(t) for t in transactions],
    )


@router.get(
    "/statement/{statement_id}",
    response_model=APIResponse[List[TransactionResponse]],
    summary="Get parsed transactions for a statement",
)
async def get_transactions_by_statement(
    statement_id: UUID,
    current_user=Depends(get_current_active_user),
    service: TransactionParserService = Depends(get_transaction_parser_service),
):
    transactions = await service.get_transactions_for_statement(
        statement_id, current_user.id
    )
    return APIResponse(
        success=True,
        message=f"{len(transactions)} transaction(s) retrieved",
        data=[TransactionResponse.model_validate(t) for t in transactions],
    )


@router.put(
    "/statement/{statement_id}/sync",
    response_model=APIResponse[None],
    summary="Sync all transactions for a statement",
)
async def sync_statement_transactions(
    statement_id: UUID,
    payload: TransactionSyncRequest,
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
    stmt_repo: StatementRepository = Depends(get_statement_repository),
):
    from app.exceptions.custom_exceptions import NotFoundException
    statement = await stmt_repo.get(statement_id)
    if not statement or statement.user_id != current_user.id:
        raise NotFoundException("Statement not found")

    records = [
        {
            "user_id": current_user.id,
            "statement_id": statement_id,
            **item.model_dump()
        }
        for item in payload.transactions
    ]
    await repo.sync_statement_transactions(statement_id, records)
    return APIResponse(success=True, message="Transactions synced successfully")


@router.get(
    "/summary",
    response_model=APIResponse[MonthlySummary],
    summary="Get monthly transaction summary",
)
async def monthly_summary(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    raw = await repo.get_monthly_aggregates(current_user.id, year, month)
    # Build summary from raw aggregates
    total_credits = Decimal("0")
    total_debits = Decimal("0")
    count = 0
    categories = {}
    for row in raw.get("rows", []):
        amt = Decimal(str(row["total"] or 0))
        cnt = row["count"] or 0
        count += cnt
        if row["transaction_type"] == "credit":
            total_credits += amt
        else:
            total_debits += amt
        cat = row["category"] or "Other"
        categories[cat] = categories.get(cat, Decimal("0")) + amt

    top_categories = sorted(
        [{"category": k, "total": float(v)} for k, v in categories.items()],
        key=lambda x: x["total"],
        reverse=True,
    )[:5]

    return APIResponse(
        success=True,
        message="Monthly summary retrieved",
        data=MonthlySummary(
            year=year,
            month=month,
            total_credits=total_credits,
            total_debits=total_debits,
            net_flow=total_credits - total_debits,
            transaction_count=count,
            top_categories=top_categories,
        ),
    )
