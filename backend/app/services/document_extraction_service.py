"""
WealthWise AI - Document Extraction Service

Orchestrates the document-extraction step of the statement processing
pipeline using Docling directly — no OCR, no page rasterization, no image
conversion. This is the extraction stage for the active pipeline; the
legacy EasyOCR-based OCROrchestrationService remains in the repository but
is no longer invoked here.

  1. Fetch the uploaded PDF from MinIO using the existing S3Client.
  2. Delegate extraction to the injected DocumentExtractor (Docling).
  3. Normalise the DocumentExtractionResult into processing_metadata.
  4. Transition the statement:
       PROCESSING → OCR_COMPLETED  (on success)
       PROCESSING → FAILED         (on any exception)

Note on state naming: the Statement status enum value OCR_COMPLETED
predates this migration and is not renamed, per the requirement to
preserve the database schema/Alembic migrations unchanged. In this
pipeline it simply means "document extraction completed."

Separation of concerns
───────────────────────
- StatementProcessingService owns pure state-machine transitions.
- S3Client owns file I/O.
- DocumentExtractor (Docling) owns structured extraction.
- DocumentExtractionService is the single seam that connects all three.
"""

from __future__ import annotations

import json
from uuid import UUID

from app.clients.s3_client import S3Client
from app.core.logger import logger
from app.extraction.base import DocumentExtractor
from app.extraction.result import DocumentExtractionResult
from app.repositories.statement_repository import StatementRepository
from app.services.statement_processing_service import StatementProcessingService


class DocumentExtractionService:
    """
    Orchestrates end-to-end document extraction for a single statement.

    Args:
        statement_repo:      Access to statement records.
        processing_service:  State-machine transitions (PROCESSING → OCR_COMPLETED / FAILED).
        s3_client:           MinIO / S3 file download.
        extractor:           Document extraction engine (Docling).
    """

    def __init__(
        self,
        statement_repo: StatementRepository,
        processing_service: StatementProcessingService,
        s3_client: S3Client,
        extractor: DocumentExtractor,
    ) -> None:
        self._statement_repo = statement_repo
        self._processing_service = processing_service
        self._s3 = s3_client
        self._extractor = extractor

    # ── Public entry point ────────────────────────────────────────────────────

    async def run_extraction(self, statement_id: UUID) -> None:
        """
        Execute document extraction for a statement currently in PROCESSING.

        The statement must already be in PROCESSING status (i.e. the caller
        has already invoked StatementProcessingService.start_processing()).

        On success:
            - DocumentExtractionResult is normalised and stored in
              processing_metadata.
            - Statement transitions to OCR_COMPLETED.

        On failure:
            - Exception is caught, logged with diagnostics.
            - Statement transitions to FAILED with a structured error_message.
            - The exception is re-raised so the caller can decide further action.

        Raises:
            ValueError:  If the statement does not exist, or if extraction
                        produced zero rows (e.g. a scanned/image-only PDF —
                        Docling's table-structure model can still detect
                        table shapes without text, but with OCR disabled
                        there is nothing to populate cells with).
            Exception:   Propagated from download or extraction on failure,
                         after the FAILED transition has been recorded.
        """
        logger.info("Document extraction: started", extra={"statement_id": str(statement_id)})

        statement = await self._statement_repo.get(statement_id)
        if not statement:
            logger.error(
                "Document extraction: statement not found",
                extra={"statement_id": str(statement_id)},
            )
            raise ValueError(f"Statement {statement_id} not found")

        minio_key: str = statement.file_path

        try:
            logger.info(
                "Document extraction: downloading file from MinIO",
                extra={"statement_id": str(statement_id), "minio_key": minio_key},
            )
            file_bytes: bytes = await self._s3.download_file(minio_key)

            logger.info(
                "Document extraction: running Docling extraction",
                extra={
                    "statement_id": str(statement_id),
                    "extractor": self._extractor.extractor_name,
                },
            )
            extraction_result = await self._extractor.extract(file_bytes)

            if not extraction_result.rows:
                raise ValueError(
                    "No extractable data found in this document. Scanned or "
                    "image-only PDFs are not currently supported — please "
                    "upload a digitally-generated PDF statement."
                )

            processing_metadata = self._build_metadata(extraction_result)

            await self._processing_service.mark_ocr_completed(
                statement_id,
                processing_metadata=processing_metadata,
            )

            logger.info(
                "Document extraction: completed successfully",
                extra={
                    "statement_id": str(statement_id),
                    "table_count": extraction_result.table_count,
                    "row_count": len(extraction_result.rows),
                },
            )

        except Exception as exc:
            error_msg = self._format_error(exc)
            logger.error(
                "Document extraction: failed",
                extra={
                    "statement_id": str(statement_id),
                    "error": error_msg,
                    "extractor": self._extractor.extractor_name,
                },
                exc_info=exc,
            )
            await self._fail(statement_id, error_msg)
            raise

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _build_metadata(extraction_result: DocumentExtractionResult) -> dict:
        """
        Normalise DocumentExtractionResult into the processing_metadata dict
        stored in the Statement.processing_metadata JSONB column.

        Stored keys:
            extraction_engine  – engine name (e.g. "docling")
            extracted_data     – JSON-serialised structured rows (consumed by
                                  DoclingTransactionMapper, NOT free-text OCR)
            table_count        – number of tables detected
            page_count         – number of pages in the source document
        """
        return {
            "extraction_engine": extraction_result.extractor_name,
            "extracted_data": json.dumps(extraction_result.rows, default=str),
            "table_count": extraction_result.table_count,
            "page_count": extraction_result.page_count,
            **extraction_result.metadata,
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
                "Document extraction: failed to record FAILED transition",
                extra={
                    "statement_id": str(statement_id),
                    "transition_error": str(transition_exc),
                },
                exc_info=transition_exc,
            )

    @staticmethod
    def _format_error(exc: Exception) -> str:
        """Build a concise, human-readable error message preserving the exception type."""
        return f"[{type(exc).__name__}] {exc}"
