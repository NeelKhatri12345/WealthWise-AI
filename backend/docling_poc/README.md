# IBM Docling POC - Bank Statement Extractor

This Proof of Concept (POC) evaluates IBM Docling for extracting tables and text from bank statements.

## Features
- Extracts full document text to Markdown (`extracted.md`)
- Extracts document structure to JSON (`extracted.json`)
- Extracts all detected tables to JSON and CSV formats
- Gracefully handles PDFs with no tables (logs a warning)
- Generates a `comparison.txt` report for benchmarking against other tools like PaddleOCR.

## Folder Structure
```
docling_poc/
├── input/
│     └── statement.pdf       <-- Place your PDF here
├── output/                   <-- Generated automatically
│     ├── extracted.md
│     ├── extracted.json
│     ├── extracted_tables.json
│     └── extracted_tables.csv
├── main.py                   <-- Main executable script
├── requirements.txt          <-- Python dependencies
├── comparison.txt            <-- Generated benchmarking report
└── README.md
```

## Prerequisites
- macOS
- Python 3.11

## Installation

1. Navigate to the POC directory:
   ```bash
   cd docling_poc
   ```
2. (Optional) Create and activate a virtual environment:
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Place your target bank statement PDF inside the `input` directory and name it `statement.pdf`.
2. Run the script:
   ```bash
   python main.py
   ```
3. Check the `output/` directory for the extracted files and the root directory for `comparison.txt`.

## Technical Details & Limitations

- **OCR Usage**: OCR is explicitly enabled (`do_ocr=True`) in the pipeline configuration. Docling uses its default backend (typically EasyOCR or RapidOCR) to extract text from scanned PDFs or images embedded in digital PDFs.
- **Digital vs. Scanned**: Docling automatically distinguishes between digital text and scanned images within the PDF. Digital text is read directly from the PDF stream, while images/scanned pages are passed through the OCR engine.
- **Output Formats**: 
  - Markdown (`.md`)
  - JSON (Full document structure and isolated tables)
  - CSV (Isolated tables)
- **Limitations**:
  - Complex nested tables or borderless tables might sometimes be misinterpreted.
  - OCR processing on high-resolution scanned PDFs can be CPU-intensive and increase processing time.
