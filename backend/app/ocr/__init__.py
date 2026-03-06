"""
OCR Pipeline Package
====================

Provides end-to-end receipt OCR processing: image preprocessing,
text extraction via Tesseract, field parsing, and structured output.

Usage:
    from app.ocr import process_receipt

    result = process_receipt("/path/to/receipt.jpg")
"""

from app.ocr.pipeline import process_receipt
from app.ocr.preprocessor import preprocess_receipt
from app.ocr.extractor import extract_text
from app.ocr.parser import parse_receipt
from app.ocr.line_item_parser import parse_line_items

__all__ = [
    "process_receipt",
    "preprocess_receipt",
    "extract_text",
    "parse_receipt",
    "parse_line_items",
]
