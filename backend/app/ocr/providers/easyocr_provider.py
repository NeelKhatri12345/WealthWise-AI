"""
WealthWise AI - EasyOCR Provider

Concrete OCRProvider implementation backed by the EasyOCR library.

Architecture notes
──────────────────
- EasyOCR's Reader is CPU/GPU-bound and expensive to initialise.
  The reader is created lazily on first use and reused across all requests.
- All synchronous EasyOCR calls run in a thread-pool executor so they do
  not block the asyncio event loop.
- PDF pages are rasterised via pdf2image (which wraps poppler) before being
  passed to EasyOCR.  Each page becomes one OCRPage in the result.
- Image files (PNG / JPEG) are handled directly as a single-page result.

Dependencies (install once):
  pip install easyocr pdf2image pillow numpy
  # Also requires: poppler (for pdf2image)
  #   Linux:  apt-get install poppler-utils
  #   macOS:  brew install poppler
  #   Windows: include poppler/bin in PATH
"""

from __future__ import annotations

import asyncio
import io
from datetime import datetime, timezone
from typing import Any

from app.core.logger import logger
from app.ocr.base import OCRProvider
from app.ocr.result import OCRPage, OCRResult


class EasyOCRProvider(OCRProvider):
    """
    OCR provider backed by EasyOCR.

    Configuration is injected at construction time so this class remains
    testable in isolation (pass different values to the constructor).

    Args:
        languages:            List of language codes EasyOCR should detect
                              (e.g. ["en", "hi"]).  Defaults to ["en"].
        use_gpu:              Whether to use CUDA GPU acceleration.
                              Set to False in CPU-only environments.
        confidence_threshold: Minimum confidence score [0.0, 1.0] for a
                              detected text block to be included in the result.
                              Blocks below this value are silently discarded.
    """

    _PROVIDER_NAME = "easyocr"

    def __init__(
        self,
        languages: list[str] | None = None,
        use_gpu: bool = False,
        confidence_threshold: float = 0.5,
    ) -> None:
        self._languages = languages or ["en"]
        self._use_gpu = use_gpu
        self._confidence_threshold = confidence_threshold

        # Lazy-initialised; None until _ensure_reader() is first called.
        self._reader: Any | None = None
        self._reader_ready: bool = False

        logger.info(
            "EasyOCRProvider configured (reader not yet loaded)",
            extra={
                "languages": self._languages,
                "use_gpu": self._use_gpu,
                "confidence_threshold": self._confidence_threshold,
            },
        )

    # ── OCRProvider interface ─────────────────────────────────────────────────

    @property
    def provider_name(self) -> str:
        return self._PROVIDER_NAME

    async def extract_from_pdf(self, file_bytes: bytes) -> OCRResult:
        """
        Extract text from a PDF document using EasyOCR.

        Each page is rasterised to a PIL Image (300 DPI) via pdf2image, then
        passed to EasyOCR.  One OCRPage is produced per PDF page.

        Args:
            file_bytes: Raw bytes of the PDF file.

        Returns:
            OCRResult with one OCRPage per PDF page.

        Raises:
            RuntimeError: If pdf2image / poppler is not installed.
            Exception:    Propagated from pdf2image or EasyOCR on extraction failure.
        """
        await self._ensure_reader()

        started_at = datetime.now(timezone.utc)
        logger.info(
            "EasyOCR: starting PDF extraction",
            extra={"provider": self._PROVIDER_NAME},
        )

        # Rasterise all PDF pages in the thread pool (pdf2image is synchronous).
        loop = asyncio.get_event_loop()
        pil_images = await loop.run_in_executor(
            None, self._rasterise_pdf, file_bytes
        )

        pages: list[OCRPage] = []
        for page_idx, pil_image in enumerate(pil_images, start=1):
            ocr_page = await loop.run_in_executor(
                None, self._run_easyocr_on_image, pil_image, page_idx
            )
            pages.append(ocr_page)

        result = self._assemble_result(pages, started_at)
        logger.info(
            "EasyOCR: PDF extraction completed",
            extra={
                "provider": self._PROVIDER_NAME,
                "page_count": len(pages),
                "confidence": result.metadata.get("mean_confidence"),
                "char_count": len(result.full_text),
            },
        )
        return result

    async def extract_from_image(self, file_bytes: bytes) -> OCRResult:
        """
        Extract text from a single image (PNG / JPEG) using EasyOCR.

        The image bytes are decoded into a NumPy array and passed to EasyOCR.
        The result is a single-page OCRResult.

        Args:
            file_bytes: Raw bytes of the image file.

        Returns:
            OCRResult with a single OCRPage.

        Raises:
            RuntimeError: If numpy / PIL is not installed.
            Exception:    Propagated from EasyOCR on extraction failure.
        """
        await self._ensure_reader()

        started_at = datetime.now(timezone.utc)
        logger.info(
            "EasyOCR: starting image extraction",
            extra={"provider": self._PROVIDER_NAME},
        )

        loop = asyncio.get_event_loop()
        ocr_page = await loop.run_in_executor(
            None, self._run_easyocr_on_bytes, file_bytes, 1
        )

        result = self._assemble_result([ocr_page], started_at)
        logger.info(
            "EasyOCR: image extraction completed",
            extra={
                "provider": self._PROVIDER_NAME,
                "confidence": result.metadata.get("mean_confidence"),
                "char_count": len(result.full_text),
            },
        )
        return result

    async def health_check(self) -> bool:
        """
        Verify EasyOCR is importable.

        Returns False (never raises) if the package is not installed.
        Does NOT initialise the Reader (that is deferred to first use).
        """
        try:
            import easyocr  # noqa: F401

            return True
        except ImportError:
            logger.warning(
                "EasyOCR health check failed: package not installed. "
                "Run: pip install easyocr"
            )
            return False
        except Exception as exc:
            logger.warning(
                "EasyOCR health check failed",
                extra={"error": str(exc)},
            )
            return False

    # ── Reader lifecycle ──────────────────────────────────────────────────────

    async def _ensure_reader(self) -> None:
        """
        Lazily initialise the EasyOCR Reader in a thread-pool executor.

        Subsequent calls after the first are no-ops.  The Reader may take
        several seconds to load on first call (model weights are downloaded
        on the very first run if not cached locally).
        """
        if self._reader_ready:
            return

        loop = asyncio.get_event_loop()
        self._reader = await loop.run_in_executor(None, self._create_reader)
        self._reader_ready = True
        logger.info(
            "EasyOCR Reader initialised",
            extra={"languages": self._languages, "gpu": self._use_gpu},
        )

    def _create_reader(self) -> Any:
        """
        Synchronous EasyOCR Reader constructor (runs in thread pool).
        Kept separate from _ensure_reader so it can be mocked in tests.
        """
        import easyocr

        return easyocr.Reader(
            lang_list=self._languages,
            gpu=self._use_gpu,
        )

    # ── Synchronous extraction helpers (run inside thread pool) ──────────────

    def _rasterise_pdf(self, file_bytes: bytes) -> list[Any]:
        """
        Convert all pages of a PDF to PIL Images at 300 DPI.

        Returns:
            List of PIL.Image objects, one per page.

        Raises:
            RuntimeError: If pdf2image or poppler is not available.
        """
        try:
            from pdf2image import convert_from_bytes
        except ImportError:
            raise RuntimeError(
                "pdf2image is not installed. Run: pip install pdf2image\n"
                "Also ensure poppler is installed on your system."
            )

        return convert_from_bytes(file_bytes, dpi=300)

    def _run_easyocr_on_image(self, pil_image: Any, page_number: int) -> OCRPage:
        """
        Run EasyOCR on a PIL Image object.

        Args:
            pil_image:   PIL.Image to process.
            page_number: 1-based page index for the resulting OCRPage.

        Returns:
            OCRPage with raw_text, blocks, and confidence.
        """
        import numpy as np

        if self._reader is None:
            raise RuntimeError("EasyOCR reader is not initialised")

        img_array = np.array(pil_image)
        raw_results = self._reader.readtext(img_array, detail=1)
        return self._build_ocr_page(raw_results, page_number)

    def _run_easyocr_on_bytes(self, file_bytes: bytes, page_number: int) -> OCRPage:
        """
        Run EasyOCR directly on image bytes (for PNG / JPEG input).

        Args:
            file_bytes:  Raw image bytes.
            page_number: 1-based page index (always 1 for single images).

        Returns:
            OCRPage with raw_text, blocks, and confidence.
        """
        import numpy as np
        from PIL import Image

        if self._reader is None:
            raise RuntimeError("EasyOCR reader is not initialised")

        pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_array = np.array(pil_image)
        raw_results = self._reader.readtext(img_array, detail=1)
        return self._build_ocr_page(raw_results, page_number)

    # ── Result normalisation ──────────────────────────────────────────────────

    def _build_ocr_page(
        self,
        raw_results: list[tuple],
        page_number: int,
    ) -> OCRPage:
        """
        Normalise EasyOCR's raw readtext output into an OCRPage.

        EasyOCR returns a list of (bounding_box, text, confidence) tuples.
        Blocks below self._confidence_threshold are filtered out.

        Args:
            raw_results: List of (bbox, text, confidence) tuples from EasyOCR.
            page_number: 1-based page index.

        Returns:
            OCRPage with filtered text and block-level metadata.
        """
        accepted_blocks: list[dict[str, Any]] = []
        text_lines: list[str] = []

        for bbox, text, confidence in raw_results:
            if confidence < self._confidence_threshold:
                continue
            text_lines.append(text)
            accepted_blocks.append(
                {
                    "text": text,
                    "confidence": round(float(confidence), 4),
                    "bbox": bbox,  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
                }
            )

        page_confidence: float | None = None
        if accepted_blocks:
            page_confidence = round(
                sum(b["confidence"] for b in accepted_blocks) / len(accepted_blocks),
                4,
            )

        raw_text = "\n".join(text_lines)

        return OCRPage(
            page_number=page_number,
            raw_text=raw_text,
            blocks=accepted_blocks,
            confidence=page_confidence,
        )

    def _assemble_result(
        self,
        pages: list[OCRPage],
        started_at: datetime,
    ) -> OCRResult:
        """
        Aggregate per-page results into a final OCRResult.

        Args:
            pages:      List of OCRPage objects (one per document page).
            started_at: Timestamp when extraction began (for metadata).

        Returns:
            OCRResult with concatenated full_text and summary metadata.
        """
        full_text = "\f".join(p.raw_text for p in pages)

        # Mean confidence across all pages that reported a value
        confident_pages = [p for p in pages if p.confidence is not None]
        mean_confidence: float | None = None
        if confident_pages:
            mean_confidence = round(
                sum(p.confidence for p in confident_pages) / len(confident_pages),  # type: ignore[arg-type]
                4,
            )

        finished_at = datetime.now(timezone.utc)

        return OCRResult(
            pages=pages,
            full_text=full_text,
            provider_name=self._PROVIDER_NAME,
            metadata={
                "page_count": len(pages),
                "mean_confidence": mean_confidence,
                "confidence_threshold": self._confidence_threshold,
                "languages": self._languages,
                "gpu": self._use_gpu,
                "started_at": started_at.isoformat(),
                "finished_at": finished_at.isoformat(),
                "processing_seconds": round(
                    (finished_at - started_at).total_seconds(), 3
                ),
            },
        )
