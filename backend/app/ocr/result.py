"""
WealthWise AI - OCR Result

Shared dataclass that every OCR provider returns.
The rest of the pipeline depends only on this contract,
never on provider-specific types.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class OCRPage:
    """
    Raw OCR output for a single page / image region.

    Attributes:
        page_number: 1-based page index within the document.
        raw_text:    Full text extracted from this page, preserving line breaks.
        blocks:      Optional provider-specific structured blocks (bounding boxes,
                     word-level confidence, etc.).  Shape varies by provider;
                     downstream code must not rely on it without feature-flagging.
        confidence:  Mean confidence score across all detected text regions,
                     in [0.0, 1.0].  None if the provider does not expose it.
    """

    page_number: int
    raw_text: str
    blocks: list[dict[str, Any]] = field(default_factory=list)
    confidence: float | None = None


@dataclass(frozen=True)
class OCRResult:
    """
    Aggregated OCR output for an entire document.

    Attributes:
        pages:           Ordered list of per-page results.
        full_text:       Concatenation of all page raw_text values,
                         separated by a form-feed character (\\f).
        provider_name:   Identifier of the OCR engine that produced the result
                         (e.g. "easyocr", "paddleocr", "aws_textract").
        metadata:        Arbitrary provider-level metadata (e.g. model version,
                         GPU used, processing time).  Never required by callers.
    """

    pages: list[OCRPage]
    full_text: str
    provider_name: str
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def empty(cls, provider_name: str) -> "OCRResult":
        """Construct a zero-page placeholder result (useful in dry-run / stub scenarios)."""
        return cls(
            pages=[],
            full_text="",
            provider_name=provider_name,
            metadata={},
        )
