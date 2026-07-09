"""
WealthWise AI - Docling Extractor

Concrete DocumentExtractor implementation backed by IBM's Docling library.

Docling parses a PDF's layout and table structure directly from its native
content (text objects, vector graphics, table grids). There is no page
rasterization, no image conversion, and OCR is explicitly disabled
(PdfPipelineOptions.do_ocr = False) — no OCR text recognition ever runs.

This is the only document extraction engine in the active statement
processing pipeline. The legacy EasyOCR-based OCRProvider stack (app/ocr/*)
remains in the repository, untouched and unreferenced by this module,
purely for backward compatibility with the legacy manual processing
endpoints.

Extraction is CPU-bound; the conversion call runs in a thread-pool executor
so it does not block the asyncio event loop.

Dependencies (install once):
  pip install docling
"""

from __future__ import annotations

import asyncio
from io import BytesIO
from typing import Any

from app.core.logger import logger
from app.extraction.base import DocumentExtractor
from app.extraction.result import DocumentExtractionResult

# Header aliases seen across different bank statement table layouts, mapped
# to the canonical keys DoclingTransactionMapper expects. Matching is
# case-insensitive and whitespace/punctuation-insensitive (see
# _normalize_header). Unrecognised headers are passed through unchanged so
# no data is silently dropped.
_HEADER_ALIASES: dict[str, str] = {
    "transactionid": "Transaction ID",
    "txnid": "Transaction ID",
    "referenceno": "Transaction ID",
    "refno": "Transaction ID",
    "valuedate": "Value Date",
    "txndate": "Value Date",
    "transactiondate": "Value Date",
    "date": "Value Date",
    "txnposteddate": "Txn Posted Date",
    "postingdate": "Txn Posted Date",
    "chequeno": "Cheque No.",
    "chequenumber": "Cheque No.",
    "chqno": "Cheque No.",
    "description": "Description",
    "narration": "Description",
    "particulars": "Description",
    "transactionremarks": "Description",
    "cridr": "CrIDr",
    "drcr": "CrIDr",
    "type": "CrIDr",
    "transactionamount": "Transaction Amount",
    "amount": "Transaction Amount",
    "withdrawalamount": "Transaction Amount",
    "depositamount": "Transaction Amount",
    "availablebalance": "Available Balance",
    "balance": "Available Balance",
    "closingbalance": "Available Balance",
}


def _normalize_header(raw_header: str) -> str:
    """Collapse a raw table header to a lookup key: lowercase, alphanumeric only."""
    return "".join(ch for ch in raw_header.lower() if ch.isalnum())


def _normalize_row_keys(row: dict[str, Any]) -> dict[str, Any]:
    """Map a raw Docling table row to canonical column names where recognised."""
    normalized: dict[str, Any] = {}
    for key, value in row.items():
        canonical = _HEADER_ALIASES.get(_normalize_header(str(key)))
        normalized[canonical or str(key).strip()] = value
    return normalized


def _dataframe_to_records(dataframe: Any) -> list[dict[str, Any]]:
    """
    Convert a Docling table DataFrame to a list of row dicts.

    Docling's table structure model usually recognises the header row, but
    on some layouts it comes back as generic/unnamed columns with the real
    header text sitting in the first data row instead. Detect that case and
    promote it before converting to records.
    """
    columns = [str(c).strip() for c in dataframe.columns]
    looks_unlabelled = all(c.isdigit() or c.lower().startswith("unnamed") for c in columns)
    if looks_unlabelled and len(dataframe) > 0:
        header = [str(v).strip() for v in dataframe.iloc[0]]
        dataframe = dataframe.iloc[1:]
        dataframe.columns = header

    return dataframe.to_dict(orient="records")


class DoclingExtractor(DocumentExtractor):
    """Extracts structured table data directly from a PDF using Docling."""

    @property
    def extractor_name(self) -> str:
        return "docling"

    async def extract(self, file_bytes: bytes) -> DocumentExtractionResult:
        return await asyncio.to_thread(self._convert, file_bytes)

    # ── Internal: synchronous Docling conversion (runs in a worker thread) ────

    def _convert(self, file_bytes: bytes) -> DocumentExtractionResult:
        from docling.datamodel.base_models import DocumentStream, InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.document_converter import DocumentConverter, PdfFormatOption

        logger.info("DoclingExtractor: starting extraction")

        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False  # Docling must never perform OCR.

        converter = DocumentConverter(
            format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
        )
        source = DocumentStream(name="statement.pdf", stream=BytesIO(file_bytes))
        conversion_result = converter.convert(source)
        document = conversion_result.document

        rows: list[dict[str, Any]] = []
        for table in document.tables:
            dataframe = table.export_to_dataframe()
            rows.extend(_dataframe_to_records(dataframe))

        normalized_rows = [_normalize_row_keys(row) for row in rows]
        page_count = len(document.pages) if hasattr(document, "pages") else 1

        logger.info(
            "DoclingExtractor: extraction complete",
            extra={
                "table_count": len(document.tables),
                "row_count": len(normalized_rows),
                "page_count": page_count,
            },
        )

        return DocumentExtractionResult(
            rows=normalized_rows,
            extractor_name=self.extractor_name,
            table_count=len(document.tables),
            page_count=page_count,
            metadata={"do_ocr": False},
        )
