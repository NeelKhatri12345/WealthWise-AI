"""
WealthWise AI - Statement Routes

All routes are JWT-protected via ``get_current_active_user``.

POST /upload        → Upload a bank statement (PDF, PNG, JPG, JPEG)
GET  /              → List all statements for the authenticated user
GET  /{id}          → Get a single statement's status and metadata
DELETE /{id}        → Delete a statement and its associated transactions

Processing pipeline (admin / worker):
POST /{id}/processing/start          → Transition to PROCESSING
POST /{id}/processing/run-ocr        → Full OCR step: download → extract → OCR_COMPLETED
POST /{id}/processing/ocr-completed  → Manually record OCR result (manual flow)
POST /{id}/processing/parsing        → Transition to PARSING
POST /{id}/processing/parse          → Run transaction parser (OCR_COMPLETED → COMPLETED)
POST /{id}/processing/reparse        → Re-run transaction parser (replaces transactions)
POST /{id}/processing/complete       → Transition to COMPLETED
POST /{id}/processing/fail           → Transition to FAILED
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, BackgroundTasks

from app.core.constants import SUPPORTED_MIME_TYPES
from app.core.dependencies import (
    get_admin_user,
    get_current_active_user,
    get_ocr_orchestration_service,
    get_statement_processing_service,
    get_statement_service,
    get_transaction_parser_service,
)
from app.exceptions.custom_exceptions import UnsupportedFileTypeException
from app.schemas.base_schema import APIResponse
from app.schemas.statement_schema import (
    StatementOcrCompletedRequest,
    StatementProcessingFailRequest,
    StatementStatusResponse,
    StatementUploadResponse,
)
from app.schemas.transaction_schema import ParseStatementResponse
from app.services.ocr_orchestration_service import OCROrchestrationService
from app.services.statement_processing_service import StatementProcessingService
from app.services.statement_service import StatementService
from app.services.transaction_parser_service import TransactionParserService

router = APIRouter()

# Human-readable list for error messages and OpenAPI docs
_ACCEPTED_FORMATS = "PDF, PNG, JPG, JPEG"


async def _process_statement_background_task(statement_id: UUID) -> None:
    """
    Active statement processing pipeline: Docling extraction only.

    Upload → [this task] → DocumentExtractionService (Docling) →
    TransactionParserService (DoclingTransactionMapper) → category
    classification → Database.

    No OCR provider, no EasyOCR, no image rasterization is invoked here.
    """
    from app.database.session import AsyncSessionLocal
    from app.core.config import get_settings
    from app.core.logger import logger
    from app.core.dependencies import get_document_extractor, get_transaction_parser
    from app.clients.s3_client import S3Client
    from app.extraction.base import DocumentExtractor
    from app.repositories.statement_repository import StatementRepository
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.document_extraction_service import DocumentExtractionService

    settings = get_settings()
    extractor: DocumentExtractor = get_document_extractor()
    parser = get_transaction_parser()

    async with AsyncSessionLocal() as session:
        try:
            # Reconstruct dependencies for the background session
            statement_repo = StatementRepository(session)
            transaction_repo = TransactionRepository(session)

            processing_service = StatementProcessingService(statement_repo)
            extraction_service = DocumentExtractionService(
                statement_repo=statement_repo,
                processing_service=processing_service,
                s3_client=S3Client(settings),
                extractor=extractor,
            )
            transaction_parser_service = TransactionParserService(
                statement_repo=statement_repo,
                transaction_repo=transaction_repo,
                processing_service=processing_service,
                parser=parser
            )

            # 1. Document extraction (PENDING -> PROCESSING -> OCR_COMPLETED)
            await processing_service.start_processing(statement_id)
            await extraction_service.run_extraction(statement_id)
            await session.commit()

            # 2. Mapping + persistence (OCR_COMPLETED -> PARSING -> COMPLETED)
            await transaction_parser_service.parse_statement(statement_id)
            await session.commit()

        except Exception as exc:
            logger.error("Background processing failed", extra={"statement_id": str(statement_id)}, exc_info=exc)
            await session.rollback()
            try:
                # Need fresh state to mark failed
                await processing_service.mark_failed(statement_id, error_message=str(exc))
                await session.commit()
            except Exception as fail_exc:
                logger.error("Could not record failure state", extra={"statement_id": str(statement_id)}, exc_info=fail_exc)
                await session.rollback()


@router.post(
    "/upload",
    response_model=APIResponse[StatementUploadResponse],
    status_code=202,
    summary="Upload a bank statement",
    description=(
        "Accepts a bank statement image or PDF (PDF, PNG, JPG, JPEG — max 10 MB). "
        "The file is stored in MinIO and a metadata record is created with "
        "``status=pending``. Background processing is immediately triggered."
    ),
)
async def upload_statement(
    background_tasks: BackgroundTasks,
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
    background_tasks.add_task(_process_statement_background_task, result.id)
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
    "/{statement_id}/processing/run-ocr",
    response_model=APIResponse[StatementStatusResponse],
    status_code=202,
    summary="Run full OCR pipeline",
    description=(
        "Executes the complete OCR step for a queued statement in one call. "
        "Transitions: UPLOADED/PENDING → PROCESSING → OCR_COMPLETED (success) "
        "or FAILED (error). Admin / worker only."
    ),
)
async def run_statement_ocr(
    statement_id: UUID,
    _admin=Depends(get_admin_user),
    ocr_service: OCROrchestrationService = Depends(get_ocr_orchestration_service),
    processing_service: StatementProcessingService = Depends(
        get_statement_processing_service
    ),
    statement_service=Depends(get_statement_service),
):
    """
    Single-call OCR endpoint for background workers.

    Internally:
      1. start_processing()       → status = PROCESSING
      2. S3Client.download_file() → fetch raw bytes from MinIO
      3. OCRProvider.extract()    → run EasyOCR (or configured provider)
      4. mark_ocr_completed()     → status = OCR_COMPLETED, metadata persisted

    On any exception after step 1:
      mark_failed()               → status = FAILED, error_message persisted

    Returns the final StatementStatusResponse (OCR_COMPLETED or FAILED).
    The response always reflects the committed DB state.
    """
    # 1. Transition to PROCESSING (validates legal state transition).
    await processing_service.start_processing(statement_id)

    # 2–4. Download → OCR → persist metadata → mark OCR_COMPLETED (or FAILED on error).
    #      run_ocr() swallows the exception only after recording FAILED; it re-raises
    #      so the HTTP layer can propagate a 500 if needed.  We intentionally let it
    #      propagate here so the client knows something went wrong.
    await ocr_service.run_ocr(statement_id)

    # Return the current statement state after the pipeline step.
    result = await statement_service.get_statement_detail(
        statement_id, _admin.id
    )
    return APIResponse(
        success=True,
        message="OCR pipeline completed successfully.",
        data=result,
    )


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
    "/{statement_id}/processing/parse",
    response_model=APIResponse[ParseStatementResponse],
    status_code=202,
    summary="Map a statement's extracted data into transactions",
    description=(
        "Runs DoclingTransactionMapper against the statement's extracted "
        "document data and persists the resulting transactions. Statement "
        "must currently be OCR_COMPLETED (i.e. extraction has completed). "
        "Transitions: OCR_COMPLETED → PARSING → COMPLETED (success) or "
        "FAILED (error). Admin / worker only."
    ),
)
async def parse_statement(
    statement_id: UUID,
    _admin=Depends(get_admin_user),
    service: TransactionParserService = Depends(get_transaction_parser_service),
):
    result = await service.parse_statement(statement_id)
    return APIResponse(success=True, message="Statement parsed successfully", data=result)


@router.post(
    "/{statement_id}/processing/reparse",
    response_model=APIResponse[ParseStatementResponse],
    status_code=202,
    summary="Re-run the transaction parser for a statement",
    description=(
        "Re-parses a statement that has already completed OCR (e.g. after a "
        "parser fix), replacing any previously parsed transactions. Valid "
        "from OCR_COMPLETED, PARSING, COMPLETED, or FAILED. Admin / worker only."
    ),
)
async def reparse_statement(
    statement_id: UUID,
    _admin=Depends(get_admin_user),
    service: TransactionParserService = Depends(get_transaction_parser_service),
):
    result = await service.reparse_statement(statement_id)
    return APIResponse(success=True, message="Statement re-parsed successfully", data=result)


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
