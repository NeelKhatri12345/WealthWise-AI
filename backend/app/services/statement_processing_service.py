"""
WealthWise AI - Statement Processing Service

Manages the statement lifecycle after upload:
  UPLOADED/PENDING → PROCESSING → OCR_COMPLETED → PARSING → COMPLETED
  FAILED may be reached from any non-terminal state.

This service is invoked by background workers or admin processing endpoints.
It owns pure state-machine transitions, independent of which extraction
engine is used. The active pipeline (DocumentExtractionService, Docling)
does not need an ocr_provider at all; it is only required by the legacy
run_ocr() convenience method below, kept for the legacy manual/admin
EasyOCR endpoints.
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID

from app.core.logger import logger
from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import NotFoundException, ValidationException
from app.models.statement import Statement
from app.repositories.statement_repository import StatementRepository
from app.schemas.statement_schema import StatementStatusResponse

if TYPE_CHECKING:
    # Only needed for the legacy run_ocr() convenience method below — the
    # active Docling pipeline never constructs this service with an
    # ocr_provider at all.
    from app.ocr.base import OCRProvider


class StatementProcessingService:
    def __init__(
        self,
        statement_repo: StatementRepository,
        ocr_provider: Optional["OCRProvider"] = None,
    ) -> None:
        self._statement_repo = statement_repo
        self._ocr_provider = ocr_provider

    # ── State transitions ─────────────────────────────────────────────────────

    async def start_processing(self, statement_id: UUID) -> StatementStatusResponse:
        """Move a queued statement into active processing."""
        statement = await self._get_or_raise(statement_id)
        self._assert_transition(
            statement,
            StatementStatusEnum.PROCESSING,
            "start processing",
        )

        updated = await self._statement_repo.update_processing_state(
            statement,
            status=StatementStatusEnum.PROCESSING,
            processing_started_at=datetime.now(timezone.utc),
            error_message=None,
        )
        logger.info(
            "Statement processing started",
            extra={"statement_id": str(statement_id)},
        )
        return StatementStatusResponse.model_validate(updated)

    async def mark_ocr_completed(
        self,
        statement_id: UUID,
        *,
        processing_metadata: Optional[dict[str, Any]] = None,
    ) -> StatementStatusResponse:
        """Record successful OCR extraction."""
        statement = await self._get_or_raise(statement_id)
        self._assert_transition(
            statement,
            StatementStatusEnum.OCR_COMPLETED,
            "mark OCR completed",
        )

        metadata = dict(statement.processing_metadata or {})
        if processing_metadata:
            metadata.update(processing_metadata)

        updated = await self._statement_repo.update_processing_state(
            statement,
            status=StatementStatusEnum.OCR_COMPLETED,
            processing_metadata=metadata or None,
            ocr_completed_at=datetime.now(timezone.utc),
        )
        logger.info(
            "Statement OCR completed",
            extra={"statement_id": str(statement_id)},
        )
        return StatementStatusResponse.model_validate(updated)

    async def mark_parsing(self, statement_id: UUID) -> StatementStatusResponse:
        """Move statement into structured parsing stage."""
        statement = await self._get_or_raise(statement_id)
        self._assert_transition(statement, StatementStatusEnum.PARSING, "mark parsing")

        updated = await self._statement_repo.update_processing_state(
            statement,
            status=StatementStatusEnum.PARSING,
            parsing_started_at=datetime.now(timezone.utc),
        )
        logger.info(
            "Statement parsing started",
            extra={"statement_id": str(statement_id)},
        )
        return StatementStatusResponse.model_validate(updated)

    async def mark_completed(self, statement_id: UUID) -> StatementStatusResponse:
        """Mark pipeline finished successfully."""
        statement = await self._get_or_raise(statement_id)
        self._assert_transition(statement, StatementStatusEnum.COMPLETED, "mark completed")

        updated = await self._statement_repo.update_processing_state(
            statement,
            status=StatementStatusEnum.COMPLETED,
            processed_at=datetime.now(timezone.utc),
            error_message=None,
        )
        logger.info(
            "Statement processing completed",
            extra={"statement_id": str(statement_id)},
        )
        return StatementStatusResponse.model_validate(updated)

    async def mark_failed(
        self,
        statement_id: UUID,
        *,
        error_message: str,
    ) -> StatementStatusResponse:
        """Mark pipeline failed with an error message."""
        statement = await self._get_or_raise(statement_id)
        self._assert_transition(statement, StatementStatusEnum.FAILED, "mark failed")

        updated = await self._statement_repo.update_processing_state(
            statement,
            status=StatementStatusEnum.FAILED,
            error_message=error_message,
        )
        logger.warning(
            "Statement processing failed",
            extra={
                "statement_id": str(statement_id),
                "error_message": error_message,
            },
        )
        return StatementStatusResponse.model_validate(updated)

    async def force_reparse(self, statement_id: UUID) -> StatementStatusResponse:
        """
        Force a statement back into PARSING regardless of its current status,
        as long as OCR has already completed at least once.

        This is the one intentional exception to the forward-only state
        machine above: it exists solely to support re-running the transaction
        parser (e.g. after a parser bug fix) on a statement that already
        reached COMPLETED or FAILED. The OCR stages are untouched — only the
        parsing/persist step is redone by the caller (TransactionParserService).
        """
        statement = await self._get_or_raise(statement_id)
        allowed = {
            StatementStatusEnum.OCR_COMPLETED,
            StatementStatusEnum.PARSING,
            StatementStatusEnum.COMPLETED,
            StatementStatusEnum.FAILED,
        }
        if statement.status not in allowed:
            raise ValidationException(
                f"Cannot re-run parser: statement must have completed OCR first "
                f"(status={statement.status.value})"
            )

        updated = await self._statement_repo.update_processing_state(
            statement,
            status=StatementStatusEnum.PARSING,
            parsing_started_at=datetime.now(timezone.utc),
            error_message=None,
        )
        logger.info(
            "Statement parsing force-restarted (re-run)",
            extra={"statement_id": str(statement_id)},
        )
        return StatementStatusResponse.model_validate(updated)

    # ── Legacy OCR orchestration entry point (not used by the active pipeline) ─

    async def run_ocr(self, statement_id: UUID) -> None:
        """
        Legacy convenience entry point: transitions statement to PROCESSING
        then executes the full EasyOCR step via OCROrchestrationService.

        Not called by the active Docling pipeline (see
        DocumentExtractionService) — kept only for the legacy manual/admin
        run-ocr endpoint. Requires this service to have been constructed
        with an ocr_provider.

        Transitions:
            UPLOADED/PENDING → PROCESSING → OCR_COMPLETED  (success)
            UPLOADED/PENDING → PROCESSING → FAILED          (error)

        Args:
            statement_id: UUID of the statement to process.

        Raises:
            NotFoundException:  If the statement does not exist.
            ValidationException: If the transition is not valid.
            RuntimeError: If this service was constructed without an ocr_provider.
            Exception: Propagated from OCR on failure (after FAILED is recorded).
        """
        if self._ocr_provider is None:
            raise RuntimeError(
                "run_ocr() requires StatementProcessingService to be constructed "
                "with an ocr_provider (legacy EasyOCR path only)."
            )

        from app.clients.s3_client import S3Client
        from app.core.config import get_settings
        from app.services.ocr_orchestration_service import OCROrchestrationService

        # Transition to PROCESSING first.
        await self.start_processing(statement_id)

        # Build a local S3Client from settings (same pattern as DI factory).
        orchestrator = OCROrchestrationService(
            statement_repo=self._statement_repo,
            processing_service=self,
            s3_client=S3Client(get_settings()),
            ocr_provider=self._ocr_provider,
        )
        await orchestrator.run_ocr(statement_id)

    # ── Internal helpers ────────────────────────────────────────────────────────

    async def _get_or_raise(self, statement_id: UUID) -> Statement:
        statement = await self._statement_repo.get(statement_id)
        if not statement:
            raise NotFoundException("Statement not found")
        return statement

    @staticmethod
    def _assert_transition(
        statement: Statement,
        target: StatementStatusEnum,
        action: str,
    ) -> None:
        if not StatementStatusEnum.can_transition(statement.status, target):
            raise ValidationException(
                f"Cannot {action}: invalid transition "
                f"{statement.status.value} → {target.value}"
            )
