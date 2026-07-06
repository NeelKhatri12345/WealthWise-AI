"""
WealthWise AI - OCR Orchestration Service

Coordinates the OCR step of the statement processing pipeline:

  1. Fetch the uploaded file from MinIO using the existing S3Client.
  2. Determine MIME type from the statement's file_type field.
  3. Delegate extraction to the injected OCRProvider (abstraction-only dependency).
  4. Normalise the OCRResult into processing_metadata.
  5. Transition the statement:
       PROCESSING → OCR_COMPLETED  (on success)
       PROCESSING → FAILED         (on any exception)

Separation of concerns
───────────────────────
- StatementProcessingService owns pure state-machine transitions.
- S3Client owns file I/O.
- OCRProvider owns text extraction.
- OCROrchestrationService is the single seam that connects all three.

This service is called by background workers or admin endpoints; it is not
invoked synchronously during the HTTP upload request.
"""

from __future__ import annotations

from uuid import UUID

from app.clients.s3_client import S3Client
from app.core.logger import logger
from app.ocr.base import OCRProvider
from app.ocr.result import OCRResult
from app.repositories.statement_repository import StatementRepository
from app.services.statement_processing_service import StatementProcessingService

# Map from the file_type stored in the DB → MIME type accepted by OCRProvider.extract()
_FILE_TYPE_TO_MIME: dict[str, str] = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}


class OCROrchestrationService:
    """
    Orchestrates end-to-end OCR for a single statement.

    Args:
        statement_repo:      Access to statement records.
        processing_service:  State-machine transitions (PROCESSING → OCR_COMPLETED / FAILED).
        s3_client:           MinIO / S3 file download.
        ocr_provider:        OCR engine (depends only on the OCRProvider abstraction).
    """

    def __init__(
        self,
        statement_repo: StatementRepository,
        processing_service: StatementProcessingService,
        s3_client: S3Client,
        ocr_provider: OCRProvider,
    ) -> None:
        self._statement_repo = statement_repo
        self._processing_service = processing_service
        self._s3 = s3_client
        self._ocr_provider = ocr_provider

    # ── Public entry point ────────────────────────────────────────────────────

    async def run_ocr(self, statement_id: UUID) -> None:
        """
        Execute OCR for a statement that is currently in PROCESSING status.

        The statement must already be in PROCESSING status (i.e., the caller
        has already invoked StatementProcessingService.start_processing()).

        On success:
            - OCRResult is normalised and stored in processing_metadata.
            - Statement transitions to OCR_COMPLETED.

        On failure:
            - Exception is caught, logged with diagnostics.
            - Statement transitions to FAILED with a structured error_message.
            - The exception is re-raised so the caller can decide further action
              (e.g., retry, dead-letter queue).

        Args:
            statement_id: UUID of the statement to process.

        Raises:
            NotFoundException:  If the statement does not exist.
            Exception:          Propagated from download or OCR on failure,
                                after the FAILED transition has been recorded.
        """
        logger.info(
            "OCR orchestration: started",
            extra={"statement_id": str(statement_id)},
        )

        # ── 1. Load statement record ──────────────────────────────────────────
        statement = await self._statement_repo.get(statement_id)
        if not statement:
            logger.error(
                "OCR orchestration: statement not found",
                extra={"statement_id": str(statement_id)},
            )
            raise ValueError(f"Statement {statement_id} not found")

        minio_key: str = statement.file_path
        file_type: str = (statement.file_type or "").lower().strip()

        # ── 2. Resolve MIME type ──────────────────────────────────────────────
        mime_type = _FILE_TYPE_TO_MIME.get(file_type)
        if not mime_type:
            error_msg = (
                f"Unsupported file_type '{file_type}' for OCR. "
                f"Supported: {sorted(_FILE_TYPE_TO_MIME)}"
            )
            logger.error(
                "OCR orchestration: unsupported file type",
                extra={"statement_id": str(statement_id), "file_type": file_type},
            )
            await self._fail(statement_id, error_msg)
            raise ValueError(error_msg)

        try:
            # ── 3. Download file from MinIO ───────────────────────────────────
            logger.info(
                "OCR orchestration: downloading file from MinIO",
                extra={
                    "statement_id": str(statement_id),
                    "minio_key": minio_key,
                    "mime_type": mime_type,
                },
            )
            file_bytes: bytes = await self._s3.download_file(minio_key)

            # ── 4. Run OCR ────────────────────────────────────────────────────
            logger.info(
                "OCR orchestration: running OCR",
                extra={
                    "statement_id": str(statement_id),
                    "provider": self._ocr_provider.provider_name,
                    "mime_type": mime_type,
                    "file_size_bytes": len(file_bytes),
                },
            )
            ocr_result: OCRResult = await self._ocr_provider.extract(
                file_bytes, mime_type
            )

            # ── 5. Build processing_metadata ──────────────────────────────────
            processing_metadata = self._build_metadata(ocr_result)

            # ── 6. Transition → OCR_COMPLETED ──────────────────────────────────
            await self._processing_service.mark_ocr_completed(
                statement_id,
                processing_metadata=processing_metadata,
            )

            logger.info(
                "OCR orchestration: completed successfully",
                extra={
                    "statement_id": str(statement_id),
                    "page_count": ocr_result.metadata.get("page_count"),
                    "mean_confidence": ocr_result.metadata.get("mean_confidence"),
                    "processing_seconds": ocr_result.metadata.get("processing_seconds"),
                },
            )

        except Exception as exc:
            # ── 7. Handle failure ─────────────────────────────────────────────
            error_msg = self._format_error(exc)
            logger.error(
                "OCR orchestration: failed",
                extra={
                    "statement_id": str(statement_id),
                    "error": error_msg,
                    "provider": self._ocr_provider.provider_name,
                },
                exc_info=exc,
            )
            await self._fail(statement_id, error_msg)
            raise  # Re-raise for caller (worker retry / dead-letter logic)

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _build_metadata(ocr_result: OCRResult) -> dict:
        """
        Normalise OCRResult into the processing_metadata dict that is stored
        in the Statement.processing_metadata JSONB column.

        Stored keys:
            ocr_provider        – engine name (e.g. "easyocr")
            raw_text            – full concatenated text (\f-separated pages)
            page_count          – number of pages processed
            mean_confidence     – average confidence across all accepted blocks
            confidence_threshold– threshold used during this run
            languages           – language codes used
            gpu                 – whether GPU was used
            ocr_started_at      – ISO timestamp when extraction began
            ocr_finished_at     – ISO timestamp when extraction completed
            ocr_processing_seconds – wall-clock seconds for OCR step
        """
        meta = ocr_result.metadata  # provider-level metadata dict
        return {
            "ocr_provider": ocr_result.provider_name,
            "raw_text": ocr_result.full_text,
            "page_count": meta.get("page_count", len(ocr_result.pages)),
            "mean_confidence": meta.get("mean_confidence"),
            "confidence_threshold": meta.get("confidence_threshold"),
            "languages": meta.get("languages"),
            "gpu": meta.get("gpu"),
            "ocr_started_at": meta.get("started_at"),
            "ocr_finished_at": meta.get("finished_at"),
            "ocr_processing_seconds": meta.get("processing_seconds"),
        }

    async def _fail(self, statement_id: UUID, error_message: str) -> None:
        """
        Transition the statement to FAILED and record the error message.
        Errors in this transition are swallowed and logged (fail-safe).
        """
        try:
            await self._processing_service.mark_failed(
                statement_id,
                error_message=error_message,
            )
        except Exception as transition_exc:
            logger.error(
                "OCR orchestration: failed to record FAILED transition",
                extra={
                    "statement_id": str(statement_id),
                    "transition_error": str(transition_exc),
                },
                exc_info=transition_exc,
            )

    @staticmethod
    def _format_error(exc: Exception) -> str:
        """
        Build a concise, human-readable error message preserving the exception
        type for diagnostics without exposing raw stack traces in the DB.
        """
        return f"[{type(exc).__name__}] {exc}"
