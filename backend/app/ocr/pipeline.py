"""
OCR Pipeline Orchestrator
=========================

Chains the preprocessing, extraction, parsing, and serialization stages
into a single ``process_receipt`` call that accepts a file path and
returns a fully structured receipt dictionary.

The orchestrator:
    - Logs every stage with timing
    - Handles errors gracefully, returning partial results
    - Produces the canonical output schema expected by the rest of the app
"""

import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Union

from app.ocr.preprocessor import preprocess_receipt
from app.ocr.extractor import extract_text
from app.ocr.parser import parse_receipt as parse_receipt_fields

logger = logging.getLogger(__name__)


def process_receipt(file_path: Union[str, Path]) -> Dict[str, Any]:
    """Run the full OCR pipeline on a receipt image.

    Pipeline stages:
        1. **Preprocess** — load, grayscale, enhance, denoise, deskew, threshold
        2. **Extract** — run Tesseract OCR to get raw text and confidence data
        3. **Parse** — regex/heuristic extraction of structured fields
        4. **Serialize** — assemble the canonical output dictionary

    Args:
        file_path: Absolute or relative path to the receipt image file.

    Returns:
        A dictionary conforming to the Receipt OCR output schema::

            {
                "vendor_name": str | None,
                "vendor_address": str | None,
                "receipt_number": str | None,
                "transaction_date": str | None,
                "transaction_time": str | None,
                "currency": str,
                "subtotal": float | None,
                "tax": float | None,
                "total": float | None,
                "payment_method": str | None,
                "line_items": [...],
                "confidence": float,
                "raw_text": str,
                "extraction_metadata": {
                    "processing_time_ms": float,
                    "tesseract_confidence": float,
                    "field_confidences": dict,
                    "warnings": list,
                },
            }

    The function never raises; errors are captured and included in the
    ``extraction_metadata.warnings`` list, with ``confidence`` set to 0.
    """
    file_path = Path(file_path)
    pipeline_start = time.perf_counter()

    warnings: List[str] = []
    stage_timings: Dict[str, float] = {}

    raw_text = ""
    tesseract_confidence = 0.0
    parsed: Dict[str, Any] = {}

    # ------------------------------------------------------------------
    # Stage 1: Preprocessing
    # ------------------------------------------------------------------
    preprocessed_image = None
    try:
        t0 = time.perf_counter()
        preprocessed_image = preprocess_receipt(file_path)
        stage_timings["preprocess_ms"] = _elapsed_ms(t0)
        logger.info("Stage 1 (preprocess) complete in %.1f ms", stage_timings["preprocess_ms"])
    except FileNotFoundError:
        logger.error("File not found: %s", file_path)
        warnings.append(f"File not found: {file_path}")
        return _error_result(file_path, warnings, _elapsed_ms(pipeline_start))
    except ValueError as exc:
        logger.error("Cannot load image: %s", exc)
        warnings.append(f"Image load error: {exc}")
        return _error_result(file_path, warnings, _elapsed_ms(pipeline_start))
    except Exception as exc:
        logger.exception("Unexpected preprocessing error")
        warnings.append(f"Preprocessing error: {exc}")
        return _error_result(file_path, warnings, _elapsed_ms(pipeline_start))

    # ------------------------------------------------------------------
    # Stage 2: Text extraction
    # ------------------------------------------------------------------
    try:
        t0 = time.perf_counter()
        extraction = extract_text(preprocessed_image)
        stage_timings["extract_ms"] = _elapsed_ms(t0)
        logger.info("Stage 2 (extract) complete in %.1f ms", stage_timings["extract_ms"])

        raw_text = extraction.get("text", "")
        tesseract_confidence = extraction.get("confidence", 0.0)

        if extraction.get("error"):
            warnings.append(f"Tesseract error: {extraction['error']}")

        if not raw_text.strip():
            warnings.append("No text extracted from image")
            logger.warning("Tesseract returned no text for %s", file_path)
    except Exception as exc:
        logger.exception("Text extraction failed")
        warnings.append(f"Extraction error: {exc}")
        stage_timings["extract_ms"] = _elapsed_ms(t0)

    # ------------------------------------------------------------------
    # Stage 3: Field parsing
    # ------------------------------------------------------------------
    try:
        t0 = time.perf_counter()
        parsed = parse_receipt_fields(raw_text)
        stage_timings["parse_ms"] = _elapsed_ms(t0)
        logger.info("Stage 3 (parse) complete in %.1f ms", stage_timings["parse_ms"])

        # Merge parser warnings
        parser_warnings = parsed.pop("warnings", [])
        warnings.extend(parser_warnings)
    except Exception as exc:
        logger.exception("Parsing failed")
        warnings.append(f"Parsing error: {exc}")
        stage_timings["parse_ms"] = _elapsed_ms(t0)

    # ------------------------------------------------------------------
    # Stage 4: Assemble canonical output
    # ------------------------------------------------------------------
    total_ms = _elapsed_ms(pipeline_start)
    stage_timings["total_ms"] = total_ms

    field_confidences = parsed.pop("field_confidences", {})
    overall_confidence_from_parser = parsed.pop("overall_confidence", 0.0)

    # Blend Tesseract confidence (0-100) with parser confidence (0-1)
    tesseract_norm = tesseract_confidence / 100.0 if tesseract_confidence > 1 else tesseract_confidence
    blended_confidence = round(
        0.4 * tesseract_norm + 0.6 * overall_confidence_from_parser, 4
    )

    result: Dict[str, Any] = {
        "vendor_name": parsed.get("vendor_name"),
        "vendor_address": parsed.get("vendor_address"),
        "receipt_number": parsed.get("receipt_number"),
        "transaction_date": parsed.get("transaction_date"),
        "transaction_time": parsed.get("transaction_time"),
        "currency": parsed.get("currency", "USD"),
        "subtotal": parsed.get("subtotal"),
        "tax": parsed.get("tax"),
        "total": parsed.get("total"),
        "payment_method": parsed.get("payment_method"),
        "line_items": parsed.get("line_items", []),
        "confidence": blended_confidence,
        "raw_text": raw_text,
        "extraction_metadata": {
            "processing_time_ms": round(total_ms, 2),
            "tesseract_confidence": round(tesseract_confidence, 2),
            "field_confidences": field_confidences,
            "warnings": warnings,
            "stage_timings": stage_timings,
        },
    }

    logger.info(
        "Pipeline complete for %s in %.1f ms — confidence=%.2f, total=%s, %d items",
        file_path.name,
        total_ms,
        blended_confidence,
        result["total"],
        len(result["line_items"]),
    )
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _elapsed_ms(start: float) -> float:
    """Return milliseconds elapsed since *start* (from ``time.perf_counter``)."""
    return (time.perf_counter() - start) * 1000.0


def _error_result(
    file_path: Path,
    warnings: List[str],
    processing_time_ms: float,
) -> Dict[str, Any]:
    """Return a valid but empty result dict when the pipeline cannot proceed."""
    return {
        "vendor_name": None,
        "vendor_address": None,
        "receipt_number": None,
        "transaction_date": None,
        "transaction_time": None,
        "currency": "USD",
        "subtotal": None,
        "tax": None,
        "total": None,
        "payment_method": None,
        "line_items": [],
        "confidence": 0.0,
        "raw_text": "",
        "extraction_metadata": {
            "processing_time_ms": round(processing_time_ms, 2),
            "tesseract_confidence": 0.0,
            "field_confidences": {},
            "warnings": warnings,
            "stage_timings": {},
        },
    }
