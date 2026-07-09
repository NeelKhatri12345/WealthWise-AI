"""
WealthWise AI - Document Extraction Result

Shared dataclass returned by every DocumentExtractor implementation.
Downstream code depends only on this contract, never on extractor-specific
internals (e.g. Docling's DoclingDocument / TableItem types).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class DocumentExtractionResult:
    """
    Aggregated structured output for one extracted document.

    Attributes:
        rows:           Ordered list of structured row dicts (e.g. one dict
                         per transaction-table row), with canonicalised keys.
        extractor_name: Identifier of the engine that produced the result
                         (e.g. "docling").
        table_count:    Number of tables detected in the source document.
        page_count:     Number of pages in the source document.
        metadata:       Arbitrary extractor-level metadata (e.g. whether OCR
                         was used — always False for DoclingExtractor).
    """

    rows: list[dict[str, Any]]
    extractor_name: str
    table_count: int
    page_count: int
    metadata: dict[str, Any] = field(default_factory=dict)
