"""
WealthWise AI - OCR Package

Exposes the public OCR surface:
  - OCRProvider   abstract base class (all business logic depends on this)
  - OCRResult     shared result dataclass
  - OCRFactory    creates the configured provider at startup
"""

from app.ocr.base import OCRProvider
from app.ocr.factory import OCRFactory
from app.ocr.result import OCRResult

__all__ = ["OCRProvider", "OCRFactory", "OCRResult"]
