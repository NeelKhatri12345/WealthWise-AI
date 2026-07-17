#!/usr/bin/env python3
"""
WealthWise AI - PaddleOCR Proof of Concept

Standalone script only. NOT wired into the application's OCR pipeline
(app/ocr/*) and does not touch the existing EasyOCR provider. Evaluates
PaddleOCR/PaddleX text extraction on CPU for a single PDF or image file.

Usage:
    python backend/poc/paddleocr_poc.py --input <path-to-pdf-or-image> --output <output-dir>

Outputs (written into --output):
    paddleocr_raw_text.txt   - concatenated recognized text (pages separated by form feed)
    paddleocr_result.json    - structured result: per-page lines with text/confidence/box + summary

Dependencies (not added to requirements.txt — install manually to run this POC):
    pip install paddlepaddle paddleocr pdf2image pillow numpy

Targets the PaddleOCR 3.x / PaddleX pipeline API (tested against
paddleocr==3.7.0, paddlepaddle==3.3.1). Not compatible with PaddleOCR 2.x,
which used a different constructor (`use_gpu`, `use_angle_cls`, `show_log`)
and returned plain `.ocr()` list results instead of dict-like pipeline
results.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}
_PDF_EXTENSIONS = {".pdf"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="PaddleOCR POC: extract text/confidence/boxes from a PDF or image (CPU only)."
    )
    parser.add_argument("--input", required=True, help="Path to input PDF or image file")
    parser.add_argument("--output", required=True, help="Output directory for results")
    return parser.parse_args()


def load_page_images(input_path: Path) -> list:
    """Return a list of PIL Images, one per page (single-element list for a plain image)."""
    suffix = input_path.suffix.lower()

    if suffix in _PDF_EXTENSIONS:
        from pdf2image import convert_from_path

        return convert_from_path(str(input_path))

    if suffix in _IMAGE_EXTENSIONS:
        from PIL import Image

        return [Image.open(input_path)]

    raise ValueError(
        f"Unsupported input file extension '{suffix}'. "
        f"Supported: {sorted(_PDF_EXTENSIONS | _IMAGE_EXTENSIONS)}"
    )


def run_paddleocr(images: list) -> list[dict[str, Any]]:
    """
    Run PaddleOCR on each page image, CPU only.

    Uses the PaddleOCR 3.x / PaddleX pipeline API (the 2.x constructor args
    `use_gpu` and `show_log` were removed in 3.x; `use_angle_cls` was renamed
    to `use_textline_orientation`, and device selection moved to `device`).

    Returns a list of per-page dicts:
        {"page_number": int, "lines": [{"text": str, "confidence": float, "box": [[x, y], ...]}]}
    """
    import numpy as np
    from paddleocr import PaddleOCR

    ocr_engine = PaddleOCR(
        lang="en",
        device="cpu",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=True,
    )

    pages: list[dict[str, Any]] = []
    for page_number, image in enumerate(images, start=1):
        image_array = np.array(image.convert("RGB"))
        results = ocr_engine.predict(image_array)

        # predict() returns one result per input image; we pass one page at a
        # time, so detections for this page live in results[0].
        page_result = results[0] if results else {}
        rec_texts = page_result.get("rec_texts", []) if page_result else []
        rec_scores = page_result.get("rec_scores", []) if page_result else []
        rec_polys = page_result.get("rec_polys", []) if page_result else []

        lines: list[dict[str, Any]] = [
            {
                "text": text,
                "confidence": round(float(confidence), 4),
                "box": [[round(float(x), 2), round(float(y), 2)] for x, y in box],
            }
            for text, confidence, box in zip(rec_texts, rec_scores, rec_polys)
        ]

        pages.append({"page_number": page_number, "lines": lines})

    return pages


def build_summary(pages: list[dict[str, Any]], elapsed_seconds: float) -> dict[str, Any]:
    all_confidences = [line["confidence"] for page in pages for line in page["lines"]]
    total_lines = len(all_confidences)
    average_confidence = round(sum(all_confidences) / total_lines, 4) if total_lines else 0.0

    return {
        "engine": "paddleocr",
        "page_count": len(pages),
        "line_count": total_lines,
        "average_confidence": average_confidence,
        "elapsed_seconds": round(elapsed_seconds, 2),
    }


def build_raw_text(pages: list[dict[str, Any]]) -> str:
    """Concatenate recognized text, one page per form-feed-separated block."""
    page_texts = ["\n".join(line["text"] for line in page["lines"]) for page in pages]
    return "\f".join(page_texts)


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_dir = Path(args.output)

    if not input_path.exists():
        print(f"Error: input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    start_time = time.perf_counter()
    images = load_page_images(input_path)
    pages = run_paddleocr(images)
    elapsed_seconds = time.perf_counter() - start_time

    summary = build_summary(pages, elapsed_seconds)
    raw_text = build_raw_text(pages)

    structured_result = {
        "input_file": str(input_path),
        "summary": summary,
        "pages": pages,
    }

    raw_text_path = output_dir / "paddleocr_raw_text.txt"
    result_json_path = output_dir / "paddleocr_result.json"

    raw_text_path.write_text(raw_text, encoding="utf-8")
    result_json_path.write_text(json.dumps(structured_result, indent=2), encoding="utf-8")

    print("PaddleOCR POC complete")
    print(f"  Pages processed       : {summary['page_count']}")
    print(f"  Lines extracted       : {summary['line_count']}")
    print(f"  Average confidence    : {summary['average_confidence']}")
    print(f"  Time taken (seconds)  : {summary['elapsed_seconds']}")
    print(f"  Raw text written to   : {raw_text_path}")
    print(f"  JSON result written to: {result_json_path}")


if __name__ == "__main__":
    main()
