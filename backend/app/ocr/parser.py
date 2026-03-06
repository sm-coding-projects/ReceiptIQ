"""
Receipt Field Parser
====================

Extracts structured fields from raw OCR text using regex patterns and
keyword-based heuristics.  Each extraction function returns a value
together with a confidence score (0.0 – 1.0) so downstream consumers
can judge reliability.

The module is intentionally designed for easy extension: add new
``_extract_*`` helpers and register them in ``parse_receipt`` to support
additional receipt layouts or locales.
"""

import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from app.ocr.line_item_parser import parse_line_items

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Compiled regex patterns
# ---------------------------------------------------------------------------

# Dates — ordered from most specific to most ambiguous
_DATE_PATTERNS: List[Tuple[re.Pattern, str]] = [
    # ISO: 2024-01-15
    (re.compile(r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b"), "YYYY-MM-DD"),
    # US: 01/15/2024 or 01-15-2024
    (re.compile(r"\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b"), "MM/DD/YYYY"),
    # Short year: 01/15/24
    (re.compile(r"\b(\d{1,2}[-/]\d{1,2}[-/]\d{2})\b"), "MM/DD/YY"),
    # Written month: Jan 15, 2024 | 15 Jan 2024
    (re.compile(
        r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4})\b",
        re.IGNORECASE,
    ), "DD Mon YYYY"),
    (re.compile(
        r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s]+\d{1,2}[\s,]+\d{2,4})\b",
        re.IGNORECASE,
    ), "Mon DD YYYY"),
]

# Time — HH:MM or HH:MM:SS, 12/24-hour
_TIME_PATTERNS: List[re.Pattern] = [
    re.compile(r"\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b"),
]

# Monetary amounts
_MONEY_PATTERN = re.compile(
    r"[\$\u00A3\u20AC]?\s*(\d{1,6}(?:[,]\d{3})*\.\d{2})\b"
)

# Receipt / transaction number
_RECEIPT_NUM_PATTERNS: List[re.Pattern] = [
    re.compile(r"(?:receipt|rcpt|trans(?:action)?|order|invoice|ref|ticket|check)\s*#?\s*[:.]?\s*([A-Za-z0-9\-]{3,20})", re.IGNORECASE),
    re.compile(r"#\s*(\d{4,20})"),
]

# Payment method keywords (case-insensitive match)
_PAYMENT_KEYWORDS = {
    "visa": "VISA",
    "mastercard": "MASTERCARD",
    "master card": "MASTERCARD",
    "amex": "AMEX",
    "american express": "AMEX",
    "discover": "DISCOVER",
    "debit": "DEBIT",
    "credit": "CREDIT",
    "cash": "CASH",
    "check": "CHECK",
    "cheque": "CHECK",
    "apple pay": "APPLE PAY",
    "google pay": "GOOGLE PAY",
    "paypal": "PAYPAL",
}

# Currency symbols to currency codes
_CURRENCY_MAP = {
    "$": "USD",
    "\u00A3": "GBP",  # £
    "\u20AC": "EUR",  # €
    "\u00A5": "JPY",  # ¥
}

# Keywords used to locate specific monetary fields
_TOTAL_KEYWORDS = re.compile(
    r"^\s*(grand\s*total|total\s*due|total|amount\s*due|balance\s*due|you\s*owe)",
    re.IGNORECASE | re.MULTILINE,
)
_SUBTOTAL_KEYWORDS = re.compile(
    r"^\s*(sub\s*total|subtotal|net\s*amount|net\s*total|items?\s*total)",
    re.IGNORECASE | re.MULTILINE,
)
_TAX_KEYWORDS = re.compile(
    r"^\s*(sales?\s*tax|tax|vat|hst|gst|pst)",
    re.IGNORECASE | re.MULTILINE,
)


# ---------------------------------------------------------------------------
# Individual field extractors
# ---------------------------------------------------------------------------


def _extract_vendor_name(lines: List[str]) -> Tuple[Optional[str], float]:
    """Heuristic: the vendor name is typically one of the first non-empty lines.

    We skip lines that look like dates, purely numeric strings, or very
    short noise tokens.
    """
    for line in lines[:5]:
        stripped = line.strip()
        if not stripped or len(stripped) < 2:
            continue
        # Skip if the line is a date or number only
        if re.fullmatch(r"[\d\s/\-:.]+", stripped):
            continue
        # Skip if it looks like an address fragment starting with a number
        # but allow it if it contains letters (could be store name with number)
        if re.fullmatch(r"\d+", stripped):
            continue
        return stripped, 0.6
    return None, 0.0


def _extract_vendor_address(lines: List[str]) -> Tuple[Optional[str], float]:
    """Look for an address block among the first several lines.

    Addresses often contain digits, commas, state abbreviations, and zip codes.
    """
    # Simple pattern: a line with digits + letters that looks like a street
    address_parts: List[str] = []
    collecting = False

    for line in lines[:10]:
        stripped = line.strip()
        if not stripped:
            if collecting:
                break  # blank line ends the address block
            continue

        # Start collecting when we see something address-like
        has_digit = bool(re.search(r"\d", stripped))
        has_alpha = bool(re.search(r"[A-Za-z]", stripped))

        # Typical address line: "123 Main St" or "City, ST 12345"
        is_address_like = (
            has_digit
            and has_alpha
            and (
                re.search(r"\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|plaza|pl|suite|ste|apt|floor|fl)\b", stripped, re.IGNORECASE)
                or re.search(r"\b[A-Z]{2}\s+\d{5}", stripped)  # State + ZIP
                or re.search(r"\d{5}(?:-\d{4})?", stripped)     # ZIP code
                or re.search(r",\s*[A-Z]{2}\b", stripped)       # ", ST"
            )
        )

        if is_address_like:
            collecting = True
            address_parts.append(stripped)
        elif collecting:
            # Continue collecting if we already started and line has content
            if has_alpha:
                address_parts.append(stripped)
            else:
                break

    if address_parts:
        return ", ".join(address_parts), 0.5
    return None, 0.0


def _extract_receipt_number(text: str) -> Tuple[Optional[str], float]:
    """Search for a receipt / transaction number using known label patterns."""
    for pattern in _RECEIPT_NUM_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1).strip(), 0.8
    return None, 0.0


def _extract_date(text: str) -> Tuple[Optional[str], float]:
    """Find the first plausible date string."""
    for pattern, fmt in _DATE_PATTERNS:
        match = pattern.search(text)
        if match:
            logger.debug("Matched date format %s: %s", fmt, match.group(1))
            return match.group(1).strip(), 0.85
    return None, 0.0


def _extract_time(text: str) -> Tuple[Optional[str], float]:
    """Find the first plausible time string."""
    for pattern in _TIME_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1).strip(), 0.8
    return None, 0.0


def _extract_currency(text: str) -> Tuple[str, float]:
    """Detect currency from symbols present in the text."""
    for symbol, code in _CURRENCY_MAP.items():
        if symbol in text:
            return code, 0.9
    # Default to USD if monetary amounts exist but no symbol found
    if _MONEY_PATTERN.search(text):
        return "USD", 0.4
    return "USD", 0.1


def _find_amount_near_keyword(
    text: str, keyword_pattern: re.Pattern
) -> Tuple[Optional[float], float]:
    """Find a monetary amount on the same line as (or near) a keyword match.

    Searches each line of *text* for the keyword pattern, then looks for
    a dollar amount on that line or the next line.
    """
    lines = text.split("\n")
    for idx, line in enumerate(lines):
        if keyword_pattern.search(line):
            # Look on the same line first
            amount = _extract_last_amount(line)
            if amount is not None:
                return amount, 0.85

            # Check the next line
            if idx + 1 < len(lines):
                amount = _extract_last_amount(lines[idx + 1])
                if amount is not None:
                    return amount, 0.6
    return None, 0.0


def _extract_last_amount(line: str) -> Optional[float]:
    """Return the last monetary amount found in *line*, or ``None``."""
    matches = _MONEY_PATTERN.findall(line)
    if matches:
        try:
            return float(matches[-1].replace(",", ""))
        except ValueError:
            return None
    return None


def _extract_total(text: str) -> Tuple[Optional[float], float]:
    """Extract the receipt total."""
    total, conf = _find_amount_near_keyword(text, _TOTAL_KEYWORDS)
    if total is not None:
        return total, conf

    # Fallback: the largest monetary amount in the text is often the total
    all_amounts = _MONEY_PATTERN.findall(text)
    if all_amounts:
        try:
            amounts = [float(a.replace(",", "")) for a in all_amounts]
            return max(amounts), 0.3
        except ValueError:
            pass
    return None, 0.0


def _extract_subtotal(text: str) -> Tuple[Optional[float], float]:
    return _find_amount_near_keyword(text, _SUBTOTAL_KEYWORDS)


def _extract_tax(text: str) -> Tuple[Optional[float], float]:
    return _find_amount_near_keyword(text, _TAX_KEYWORDS)


def _extract_payment_method(text: str) -> Tuple[Optional[str], float]:
    """Detect payment method keywords in the text."""
    text_lower = text.lower()
    for keyword, label in _PAYMENT_KEYWORDS.items():
        if keyword in text_lower:
            # Higher confidence if it appears near typical label words
            context_pattern = re.compile(
                r"(payment|paid|tender|method|card|type).*" + re.escape(keyword),
                re.IGNORECASE,
            )
            if context_pattern.search(text):
                return label, 0.9
            return label, 0.6
    return None, 0.0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_receipt(raw_text: str) -> Dict[str, Any]:
    """Parse raw OCR text into structured receipt fields.

    Args:
        raw_text: The full OCR text output from Tesseract.

    Returns:
        A dictionary containing all extracted fields, their values,
        per-field confidence scores, and any warnings encountered.
    """
    if not raw_text or not raw_text.strip():
        logger.warning("Empty text received by parser")
        return _empty_parse_result()

    lines = [l for l in raw_text.split("\n")]
    non_empty_lines = [l for l in lines if l.strip()]

    warnings: List[str] = []

    # --- Extract each field ---
    vendor_name, vendor_name_conf = _extract_vendor_name(non_empty_lines)
    vendor_address, vendor_address_conf = _extract_vendor_address(non_empty_lines)
    receipt_number, receipt_number_conf = _extract_receipt_number(raw_text)
    transaction_date, date_conf = _extract_date(raw_text)
    transaction_time, time_conf = _extract_time(raw_text)
    currency, currency_conf = _extract_currency(raw_text)
    subtotal, subtotal_conf = _extract_subtotal(raw_text)
    tax, tax_conf = _extract_tax(raw_text)
    total, total_conf = _extract_total(raw_text)
    payment_method, payment_conf = _extract_payment_method(raw_text)

    # --- Line items ---
    line_items = parse_line_items(raw_text)

    # --- Sanity checks ---
    if total is not None and subtotal is not None and tax is not None:
        expected = round(subtotal + tax, 2)
        if abs(expected - total) > 0.02:
            warnings.append(
                f"Total ({total}) does not equal subtotal ({subtotal}) + tax ({tax}) = {expected}"
            )

    if total is not None and subtotal is not None and total < subtotal:
        warnings.append("Total is less than subtotal — possible extraction error")

    # --- Aggregate confidence ---
    field_confidences = {
        "vendor_name": vendor_name_conf,
        "vendor_address": vendor_address_conf,
        "receipt_number": receipt_number_conf,
        "transaction_date": date_conf,
        "transaction_time": time_conf,
        "currency": currency_conf,
        "subtotal": subtotal_conf,
        "tax": tax_conf,
        "total": total_conf,
        "payment_method": payment_conf,
    }

    # Overall confidence: weighted average of fields that were found
    found_confidences = [c for c in field_confidences.values() if c > 0]
    overall_confidence = (
        sum(found_confidences) / len(found_confidences) if found_confidences else 0.0
    )

    result: Dict[str, Any] = {
        "vendor_name": vendor_name,
        "vendor_address": vendor_address,
        "receipt_number": receipt_number,
        "transaction_date": transaction_date,
        "transaction_time": transaction_time,
        "currency": currency,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "payment_method": payment_method,
        "line_items": line_items,
        "confidence": round(overall_confidence, 4),
        "raw_text": raw_text,
        "field_confidences": field_confidences,
        "overall_confidence": round(overall_confidence, 4),
        "warnings": warnings,
    }

    logger.info(
        "Parsed receipt: total=%s, vendor=%s, %d line items, confidence=%.2f",
        total,
        vendor_name,
        len(line_items),
        overall_confidence,
    )
    return result


def _empty_parse_result() -> Dict[str, Any]:
    """Return a well-formed but empty parse result."""
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
        "field_confidences": {},
        "overall_confidence": 0.0,
        "warnings": ["No text available for parsing"],
    }
