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
from app.schemas.base_schema import APIResponse, PaginatedResponse, PaginationMeta
from app.schemas.transaction_schema import (
    MonthlySummary, 
    TransactionResponse, 
    TransactionSyncRequest,
    TransactionUpdateRequest,
    BulkCategoryUpdateRequest,
    BulkDeleteRequest
)
from app.services.transaction_parser_service import TransactionParserService
from app.repositories.statement_repository import StatementRepository

router = APIRouter()


@router.get(
    "/",
    response_model=PaginatedResponse[TransactionResponse],
    summary="List transactions with optional filters",
)
async def list_transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    statement_id: Optional[UUID] = Query(default=None),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    category: Optional[str] = Query(default=None),
    transaction_type: Optional[str] = Query(default=None, pattern="^(debit|credit)$"),
    min_amount: Optional[Decimal] = Query(default=None),
    max_amount: Optional[Decimal] = Query(default=None),
    sort_by: Optional[str] = Query(default="date"),
    sort_order: Optional[str] = Query(default="desc", pattern="^(asc|desc)$"),
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    skip = (page - 1) * page_size
    transactions, total_count = await repo.get_by_user_filtered(
        user_id=current_user.id,
        skip=skip,
        limit=page_size,
        search=search,
        statement_id=statement_id,
        date_from=date_from,
        date_to=date_to,
        category=category,
        transaction_type=transaction_type,
        min_amount=min_amount,
        max_amount=max_amount,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0

    return PaginatedResponse(
        success=True,
        message="Transactions retrieved",
        data=[TransactionResponse.model_validate(t) for t in transactions],
        meta=PaginationMeta(
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )

@router.get(
    "/categories",
    response_model=APIResponse[List[str]],
    summary="Get distinct transaction categories for the current user",
)
async def list_categories(
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    categories = await repo.get_categories(current_user.id)
    return APIResponse(
        success=True,
        message="Categories retrieved",
        data=categories,
    )


@router.get(
    "/{transaction_id}",
    response_model=APIResponse[TransactionResponse],
    summary="Get transaction by ID",
)
async def get_transaction(
    transaction_id: UUID,
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    from app.exceptions.custom_exceptions import NotFoundException
    transaction = await repo.get(transaction_id)
    if not transaction or transaction.user_id != current_user.id:
        raise NotFoundException("Transaction not found")
    
    return APIResponse(
        success=True,
        message="Transaction retrieved",
        data=TransactionResponse.model_validate(transaction),
    )

@router.put(
    "/{transaction_id}",
    response_model=APIResponse[TransactionResponse],
    summary="Update a transaction",
)
async def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdateRequest,
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    from app.exceptions.custom_exceptions import NotFoundException
    transaction = await repo.get(transaction_id)
    if not transaction or transaction.user_id != current_user.id:
        raise NotFoundException("Transaction not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    if update_data:
        transaction = await repo.update(transaction, update_data)
        
    return APIResponse(
        success=True,
        message="Transaction updated",
        data=TransactionResponse.model_validate(transaction),
    )

@router.delete(
    "/{transaction_id}",
    response_model=APIResponse[None],
    summary="Delete a transaction",
)
async def delete_transaction(
    transaction_id: UUID,
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    from app.exceptions.custom_exceptions import NotFoundException
    transaction = await repo.get(transaction_id)
    if not transaction or transaction.user_id != current_user.id:
        raise NotFoundException("Transaction not found")
    
    await repo.delete(transaction)
    return APIResponse(success=True, message="Transaction deleted")

@router.patch(
    "/bulk/category",
    response_model=APIResponse[dict],
    summary="Bulk update categories",
)
async def bulk_update_category(
    payload: BulkCategoryUpdateRequest,
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    updated_count = await repo.bulk_update_categories(
        current_user.id, payload.transaction_ids, payload.category
    )
    return APIResponse(
        success=True,
        message=f"{updated_count} transactions updated",
        data={"updated_count": updated_count},
    )

@router.delete(
    "/bulk/delete",
    response_model=APIResponse[dict],
    summary="Bulk delete transactions",
)
async def bulk_delete_transactions(
    payload: BulkDeleteRequest,
    current_user=Depends(get_current_active_user),
    repo: TransactionRepository = Depends(get_transaction_repository),
):
    deleted_count = await repo.bulk_delete(current_user.id, payload.transaction_ids)
    return APIResponse(
        success=True,
        message=f"{deleted_count} transactions deleted",
        data={"deleted_count": deleted_count},
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
