"""
WealthWise AI - OCR Provider Factory

Creates and returns the configured OCRProvider instance.

Design goals
────────────
- Business logic never imports a concrete provider directly.
- Adding a new provider requires only:
    1. Implement OCRProvider in app/ocr/providers/<name>_provider.py.
    2. Register a string key → class mapping in _REGISTRY below.
    3. Set OCR_PROVIDER=<key> in the environment.
  Nothing else changes.

Usage (via dependency injection):
    provider = OCRFactory.create(settings)

Note: Docling is NOT registered here. It is not an OCR engine in this
codebase — see app/extraction/docling_extractor.py and
app/services/document_extraction_service.py for the active, OCR-free
document extraction pipeline. This factory only serves the legacy
EasyOCR-based manual/admin endpoints.

Supported provider keys (OCR_PROVIDER env var):
    "easyocr"       → EasyOCRProvider   (current — legacy manual endpoints only)
    "paddleocr"     → PaddleOCRProvider (planned)
    "aws_textract"  → TextractProvider  (planned)
    "azure_ocr"     → AzureOCRProvider  (planned)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.logger import logger
from app.ocr.base import OCRProvider

if TYPE_CHECKING:
    from app.core.config import Settings


# ── Provider registry ─────────────────────────────────────────────────────────
#
# Mapping of OCR_PROVIDER config value → fully-qualified provider class.
# Keys must be lowercase.  Imports are deferred inside the factory method
# to avoid loading provider libraries that are not installed.
#
_SUPPORTED_PROVIDERS: set[str] = {
    "easyocr",
    "paddleocr",       # planned — Phase N
    "aws_textract",    # planned — Phase N
    "azure_ocr",       # planned — Phase N
}


class OCRFactory:
    """
    Stateless factory for OCR providers.

    All methods are class-methods so the factory itself never needs
    to be instantiated or injected.
    """

    @classmethod
    def create(cls, settings: "Settings") -> OCRProvider:
        """
        Instantiate the OCRProvider requested by ``settings.OCR_PROVIDER``.

        Args:
            settings: Application settings (from get_settings()).

        Returns:
            A fully constructed OCRProvider ready for injection.

        Raises:
            ValueError: If ``OCR_PROVIDER`` names an unsupported engine.
            RuntimeError: If the provider's required library is not installed.
        """
        provider_key = settings.OCR_PROVIDER.lower().strip()
        logger.info(
            "OCRFactory: creating provider",
            extra={"provider": provider_key},
        )

        if provider_key == "easyocr":
            return cls._create_easyocr(settings)

        # ── Planned providers — raise a helpful error until implemented ───────
        if provider_key == "paddleocr":
            raise RuntimeError(
                "PaddleOCR provider is planned but not yet implemented. "
                "Set OCR_PROVIDER=easyocr to use the available provider."
            )

        if provider_key == "aws_textract":
            raise RuntimeError(
                "AWS Textract provider is planned but not yet implemented. "
                "Set OCR_PROVIDER=easyocr to use the available provider."
            )

        if provider_key == "azure_ocr":
            raise RuntimeError(
                "Azure OCR provider is planned but not yet implemented. "
                "Set OCR_PROVIDER=easyocr to use the available provider."
            )

        raise ValueError(
            f"Unknown OCR provider: '{provider_key}'. "
            f"Supported values: {sorted(_SUPPORTED_PROVIDERS)}"
        )

    # ── Private constructors ──────────────────────────────────────────────────

    @classmethod
    def _create_easyocr(cls, settings: "Settings") -> OCRProvider:
        """Construct EasyOCRProvider from application settings."""
        from app.ocr.providers.easyocr_provider import EasyOCRProvider

        languages = [lang.strip() for lang in settings.OCR_LANGUAGE.split(",") if lang.strip()]

        return EasyOCRProvider(
            languages=languages or ["en"],
            use_gpu=settings.OCR_GPU,
            confidence_threshold=settings.OCR_CONFIDENCE_THRESHOLD,
        )

    # ── Utility ───────────────────────────────────────────────────────────────

    @classmethod
    def supported_providers(cls) -> list[str]:
        """Return a sorted list of all registered provider keys."""
        return sorted(_SUPPORTED_PROVIDERS)
