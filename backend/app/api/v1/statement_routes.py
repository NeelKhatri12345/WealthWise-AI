"""WealthWise AI - Statement Routes"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.dependencies import (get_current_active_user,
                                   get_statement_service)
from app.schemas.base_schema import APIResponse
from app.schemas.statement_schema import (StatementStatusResponse,
                                          StatementUploadResponse)
from app.services.statement_service import StatementService

router = APIRouter()


@router.post(
    "/upload",
    response_model=APIResponse[StatementUploadResponse],
    status_code=202,
    summary="Upload a bank statement (PDF or CSV)",
)
async def upload_statement(
    file: UploadFile = File(..., description="Bank statement PDF or CSV file"),
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    result = await service.upload_statement(file, current_user.id)
    return APIResponse(
        success=True,
        message="Statement uploaded. Processing will begin shortly.",
        data=result,
    )


@router.get(
    "/",
    response_model=APIResponse[List[StatementStatusResponse]],
    summary="List all statements for the current user",
)
async def list_statements(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    statements = await service.get_statements(current_user.id, skip, limit)
    return APIResponse(success=True, message="Statements retrieved", data=statements)


@router.get(
    "/{statement_id}",
    response_model=APIResponse[StatementStatusResponse],
    summary="Get a specific statement's status and details",
)
async def get_statement(
    statement_id: UUID,
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    statement = await service.get_statement_detail(statement_id, current_user.id)
    return APIResponse(success=True, message="Statement retrieved", data=statement)


@router.delete(
    "/{statement_id}",
    response_model=APIResponse[None],
    summary="Delete a statement and its associated transactions",
)
async def delete_statement(
    statement_id: UUID,
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    await service.delete_statement(statement_id, current_user.id)
    return APIResponse(success=True, message="Statement deleted")
