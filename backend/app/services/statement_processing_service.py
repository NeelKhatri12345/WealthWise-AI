"""
WealthWise AI - Statement Processing Service

Manages the statement lifecycle after upload:
  UPLOADED/PENDING → PROCESSING → OCR_COMPLETED → PARSING → COMPLETED
  FAILED may be reached from any non-terminal state.

This service is invoked by background workers or admin processing endpoints.
It owns state-machine transitions and exposes run_ocr() as a convenience
entry point that coordinates PROCESSING → OCR_COMPLETED via OCROrchestrationService.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from app.core.logger import logger
from app.enums.statement_status_enum import StatementStatusEnum
from app.exceptions.custom_exceptions import NotFoundException, ValidationException
from app.models.statement import Statement
from app.ocr.base import OCRProvider
from app.repositories.statement_repository import StatementRepository
from app.schemas.statement_schema import StatementStatusResponse


class StatementProcessingService:
    def __init__(
        self,
        statement_repo: StatementRepository,
        ocr_provider: OCRProvider,
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

    # ── OCR orchestration entry point ────────────────────────────────────────

    async def run_ocr(self, statement_id: UUID) -> None:
        """
        Convenience entry point: transitions statement to PROCESSING then
        executes the full OCR step via OCROrchestrationService.

        Transitions:
            UPLOADED/PENDING → PROCESSING → OCR_COMPLETED  (success)
            UPLOADED/PENDING → PROCESSING → FAILED          (error)

        This is used by internal callers that already hold both the processing
        service and an S3Client.  The HTTP layer should prefer calling
        processing_service.start_processing() then ocr_service.run_ocr()
        directly so each service is injected independently via DI.

        Args:
            statement_id: UUID of the statement to process.

        Raises:
            NotFoundException:  If the statement does not exist.
            ValidationException: If the transition is not valid.
            Exception: Propagated from OCR on failure (after FAILED is recorded).
        """
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
