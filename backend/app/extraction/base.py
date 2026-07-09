"""
WealthWise AI - Document Extractor Abstraction

Defines the interface every document extraction engine must implement.
All business logic (DocumentExtractionService) depends ONLY on
DocumentExtractor, never on a concrete implementation.

This is intentionally NOT an OCR abstraction. Docling parses PDF document
structure (text, tables, layout) directly from the file's native content —
no page rasterization, no image conversion, no OCR text recognition.

Adding a new extractor requires:
  1. Subclass DocumentExtractor and implement `extract()`.
  2. Wire the new implementation wherever a DocumentExtractor is
     constructed (see app/core/dependencies.py::get_document_extractor).
  No other code needs to change.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.extraction.result import DocumentExtractionResult


class DocumentExtractor(ABC):
    """Abstract base class for all document extraction engines."""

    @property
    @abstractmethod
    def extractor_name(self) -> str:
        """Machine-readable name of this extractor (e.g. "docling"). Used in logging."""

    @abstractmethod
    async def extract(self, file_bytes: bytes) -> DocumentExtractionResult:
        """
        Extract structured data directly from a document's bytes.

        Args:
            file_bytes: Raw bytes of the uploaded PDF.

        Returns:
            DocumentExtractionResult containing every structured row the
            extractor could find (e.g. transaction table rows), plus
            observability metadata.

        Raises:
            Exception: Propagated from the underlying extraction library on
                       failure; callers are responsible for translating this
                       into a FAILED statement transition.
        """
