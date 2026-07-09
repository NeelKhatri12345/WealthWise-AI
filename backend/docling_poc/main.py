import json
import logging
import os
import re
import tempfile
import time
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

try:
    import fitz  # PyMuPDF
except ImportError as exc:
    raise SystemExit(
        "PyMuPDF is required. Install it with: pip install pymupdf"
    ) from exc

from docling.datamodel.base_models import InputFormat

try:
    from docling.datamodel.base_models import DocumentStream
except Exception:
    DocumentStream = None

from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

PROCESS_MODE = os.getenv("DOCLING_PROCESS_MODE", "page").strip().lower()

INPUT_FILENAME = "statement.pdf"

OUTPUT_MARKDOWN = "extracted.md"
OUTPUT_JSON = "extracted.json"
OUTPUT_TABLES_JSON = "extracted_tables.json"
OUTPUT_TABLES_CSV = "extracted_tables.csv"
COMPARISON_REPORT = "comparison.txt"

VALUE_DATE_OUTPUT_FORMAT = "%d %b %Y"


# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------
# Docling setup
# ---------------------------------------------------------------------

def build_converter() -> DocumentConverter:
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True

    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options
            )
        }
    )


# ---------------------------------------------------------------------
# PDF helpers
# ---------------------------------------------------------------------

def get_total_pages(pdf_path: Path) -> int:
    with fitz.open(str(pdf_path)) as pdf:
        return len(pdf)


def make_single_page_pdf_bytes(
    source_pdf: fitz.Document,
    page_index: int,
) -> bytes:
    single_page_pdf = fitz.open()

    try:
        single_page_pdf.insert_pdf(
            source_pdf,
            from_page=page_index,
            to_page=page_index,
        )

        return single_page_pdf.tobytes(
            garbage=4,
            deflate=True,
        )

    finally:
        single_page_pdf.close()


def convert_pdf_bytes(
    converter: DocumentConverter,
    pdf_bytes: bytes,
    name: str,
):
    if DocumentStream is not None:
        try:
            source = DocumentStream(
                name=name,
                stream=BytesIO(pdf_bytes),
            )
            return converter.convert(source)

        except Exception as stream_error:
            logger.warning(
                "In-memory conversion failed for %s. "
                "Falling back to temporary file. Reason: %s",
                name,
                stream_error,
            )

    temp_path: Optional[str] = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            prefix=f"{Path(name).stem}_",
            delete=False,
        ) as tmp:
            tmp.write(pdf_bytes)
            temp_path = tmp.name

        return converter.convert(Path(temp_path))

    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError as cleanup_error:
                logger.warning(
                    "Could not delete temporary file %s: %s",
                    temp_path,
                    cleanup_error,
                )


# ---------------------------------------------------------------------
# OCR correction constants
# ---------------------------------------------------------------------

SERIAL_NO_COLUMN = "Serial No."
TRANSACTION_ID_COLUMN = "Transaction ID"
TXN_DATE_COLUMN = "Txn Date"
TXN_POSTED_DATE_COLUMN = "Txn Posted Date"
VALUE_DATE_COLUMN = "Value Date"
CHEQUE_NO_COLUMN = "Cheque No."
VALUE_DATE_CHEQUE_COLUMN = "Value Date Cheque No."

NUMERIC_OCR_CHAR_MAP = str.maketrans(
    {
        "O": "0",
        "o": "0",
        "Q": "0",
        "D": "0",
        "I": "1",
        "l": "1",
        "L": "1",
        "|": "1",
        "!": "1",
        "T": "1",
        "Z": "2",
        "z": "2",
        "A": "4",
        "S": "5",
        "s": "5",
        "$": "5",
        "G": "6",
        "b": "6",
        "B": "8",
        "g": "9",
        "q": "9",
    }
)

COLUMN_ALIASES = {
    "no": SERIAL_NO_COLUMN,
    "no.": SERIAL_NO_COLUMN,
    "sr no": SERIAL_NO_COLUMN,
    "sr no.": SERIAL_NO_COLUMN,
    "s no": SERIAL_NO_COLUMN,
    "s.no": SERIAL_NO_COLUMN,
    "s.no.": SERIAL_NO_COLUMN,
    "sl no": SERIAL_NO_COLUMN,
    "sl no.": SERIAL_NO_COLUMN,
    "serial no": SERIAL_NO_COLUMN,
    "serial no.": SERIAL_NO_COLUMN,

    "transaction id": TRANSACTION_ID_COLUMN,
    "txn id": TRANSACTION_ID_COLUMN,
    "trans id": TRANSACTION_ID_COLUMN,

    "txn date": TXN_DATE_COLUMN,
    "transaction date": TXN_DATE_COLUMN,
    "txn posted date": TXN_POSTED_DATE_COLUMN,

    "value date": VALUE_DATE_COLUMN,
    "cheque no": CHEQUE_NO_COLUMN,
    "cheque no.": CHEQUE_NO_COLUMN,
    "cheque number": CHEQUE_NO_COLUMN,
    "chq no": CHEQUE_NO_COLUMN,
    "chq no.": CHEQUE_NO_COLUMN,
    "value date cheque no": VALUE_DATE_CHEQUE_COLUMN,
    "value date cheque no.": VALUE_DATE_CHEQUE_COLUMN,

    "description": "Description",
    "branch code": "Branch Code",

    "debit": "Debit",
    "credit": "Credit",
    "balance": "Balance",

    "cr/dr": "Cr/Dr",
    "cr dr": "Cr/Dr",

    "transaction amount": "Transaction Amount",
    "amount": "Transaction Amount",
    "available balance": "Available Balance",
}

MONEY_COLUMNS = {
    "Debit",
    "Credit",
    "Balance",
    "Transaction Amount",
    "Available Balance",
}


# ---------------------------------------------------------------------
# General normalization helpers
# ---------------------------------------------------------------------

def normalize_spaces(value: Any) -> str:
    if value is None:
        return ""

    text = str(value).strip()

    if text.lower() in {"nan", "none", "nat"}:
        return ""

    return re.sub(r"\s+", " ", text)


def normalize_column_name(column: Any) -> str:
    raw = normalize_spaces(column)
    raw = raw.replace("\n", " ").strip()
    key = re.sub(r"\s+", " ", raw.lower()).strip()
    return COLUMN_ALIASES.get(key, raw)


def canonicalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    new_columns: List[str] = []
    seen: Dict[str, int] = {}

    for col in df.columns:
        canonical = normalize_column_name(col)

        if canonical in seen:
            seen[canonical] += 1
            canonical = f"{canonical}_{seen[canonical]}"
        else:
            seen[canonical] = 0

        new_columns.append(canonical)

    df.columns = new_columns
    return df


def fix_numeric_ocr_chars(value: Any) -> str:
    text = normalize_spaces(value)

    if not text:
        return ""

    return text.translate(NUMERIC_OCR_CHAR_MAP)


def normalize_digit_identifier(
    value: Any,
    max_len: int = 20,
) -> str:
    text = normalize_spaces(value)

    if not text or text in {"-", "—", "–"}:
        return ""

    fixed = fix_numeric_ocr_chars(text)
    digits = re.sub(r"\D", "", fixed)

    if max_len and len(digits) > max_len:
        digits = digits[:max_len]

    return digits


def normalize_serial_value(value: Any) -> Optional[int]:
    digits = normalize_digit_identifier(value, max_len=8)

    if not digits:
        return None

    try:
        return int(digits)
    except ValueError:
        return None


def normalize_cheque_no(value: Any) -> str:
    return normalize_digit_identifier(value, max_len=12)


def normalize_transaction_id(value: Any) -> str:
    raw = normalize_spaces(value).replace(" ", "")

    if not raw:
        return ""

    candidate = raw.upper()

    if re.match(r"^[S5$][A-Z0-9|!IlLoOQDSZABGgq$-]{4,}$", candidate):
        digits = normalize_digit_identifier(candidate[1:], max_len=20)
        return f"S{digits}" if digits else "S"

    return candidate


def normalize_cr_dr(value: Any) -> str:
    text = normalize_spaces(value).upper().replace(" ", "")
    text = text.replace("0", "O")

    if text in {"CR", "C/R", "CREDIT"}:
        return "CR"

    if text in {"DR", "D/R", "DEBIT"}:
        return "DR"

    return text


def normalize_money_field(value: Any) -> str:
    raw = normalize_spaces(value)

    if not raw or raw in {"-", "—", "–"}:
        return ""

    has_rs = bool(re.search(r"\brs\.?\b", raw, flags=re.IGNORECASE))
    is_negative = raw.startswith("-") or (
        raw.startswith("(") and raw.endswith(")")
    )

    fixed = fix_numeric_ocr_chars(raw)
    fixed = fixed.replace(" ", "")
    fixed = re.sub(r"[^0-9,.-]", "", fixed)
    fixed = fixed.replace("--", "-")

    if is_negative and not fixed.startswith("-"):
        fixed = f"-{fixed}"

    if not fixed or fixed in {"-", ".", ","}:
        return ""

    return f"Rs. {fixed}" if has_rs else fixed


# ---------------------------------------------------------------------
# Date normalization
# ---------------------------------------------------------------------

def parse_any_date(value: Any) -> Optional[datetime]:
    text = normalize_spaces(value)

    if not text:
        return None

    numeric_text = fix_numeric_ocr_chars(text)

    patterns = [
        r"(\d{2})[-/](\d{2})[-/](\d{4})",
        r"(\d{2})\s+([A-Za-z]{3,9})\s+(\d{4})",
    ]

    for pattern in patterns:
        match = re.search(pattern, numeric_text)

        if not match:
            match = re.search(pattern, text)

        if not match:
            continue

        candidate = match.group(0)

        for fmt in [
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%d %b %Y",
            "%d %B %Y",
        ]:
            try:
                return datetime.strptime(candidate, fmt)
            except ValueError:
                continue

    return None


def format_value_date(value: Any) -> str:
    parsed = parse_any_date(value)

    if not parsed:
        return ""

    return parsed.strftime(VALUE_DATE_OUTPUT_FORMAT)


def split_value_date_and_cheque_no(
    raw_value: Any,
    txn_date: Any,
) -> Tuple[str, str]:
    raw = normalize_spaces(raw_value)
    inferred_value_date = format_value_date(txn_date)

    if not raw or raw in {"-", "—", "–"}:
        return inferred_value_date, ""

    parsed_date = parse_any_date(raw)
    value_date = (
        parsed_date.strftime(VALUE_DATE_OUTPUT_FORMAT)
        if parsed_date
        else ""
    )

    remainder = raw
    remainder = re.sub(r"\d{2}[-/]\d{2}[-/]\d{4}", " ", remainder)
    remainder = re.sub(
        r"\d{2}\s+[A-Za-z]{3,9}\s+\d{4}",
        " ",
        remainder,
    )

    cheque_no = normalize_cheque_no(remainder)

    if value_date and cheque_no:
        return value_date, cheque_no

    if value_date:
        return value_date, ""

    if cheque_no:
        return inferred_value_date, cheque_no

    return inferred_value_date, ""


# ---------------------------------------------------------------------
# Transaction table detection and cleanup
# ---------------------------------------------------------------------

def is_transaction_table(df: pd.DataFrame) -> bool:
    columns = {str(col).strip() for col in df.columns}

    old_style = {
        "Txn Date",
        "Description",
    }.issubset(columns) and bool(
        {"Debit", "Credit", "Balance"} & columns
    )

    agami_style = {
        TRANSACTION_ID_COLUMN,
        VALUE_DATE_COLUMN,
        "Description",
        "Transaction Amount",
    }.issubset(columns)

    agami_style_with_serial = {
        SERIAL_NO_COLUMN,
        TRANSACTION_ID_COLUMN,
        VALUE_DATE_COLUMN,
        TXN_POSTED_DATE_COLUMN,
        CHEQUE_NO_COLUMN,
        "Description",
    }.issubset(columns)

    return old_style or agami_style or agami_style_with_serial


def ensure_value_date_and_cheque_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if VALUE_DATE_CHEQUE_COLUMN in df.columns:
        value_dates: List[str] = []
        cheque_numbers: List[str] = []

        txn_source_column = (
            TXN_DATE_COLUMN
            if TXN_DATE_COLUMN in df.columns
            else TXN_POSTED_DATE_COLUMN
        )

        for _, row in df.iterrows():
            value_date, cheque_no = split_value_date_and_cheque_no(
                raw_value=row.get(VALUE_DATE_CHEQUE_COLUMN, ""),
                txn_date=row.get(txn_source_column, ""),
            )

            value_dates.append(value_date)
            cheque_numbers.append(cheque_no)

        old_column_index = list(df.columns).index(VALUE_DATE_CHEQUE_COLUMN)

        df.insert(
            old_column_index,
            VALUE_DATE_COLUMN,
            value_dates,
        )

        df.insert(
            old_column_index + 1,
            CHEQUE_NO_COLUMN,
            cheque_numbers,
        )

        df = df.drop(columns=[VALUE_DATE_CHEQUE_COLUMN])
        return df

    if VALUE_DATE_COLUMN in df.columns:
        txn_source_column = (
            TXN_DATE_COLUMN
            if TXN_DATE_COLUMN in df.columns
            else TXN_POSTED_DATE_COLUMN
        )

        normalized_dates = []

        for _, row in df.iterrows():
            value_date = format_value_date(row.get(VALUE_DATE_COLUMN, ""))

            if not value_date:
                value_date = format_value_date(row.get(txn_source_column, ""))

            normalized_dates.append(value_date)

        df[VALUE_DATE_COLUMN] = normalized_dates

    else:
        txn_source_column = (
            TXN_DATE_COLUMN
            if TXN_DATE_COLUMN in df.columns
            else TXN_POSTED_DATE_COLUMN
        )

        insert_position = 1 if len(df.columns) > 1 else len(df.columns)

        df.insert(
            insert_position,
            VALUE_DATE_COLUMN,
            [
                format_value_date(row.get(txn_source_column, ""))
                for _, row in df.iterrows()
            ],
        )

    if CHEQUE_NO_COLUMN in df.columns:
        df[CHEQUE_NO_COLUMN] = df[CHEQUE_NO_COLUMN].apply(normalize_cheque_no)

    else:
        value_date_index = list(df.columns).index(VALUE_DATE_COLUMN)

        df.insert(
            value_date_index + 1,
            CHEQUE_NO_COLUMN,
            "",
        )

    return df


def normalize_known_transaction_fields(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if TRANSACTION_ID_COLUMN in df.columns:
        df[TRANSACTION_ID_COLUMN] = df[TRANSACTION_ID_COLUMN].apply(
            normalize_transaction_id
        )

    if CHEQUE_NO_COLUMN in df.columns:
        df[CHEQUE_NO_COLUMN] = df[CHEQUE_NO_COLUMN].apply(
            normalize_cheque_no
        )

    if "Cr/Dr" in df.columns:
        df["Cr/Dr"] = df["Cr/Dr"].apply(normalize_cr_dr)

    for col in MONEY_COLUMNS:
        if col in df.columns:
            df[col] = df[col].apply(normalize_money_field)

    return df


def normalize_transaction_table(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = canonicalize_column_names(df)

    if not is_transaction_table(df):
        return df

    df = ensure_value_date_and_cheque_columns(df)
    df = normalize_known_transaction_fields(df)

    return df


def clean_existing_serial_column(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, List[Optional[int]]]:
    df = canonicalize_column_names(df)

    if SERIAL_NO_COLUMN not in df.columns:
        return df, []

    serials = [
        normalize_serial_value(value)
        for value in df[SERIAL_NO_COLUMN].tolist()
    ]

    return df, serials


def apply_sequential_serial_numbers(
    tables: List[Dict[str, Any]],
) -> None:
    next_serial = 1

    for table in tables:
        df = table.get("df", pd.DataFrame())

        if df.empty:
            continue

        df = canonicalize_column_names(df)

        if not is_transaction_table(df):
            table["df"] = df
            table["rows"], table["cols"] = df.shape
            continue

        df, captured_serials = clean_existing_serial_column(df)

        valid_captured = [
            serial
            for serial in captured_serials
            if serial is not None
        ]

        if next_serial == 1 and valid_captured:
            start_serial = valid_captured[0]
        else:
            start_serial = next_serial

        clean_serials = list(
            range(start_serial, start_serial + len(df))
        )

        if SERIAL_NO_COLUMN in df.columns:
            df[SERIAL_NO_COLUMN] = clean_serials
        else:
            df.insert(0, SERIAL_NO_COLUMN, clean_serials)

        if clean_serials:
            next_serial = clean_serials[-1] + 1

        table["df"] = df
        table["rows"], table["cols"] = df.shape


def finalize_extracted_tables(
    tables: List[Dict[str, Any]],
) -> None:
    apply_sequential_serial_numbers(tables)


# ---------------------------------------------------------------------
# Safe export helpers
# ---------------------------------------------------------------------

def safe_export_markdown(doc: Any) -> str:
    try:
        return doc.export_to_markdown() or ""
    except Exception as exc:
        logger.exception("Failed to export Markdown: %s", exc)
        return ""


def safe_export_dict(doc: Any) -> Dict[str, Any]:
    try:
        exported = doc.export_to_dict()

        if isinstance(exported, dict):
            return exported

        return {"document": exported}

    except Exception as exc:
        logger.exception("Failed to export JSON dictionary: %s", exc)
        return {"export_error": str(exc)}


def safe_table_to_dataframe(table: Any) -> pd.DataFrame:
    try:
        df = table.export_to_dataframe()

        if df is None:
            return pd.DataFrame()

        if not isinstance(df, pd.DataFrame):
            df = pd.DataFrame(df)

        df = df.copy()
        df.columns = [str(col).strip() for col in df.columns]

        df = normalize_transaction_table(df)

        return df

    except Exception as exc:
        logger.exception("Failed to convert table to DataFrame: %s", exc)
        return pd.DataFrame()


def clean_dataframe_for_json(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    return df.where(pd.notnull(df), None)


# ---------------------------------------------------------------------
# Table extraction
# ---------------------------------------------------------------------

def extract_tables_from_doc(
    doc: Any,
    page_number: Optional[int],
    next_table_id: int,
) -> Tuple[List[Dict[str, Any]], int]:
    extracted_tables: List[Dict[str, Any]] = []
    doc_tables = getattr(doc, "tables", None) or []

    for local_table_index, table in enumerate(doc_tables, start=1):
        df = safe_table_to_dataframe(table)
        rows, cols = df.shape

        extracted_tables.append(
            {
                "table_id": next_table_id,
                "page_number": page_number,
                "local_table_index": local_table_index,
                "rows": rows,
                "cols": cols,
                "df": df,
            }
        )

        next_table_id += 1

    return extracted_tables, next_table_id


# ---------------------------------------------------------------------
# Processing modes
# ---------------------------------------------------------------------

def process_whole_document(
    input_path: Path,
    converter: DocumentConverter,
    total_pages: int,
) -> Dict[str, Any]:
    logger.info("Processing full document: %s", input_path)

    conv_result = converter.convert(input_path)
    doc = conv_result.document

    markdown_text = safe_export_markdown(doc)
    json_data = safe_export_dict(doc)

    tables, _ = extract_tables_from_doc(
        doc=doc,
        page_number=None,
        next_table_id=1,
    )

    warnings: List[str] = []

    if not tables:
        warning = "No tables were detected in the full document."
        logger.warning(warning)
        warnings.append(warning)

    for table in tables:
        if table["rows"] == 0 and table["cols"] == 0:
            warning = f"Table {table['table_id']} is empty."
            logger.warning(warning)
            warnings.append(warning)

    return {
        "mode": "whole",
        "total_pages": total_pages,
        "processed_pages": list(range(1, total_pages + 1)),
        "failed_pages": [],
        "pages_with_tables": [],
        "pages_without_tables": [],
        "warnings": warnings,
        "markdown_text": markdown_text,
        "json_data": json_data,
        "tables": tables,
    }


def process_page_by_page(
    input_path: Path,
    converter: DocumentConverter,
    total_pages: int,
) -> Dict[str, Any]:
    processed_pages: List[int] = []
    failed_pages: List[int] = []
    pages_with_tables: List[int] = []
    pages_without_tables: List[int] = []
    warnings: List[str] = []

    markdown_parts: List[str] = []
    page_json_documents: Dict[str, Any] = {}
    all_tables: List[Dict[str, Any]] = []

    next_table_id = 1

    source_pdf = fitz.open(str(input_path))

    try:
        for page_index in range(total_pages):
            page_number = page_index + 1

            logger.info(
                "Processing page %s/%s",
                page_number,
                total_pages,
            )

            try:
                page_pdf_bytes = make_single_page_pdf_bytes(
                    source_pdf=source_pdf,
                    page_index=page_index,
                )

                conv_result = convert_pdf_bytes(
                    converter=converter,
                    pdf_bytes=page_pdf_bytes,
                    name=f"statement_page_{page_number}.pdf",
                )

                doc = conv_result.document
                processed_pages.append(page_number)

                page_markdown = safe_export_markdown(doc)

                markdown_parts.append(f"\n\n<!-- Page {page_number} -->\n\n")
                markdown_parts.append(f"# Page {page_number}\n\n")
                markdown_parts.append(page_markdown)

                page_json_documents[f"page_{page_number}"] = {
                    "page_number": page_number,
                    "document": safe_export_dict(doc),
                }

                page_tables, next_table_id = extract_tables_from_doc(
                    doc=doc,
                    page_number=page_number,
                    next_table_id=next_table_id,
                )

                all_tables.extend(page_tables)

                non_empty_tables = [
                    table
                    for table in page_tables
                    if not (
                        table["rows"] == 0
                        and table["cols"] == 0
                    )
                ]

                if not page_tables:
                    warning = f"No tables detected on page {page_number}."
                    logger.warning(warning)
                    warnings.append(warning)
                    pages_without_tables.append(page_number)

                elif not non_empty_tables:
                    warning = (
                        f"Page {page_number} produced only empty table objects."
                    )
                    logger.warning(warning)
                    warnings.append(warning)
                    pages_without_tables.append(page_number)

                else:
                    pages_with_tables.append(page_number)

                    for table in page_tables:
                        if table["rows"] == 0 and table["cols"] == 0:
                            warning = (
                                f"Page {page_number}, "
                                f"table {table['table_id']} is empty."
                            )
                            logger.warning(warning)
                            warnings.append(warning)

            except Exception as page_error:
                failed_pages.append(page_number)

                warning = (
                    f"Failed to process page {page_number}: {page_error}"
                )
                logger.exception(warning)
                warnings.append(warning)

                continue

    finally:
        source_pdf.close()

    json_data = {
        "processing_mode": "page",
        "source_file": input_path.name,
        "total_pages": total_pages,
        "processed_pages": processed_pages,
        "failed_pages": failed_pages,
        "pages_with_tables": pages_with_tables,
        "pages_without_tables": pages_without_tables,
        "documents": page_json_documents,
    }

    return {
        "mode": "page",
        "total_pages": total_pages,
        "processed_pages": processed_pages,
        "failed_pages": failed_pages,
        "pages_with_tables": pages_with_tables,
        "pages_without_tables": pages_without_tables,
        "warnings": warnings,
        "markdown_text": "".join(markdown_parts).strip() + "\n",
        "json_data": json_data,
        "tables": all_tables,
    }


# ---------------------------------------------------------------------
# Output generation
# ---------------------------------------------------------------------

def save_outputs(
    base_dir: Path,
    output_dir: Path,
    result: Dict[str, Any],
    processing_time: float,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    markdown_path = output_dir / OUTPUT_MARKDOWN
    json_path = output_dir / OUTPUT_JSON
    tables_json_path = output_dir / OUTPUT_TABLES_JSON
    tables_csv_path = output_dir / OUTPUT_TABLES_CSV
    comparison_path = base_dir / COMPARISON_REPORT

    markdown_text = result["markdown_text"]
    json_data = result["json_data"]
    tables = result["tables"]

    with open(markdown_path, "w", encoding="utf-8") as file:
        file.write(markdown_text)

    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(
            json_data,
            file,
            indent=2,
            default=str,
        )

    tables_json: Dict[str, Any] = {}

    for table in tables:
        table_key = f"table_{table['table_id']}"
        clean_df = clean_dataframe_for_json(table["df"])

        tables_json[table_key] = clean_df.to_dict(
            orient="records"
        )

    with open(tables_json_path, "w", encoding="utf-8") as file:
        json.dump(
            tables_json,
            file,
            indent=2,
            default=str,
        )

    with open(tables_csv_path, "w", encoding="utf-8") as file:
        if not tables:
            file.write("No tables detected\n")

        else:
            for table in tables:
                table_id = table["table_id"]
                page_number = table["page_number"]
                df = table["df"]

                if page_number is None:
                    file.write(f"--- Table {table_id} ---\n")
                else:
                    file.write(
                        f"--- Table {table_id} | Page {page_number} ---\n"
                    )

                if df.empty:
                    file.write("(empty table)\n\n")
                else:
                    df.to_csv(
                        file,
                        index=False,
                    )
                    file.write("\n")

    report = build_comparison_report(
        result=result,
        processing_time=processing_time,
        markdown_text=markdown_text,
    )

    with open(comparison_path, "w", encoding="utf-8") as file:
        file.write(report)

    logger.info("Markdown written to: %s", markdown_path)
    logger.info("JSON written to: %s", json_path)
    logger.info("Tables JSON written to: %s", tables_json_path)
    logger.info("Tables CSV written to: %s", tables_csv_path)
    logger.info("Comparison report written to: %s", comparison_path)


def build_comparison_report(
    result: Dict[str, Any],
    processing_time: float,
    markdown_text: str,
) -> str:
    tables = result["tables"]
    warnings = result["warnings"]

    transaction_tables = [
        table
        for table in tables
        if is_transaction_table(table.get("df", pd.DataFrame()))
    ]

    total_transaction_rows = sum(
        table["rows"]
        for table in transaction_tables
    )

    lines: List[str] = [
        "Docling Extraction Comparison Report",
        "====================================",
        f"Processing mode: {result['mode']}",
        f"Number of pages: {result['total_pages']}",
        f"Pages processed: {len(result['processed_pages'])}",
        f"Processed page numbers: {result['processed_pages']}",
        f"Failed pages: {result['failed_pages']}",
    ]

    if result["mode"] == "page":
        lines.extend(
            [
                f"Pages with non-empty tables: {result['pages_with_tables']}",
                f"Pages without usable tables: {result['pages_without_tables']}",
            ]
        )

    lines.append(f"Number of tables detected: {len(tables)}")
    lines.append(f"Transaction tables detected: {len(transaction_tables)}")
    lines.append(f"Total transaction rows: {total_transaction_rows}")

    for table in tables:
        page_label = (
            "unknown"
            if table["page_number"] is None
            else str(table["page_number"])
        )

        lines.append(
            f"Table {table['table_id']}: "
            f"page={page_label}, "
            f"rows={table['rows']}, "
            f"columns={table['cols']}"
        )

    lines.extend(
        [
            f"Total extracted text length (characters): {len(markdown_text)}",
            f"Processing time: {processing_time:.2f} seconds",
            "OCR Enabled: True (via pipeline_options.do_ocr)",
            "Post-processing: Enabled",
            "Numeric OCR correction: Enabled",
            "Serial number recovery: Enabled",
            "Normalized columns: Serial No., Value Date, Cheque No.",
        ]
    )

    if warnings:
        lines.append("Warnings:")

        for warning in warnings:
            lines.append(f"- {warning}")

    else:
        lines.append("Warnings: None")

    return "\n".join(lines) + "\n"


def print_summary(
    result: Dict[str, Any],
    processing_time: float,
) -> None:
    tables = result["tables"]

    transaction_tables = [
        table
        for table in tables
        if is_transaction_table(table.get("df", pd.DataFrame()))
    ]

    total_transaction_rows = sum(
        table["rows"]
        for table in transaction_tables
    )

    print("\n--- Processing Summary ---")
    print(f"Processing mode        : {result['mode']}")
    print(f"Number of pages        : {result['total_pages']}")
    print(f"Pages processed        : {len(result['processed_pages'])}")
    print(f"Failed pages           : {result['failed_pages']}")

    if result["mode"] == "page":
        print(f"Pages with tables      : {result['pages_with_tables']}")
        print(f"Pages without tables   : {result['pages_without_tables']}")

    print(f"Number of tables       : {len(tables)}")
    print(f"Transaction tables     : {len(transaction_tables)}")
    print(f"Transaction rows       : {total_transaction_rows}")

    for table in tables:
        page_label = (
            "unknown"
            if table["page_number"] is None
            else table["page_number"]
        )

        print(
            f"  - Table {table['table_id']}: "
            f"page={page_label}, "
            f"{table['rows']} rows, "
            f"{table['cols']} cols"
        )

    print(f"Total processing time  : {processing_time:.2f} seconds")

    if result["warnings"]:
        print("Warnings:")

        for warning in result["warnings"]:
            print(f"  - {warning}")

    print("--------------------------\n")


# ---------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------

def validate_process_mode(mode: str) -> str:
    allowed_modes = {"whole", "page"}

    if mode not in allowed_modes:
        raise ValueError(
            f"Invalid PROCESS_MODE={mode!r}. Use 'whole' or 'page'."
        )

    return mode


# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------

def main() -> None:
    start_time = time.time()

    base_dir = Path(__file__).parent
    input_dir = base_dir / "input"
    output_dir = base_dir / "output"

    input_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    input_path = input_dir / INPUT_FILENAME

    if not input_path.exists():
        logger.error(
            "Input file does not exist: %s. "
            "Please place your bank statement PDF at input/%s",
            input_path,
            INPUT_FILENAME,
        )
        return

    try:
        process_mode = validate_process_mode(PROCESS_MODE)
        total_pages = get_total_pages(input_path)

        logger.info("Input PDF: %s", input_path)
        logger.info("Total pages detected: %s", total_pages)
        logger.info("Processing mode: %s", process_mode)

        converter = build_converter()

        if process_mode == "whole":
            result = process_whole_document(
                input_path=input_path,
                converter=converter,
                total_pages=total_pages,
            )

        else:
            result = process_page_by_page(
                input_path=input_path,
                converter=converter,
                total_pages=total_pages,
            )

        finalize_extracted_tables(result["tables"])

        processing_time = time.time() - start_time

        save_outputs(
            base_dir=base_dir,
            output_dir=output_dir,
            result=result,
            processing_time=processing_time,
        )

        print_summary(
            result=result,
            processing_time=processing_time,
        )

        logger.info("Processing complete.")

    except Exception as exc:
        logger.exception(
            "An error occurred during processing: %s",
            exc,
        )


if __name__ == "__main__":
    main()