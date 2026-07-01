"""
WealthWise AI - Statement Routes

All routes are JWT-protected via ``get_current_active_user``.

POST /upload        → Upload a bank statement (PDF, PNG, JPG, JPEG)
GET  /              → List all statements for the authenticated user
GET  /{id}          → Get a single statement's status and metadata
DELETE /{id}        → Delete a statement and its associated transactions

Processing pipeline (admin / worker):
POST /{id}/processing/start
POST /{id}/processing/ocr-completed
POST /{id}/processing/parsing
POST /{id}/processing/complete
POST /{id}/processing/fail
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.constants import SUPPORTED_MIME_TYPES
from app.core.dependencies import (
    get_admin_user,
    get_current_active_user,
    get_statement_processing_service,
    get_statement_service,
)
from app.exceptions.custom_exceptions import UnsupportedFileTypeException
from app.schemas.base_schema import APIResponse
from app.schemas.statement_schema import (
    StatementOcrCompletedRequest,
    StatementProcessingFailRequest,
    StatementStatusResponse,
    StatementUploadResponse,
)
from app.services.statement_processing_service import StatementProcessingService
from app.services.statement_service import StatementService

router = APIRouter()

# Human-readable list for error messages and OpenAPI docs
_ACCEPTED_FORMATS = "PDF, PNG, JPG, JPEG"


@router.post(
    "/upload",
    response_model=APIResponse[StatementUploadResponse],
    status_code=202,
    summary="Upload a bank statement",
    description=(
        "Accepts a bank statement image or PDF (PDF, PNG, JPG, JPEG — max 10 MB). "
        "The file is stored in MinIO and a metadata record is created with "
        "``status=pending``. No OCR or parsing is triggered by this endpoint."
    ),
)
async def upload_statement(
    file: UploadFile = File(
        ...,
        description=f"Bank statement file. Accepted: {_ACCEPTED_FORMATS}. Max: 10 MB.",
    ),
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    """
    Upload a bank statement to MinIO and create a PENDING metadata record.

    **Validation (client-side HTTP layer):**
    - Content-Type must be one of: application/pdf, image/png, image/jpeg

    **Validation (service layer):**
    - File size ≤ 10 MB
    - Extension in {.pdf, .png, .jpg, .jpeg}
    - Magic bytes match the declared file type (prevents spoofing)

    **Response:**
    - 202 Accepted — file stored, processing queued
    - 413 Request Entity Too Large — file exceeds 10 MB
    - 415 Unsupported Media Type — file type not allowed
    - 401 / 403 — authentication / authorisation failure
    """
    # Content-Type pre-check (fast rejection before reading the body)
    if file.content_type and file.content_type not in SUPPORTED_MIME_TYPES:
        raise UnsupportedFileTypeException(
            f"Content-Type '{file.content_type}' is not supported. "
            f"Accepted: {_ACCEPTED_FORMATS}."
        )

    result = await service.upload_statement(file, current_user.id)
    return APIResponse(
        success=True,
        message="Statement uploaded successfully. It will be processed shortly.",
        data=result,
    )


@router.get(
    "/",
    response_model=APIResponse[List[StatementStatusResponse]],
    summary="List statements for the current user",
)
async def list_statements(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum records to return"),
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    statements = await service.get_statements(current_user.id, skip, limit)
    return APIResponse(
        success=True,
        message=f"{len(statements)} statement(s) retrieved",
        data=statements,
    )


@router.get(
    "/{statement_id}",
    response_model=APIResponse[StatementStatusResponse],
    summary="Get a specific statement",
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
    summary="Delete a statement",
    description="Deletes the MinIO file and the DB record (cascades to transactions).",
)
async def delete_statement(
    statement_id: UUID,
    current_user=Depends(get_current_active_user),
    service: StatementService = Depends(get_statement_service),
):
    await service.delete_statement(statement_id, current_user.id)
    return APIResponse(success=True, message="Statement deleted")


# ── Processing pipeline (admin / background worker) ───────────────────────────


@router.post(
    "/{statement_id}/processing/start",
    response_model=APIResponse[StatementStatusResponse],
    summary="Start statement processing",
    description="Transition a queued statement to PROCESSING. Admin / worker only.",
)
async def start_statement_processing(
    statement_id: UUID,
    _admin=Depends(get_admin_user),
    service: StatementProcessingService = Depends(get_statement_processing_service),
):
    result = await service.start_processing(statement_id)
    return APIResponse(success=True, message="Processing started", data=result)


@router.post(
    "/{statement_id}/processing/ocr-completed",
    response_model=APIResponse[StatementStatusResponse],
    summary="Mark OCR stage complete",
    description="Record OCR extraction results. Admin / worker only.",
)
async def mark_statement_ocr_completed(
    statement_id: UUID,
    payload: StatementOcrCompletedRequest,
    _admin=Depends(get_admin_user),
    service: StatementProcessingService = Depends(get_statement_processing_service),
):
    result = await service.mark_ocr_completed(
        statement_id,
        processing_metadata=payload.to_processing_metadata(),
    )
    return APIResponse(success=True, message="OCR completed", data=result)


@router.post(
    "/{statement_id}/processing/parsing",
    response_model=APIResponse[StatementStatusResponse],
    summary="Mark parsing stage started",
    description="Transition statement to PARSING. Admin / worker only.",
)
async def mark_statement_parsing(
    statement_id: UUID,
    _admin=Depends(get_admin_user),
    service: StatementProcessingService = Depends(get_statement_processing_service),
):
    result = await service.mark_parsing(statement_id)
    return APIResponse(success=True, message="Parsing started", data=result)


@router.post(
    "/{statement_id}/processing/complete",
    response_model=APIResponse[StatementStatusResponse],
    summary="Mark processing complete",
    description="Transition statement to COMPLETED. Admin / worker only.",
)
async def mark_statement_completed(
    statement_id: UUID,
    _admin=Depends(get_admin_user),
    service: StatementProcessingService = Depends(get_statement_processing_service),
):
    result = await service.mark_completed(statement_id)
    return APIResponse(
        success=True,
        message="Statement processing completed",
        data=result,
    )


@router.post(
    "/{statement_id}/processing/fail",
    response_model=APIResponse[StatementStatusResponse],
    summary="Mark processing failed",
    description="Transition statement to FAILED with an error message. Admin / worker only.",
)
async def mark_statement_failed(
    statement_id: UUID,
    payload: StatementProcessingFailRequest,
    _admin=Depends(get_admin_user),
    service: StatementProcessingService = Depends(get_statement_processing_service),
):
    result = await service.mark_failed(
        statement_id,
        error_message=payload.error_message,
    )
    return APIResponse(success=True, message="Statement marked as failed", data=result)
