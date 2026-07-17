"""
WealthWise AI - OCR Provider Abstraction

Defines the interface every OCR provider must implement.
All business logic (services, workers) depends ONLY on OCRProvider,
never on concrete implementations.

Adding a new provider requires:
  1. Subclass OCRProvider and implement all abstract methods.
  2. Register the subclass in OCRFactory.
  3. Set OCR_PROVIDER=<name> in the environment.
  No other code needs to change.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.ocr.result import OCRResult


class OCRProvider(ABC):
    """
    Abstract base class for all OCR engines.

    All methods are async to accommodate both local CPU-bound providers
    (which may run in a thread pool) and remote API providers (which
    are inherently I/O-bound).
    """

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """
        Machine-readable name of this provider (e.g. "easyocr", "paddleocr").
        Used in logging, metadata, and factory routing.
        """

    # ── Core OCR operations ───────────────────────────────────────────────────

    @abstractmethod
    async def extract_from_pdf(self, file_bytes: bytes) -> OCRResult:
        """
        Extract text from a PDF document.

        Args:
            file_bytes: Raw bytes of the PDF file.

        Returns:
            OCRResult containing per-page text and aggregated full_text.

        Raises:
            OCRExtractionError: If extraction fails at the engine level.
            NotImplementedError: If this provider does not support PDFs.
        """

    @abstractmethod
    async def extract_from_image(self, file_bytes: bytes) -> OCRResult:
        """
        Extract text from an image file (PNG / JPEG / WEBP).

        Args:
            file_bytes: Raw bytes of the image file.

        Returns:
            OCRResult with a single OCRPage.

        Raises:
            OCRExtractionError: If extraction fails at the engine level.
        """

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Verify the provider is ready to accept work.

        Returns:
            True if the provider can perform OCR, False otherwise.
            Must never raise; swallow all exceptions internally.
        """

    # ── Convenience dispatcher ────────────────────────────────────────────────

    async def extract(self, file_bytes: bytes, mime_type: str) -> OCRResult:
        """
        Dispatch to the appropriate extraction method based on MIME type.

        Supported MIME types:
            application/pdf → extract_from_pdf
            image/png       → extract_from_image
            image/jpeg      → extract_from_image

        Args:
            file_bytes: Raw file bytes.
            mime_type:  MIME type string (case-insensitive).

        Returns:
            OCRResult from the matched extraction method.

        Raises:
            ValueError: If the MIME type is not supported.
        """
        normalized = mime_type.lower().strip()
        if normalized == "application/pdf":
            return await self.extract_from_pdf(file_bytes)
        if normalized in {"image/png", "image/jpeg", "image/jpg"}:
            return await self.extract_from_image(file_bytes)
        raise ValueError(
            f"[{self.provider_name}] Unsupported MIME type for OCR: '{mime_type}'. "
            "Supported types: application/pdf, image/png, image/jpeg"
        )
