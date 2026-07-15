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
import re
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

# Column-name sets used by _is_transaction_table().
# A table qualifies when it has a date column, a description column, and at
# least one amount column — regardless of which bank issued the statement.
_TXN_DATE_COLS = {"Value Date", "Txn Date", "Transaction Date", "Date", "Txn Posted Date"}
_TXN_DESC_COLS = {"Description", "Narration", "Particulars", "Transaction Remarks"}
_TXN_AMOUNT_COLS = {
    "Debit", "Credit", "Withdrawal", "Deposit", "Dr", "Cr",
    "Transaction Amount", "Available Balance",
}


def _normalize_header(raw_header: str) -> str:
    """Collapse a raw table header to a lookup key: lowercase, alphanumeric only."""
    return "".join(ch for ch in raw_header.lower() if ch.isalnum())


def _clean_column_name(raw: Any) -> str:
    """
    Collapse whitespace and newlines in a column label, then strip.
    Matches the POC's normalize_column_name() pre-processing step.
    """
    text = str(raw) if raw is not None else ""
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _deduplicate_columns(columns: list[str]) -> list[str]:
    """
    Deduplicate column names by appending _1, _2, … to later occurrences.
    Matches the POC's canonicalize_column_names() deduplication logic so
    that tables with repeated column labels (e.g. two unnamed columns) do
    not silently drop data during to_dict().
    """
    seen: dict[str, int] = {}
    result: list[str] = []
    for col in columns:
        if col in seen:
            seen[col] += 1
            result.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            result.append(col)
    return result


def _clean_cell_value(value: Any) -> Any:
    """
    Replace float NaN / None / NaT sentinel strings with None.
    Matches the POC's normalize_spaces() + clean_dataframe_for_json() pair.

    Without this step, Docling fills empty cells with float('nan').
    When passed through to_dict() those become float('nan') values in the
    row dict.  The mapper's _parse_date() and _parse_amount() both receive
    str(float('nan')) == 'nan' and return None, causing every row to be
    skipped.
    """
    import math

    if value is None:
        return None
    # float NaN from pandas empty cells
    if isinstance(value, float) and math.isnan(value):
        return None
    text = str(value).strip()
    if text.lower() in {"nan", "none", "nat", ""}:
        return None
    return value


def _normalize_row_keys(row: dict[str, Any]) -> dict[str, Any]:
    """Map a raw Docling table row to canonical column names where recognised."""
    normalized: dict[str, Any] = {}
    for key, value in row.items():
        canonical = _HEADER_ALIASES.get(_normalize_header(str(key)))
        normalized[canonical or str(key).strip()] = _clean_cell_value(value)
    return normalized


def _is_transaction_table(columns: set[str]) -> bool:
    """
    Return True when the column set contains at least one date column, at
    least one description column, and at least one amount column.

    Deliberately bank-agnostic: the exact column names vary across issuers
    ("Debit"/"Credit", "Transaction Amount", "Withdrawal"/"Deposit", etc.)
    so we accept any recognised variant for each role.
    """
    has_date = bool(_TXN_DATE_COLS & columns)
    has_desc = bool(_TXN_DESC_COLS & columns)
    has_amount = bool(_TXN_AMOUNT_COLS & columns)
    return has_date and has_desc and has_amount


def _dataframe_to_records(dataframe: Any) -> list[dict[str, Any]]:
    """
    Convert a Docling table DataFrame to a list of row dicts.

    Steps applied to match the proven POC behaviour:
      1. Strip / collapse whitespace and newlines in column labels.
      2. Deduplicate column names (prevents silent data loss in to_dict).
      3. Unlabelled-header promotion: if every column label is purely
         numeric or "unnamed…", treat the first data row as the header.
      4. NaN / None / NaT cell cleaning (applied via _normalize_row_keys).
    """
    import pandas as pd

    # 1. Clean column labels (collapse newlines and multi-spaces).
    cleaned_cols = [_clean_column_name(c) for c in dataframe.columns]

    # 2. Deduplicate column names before any further processing.
    deduped_cols = _deduplicate_columns(cleaned_cols)
    dataframe = dataframe.copy()
    dataframe.columns = deduped_cols

    # 3. Unlabelled-header promotion.
    looks_unlabelled = all(
        c.isdigit() or c.lower().startswith("unnamed") for c in deduped_cols
    )
    if looks_unlabelled and len(dataframe) > 0:
        new_header = [_clean_column_name(v) for v in dataframe.iloc[0]]
        new_header = _deduplicate_columns(new_header)
        dataframe = dataframe.iloc[1:].copy()
        dataframe.columns = new_header

    # Replace pandas NaN with None so to_dict() never emits float('nan').
    dataframe = dataframe.where(pd.notnull(dataframe), None)

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
        pipeline_options.do_ocr = False            # Docling must never perform OCR.
        pipeline_options.do_table_structure = True  # Required: populate table cell content.

        converter = DocumentConverter(
            format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
        )
        source = DocumentStream(name="statement.pdf", stream=BytesIO(file_bytes))
        conversion_result = converter.convert(source)
        document = conversion_result.document

        rows: list[dict[str, Any]] = []
        for table in document.tables:
            try:
                dataframe = table.export_to_dataframe(doc=document)
            except Exception as exc:
                logger.warning(
                    "DoclingExtractor: failed to export table to DataFrame: %s", exc
                )
                continue
            if dataframe is None or dataframe.empty:
                continue

            records = _dataframe_to_records(dataframe)

            # Apply alias mapping to resolve column names before the
            # is_transaction_table check so the check sees canonical names.
            if records:
                aliased_cols = {
                    (_HEADER_ALIASES.get(_normalize_header(k)) or k)
                    for k in records[0].keys()
                }
                if not _is_transaction_table(aliased_cols):
                    continue

            rows.extend(records)

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
