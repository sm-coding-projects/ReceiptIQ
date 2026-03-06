"""
Tesseract OCR Text Extraction Module
=====================================

Wraps pytesseract to extract raw text and per-word confidence scores
from a preprocessed receipt image.
"""

import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)

# Default Tesseract configuration tuned for receipt-like documents.
#   --oem 3  = default OCR Engine Mode (best available)
#   --psm 6  = assume a single uniform block of text
DEFAULT_TESSERACT_CONFIG = "--oem 3 --psm 6"


def _numpy_to_pil(image: np.ndarray) -> Image.Image:
    """Convert an OpenCV numpy image to a Pillow Image.

    Handles both single-channel (grayscale) and 3-channel (BGR) inputs.
    """
    if len(image.shape) == 2:
        return Image.fromarray(image, mode="L")
    # OpenCV uses BGR; Pillow expects RGB
    import cv2
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


def extract_text(
    image: np.ndarray,
    config: Optional[str] = None,
    lang: str = "eng",
) -> Dict[str, Any]:
    """Run Tesseract OCR on *image* and return structured output.

    Args:
        image: Preprocessed image as a numpy array (grayscale or BGR).
        config: Tesseract CLI config string.  Uses ``DEFAULT_TESSERACT_CONFIG``
                if not supplied.
        lang: Tesseract language pack to use (default ``eng``).

    Returns:
        A dictionary with keys:
            - ``text`` (str): The full extracted text.
            - ``confidence`` (float): Mean per-word confidence (0.0 – 100.0 scale).
            - ``word_count`` (int): Number of words detected.
            - ``details`` (list[dict]): Per-word data including text, confidence,
              bounding box, and block / paragraph / line indices.
    """
    if image is None or image.size == 0:
        logger.warning("Received empty image; returning blank extraction")
        return _empty_result()

    effective_config = config or DEFAULT_TESSERACT_CONFIG
    pil_image = _numpy_to_pil(image)

    # --- Full-text extraction ---
    try:
        raw_text: str = pytesseract.image_to_string(
            pil_image, lang=lang, config=effective_config
        )
    except pytesseract.TesseractError as exc:
        logger.error("Tesseract image_to_string failed: %s", exc)
        return _empty_result(error=str(exc))

    # --- Per-word confidence data ---
    word_details: List[Dict[str, Any]] = []
    confidences: List[float] = []

    try:
        data = pytesseract.image_to_data(
            pil_image, lang=lang, config=effective_config, output_type=pytesseract.Output.DICT
        )

        n_items = len(data.get("text", []))
        for i in range(n_items):
            word_text = str(data["text"][i]).strip()
            conf = float(data["conf"][i])

            # Tesseract returns -1 for items that are not real words
            if conf < 0 or not word_text:
                continue

            word_details.append(
                {
                    "text": word_text,
                    "confidence": conf,
                    "left": int(data["left"][i]),
                    "top": int(data["top"][i]),
                    "width": int(data["width"][i]),
                    "height": int(data["height"][i]),
                    "block_num": int(data["block_num"][i]),
                    "par_num": int(data["par_num"][i]),
                    "line_num": int(data["line_num"][i]),
                    "word_num": int(data["word_num"][i]),
                }
            )
            confidences.append(conf)

    except pytesseract.TesseractError as exc:
        logger.warning("Tesseract image_to_data failed: %s — falling back to text-only", exc)

    mean_confidence = _safe_mean(confidences) if confidences else 0.0

    logger.info(
        "Extraction complete: %d words, mean confidence %.1f%%, text length %d chars",
        len(word_details),
        mean_confidence,
        len(raw_text),
    )

    return {
        "text": raw_text.strip(),
        "confidence": mean_confidence,
        "word_count": len(word_details),
        "details": word_details,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_mean(values: List[float]) -> float:
    """Return the arithmetic mean, guarding against empty lists."""
    if not values:
        return 0.0
    return sum(values) / len(values)


def _empty_result(error: Optional[str] = None) -> Dict[str, Any]:
    """Return a well-formed but empty extraction result."""
    result: Dict[str, Any] = {
        "text": "",
        "confidence": 0.0,
        "word_count": 0,
        "details": [],
    }
    if error:
        result["error"] = error
    return result
