"""
Line Item Parser
================

Extracts individual line items from raw OCR receipt text.

Supports several common formats:
    - ``ITEM NAME          $9.99``
    - ``ITEM NAME     9.99``
    - ``2 x ITEM NAME      $19.98``
    - ``2x ITEM NAME       $19.98``
    - ``ITEM NAME   2   $9.99   $19.98``
    - ``ITEM NAME              $9.99 x2``

The parser is intentionally conservative: it only emits items where
a clear price can be identified, and defaults quantity to 1 when
undetectable.
"""

import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# A monetary amount (with or without $ prefix)
_PRICE_RE = re.compile(r"[\$]?\s*(\d{1,6}(?:,\d{3})*\.\d{2})")

# Quantity prefix: "2x ", "2 x ", "3 X "
_QTY_PREFIX_RE = re.compile(r"^(\d{1,3})\s*[xX]\s+(.+)")

# Quantity suffix: "... x2", "... X 3"
_QTY_SUFFIX_RE = re.compile(r"(.+?)\s*[xX]\s*(\d{1,3})\s*$")

# Quantity + price in columnar form: "ITEM   2   $9.99   $19.98"
_COLUMNAR_RE = re.compile(
    r"^(.+?)\s{2,}(\d{1,3})\s{2,}"
    r"[\$]?\s*(\d{1,6}(?:,\d{3})*\.\d{2})\s+"
    r"[\$]?\s*(\d{1,6}(?:,\d{3})*\.\d{2})\s*$"
)

# Lines that are clearly NOT items (used as stop / skip markers)
_SKIP_KEYWORDS = re.compile(
    r"^\s*("
    r"sub\s*total|subtotal|total|tax|sales\s*tax|vat|hst|gst|pst|"
    r"change|balance|amount\s*due|grand\s*total|you\s*owe|"
    r"payment|visa|mastercard|amex|debit|credit|cash|"
    r"thank\s*you|receipt|date|time|store|#|ref|"
    r"card\s*ending|approval|auth|terminal|"
    r"phone|tel|fax|www\.|http|email|"
    r"discount|coupon|savings|member|loyalty|rewards|points"
    r")\b",
    re.IGNORECASE,
)

# Lines that look like section headers or separators
_SEPARATOR_RE = re.compile(r"^[\s\-=*_#]{3,}$")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_line_items(raw_text: str) -> List[Dict[str, Any]]:
    """Extract line items from raw OCR receipt text.

    Args:
        raw_text: The full OCR text.

    Returns:
        A list of dicts, each with keys ``name``, ``quantity``,
        ``unit_price``, and ``total_price``.
    """
    if not raw_text or not raw_text.strip():
        return []

    lines = raw_text.split("\n")
    items: List[Dict[str, Any]] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip obvious non-item lines
        if _SEPARATOR_RE.match(stripped):
            continue
        if _SKIP_KEYWORDS.search(stripped):
            continue

        item = _try_parse_line(stripped)
        if item is not None:
            items.append(item)

    logger.debug("Extracted %d line items from %d text lines", len(items), len(lines))
    return items


# ---------------------------------------------------------------------------
# Internal parsers (tried in order of specificity)
# ---------------------------------------------------------------------------


def _try_parse_line(line: str) -> Optional[Dict[str, Any]]:
    """Attempt to parse a single line as a line item.

    Returns a dict or ``None`` if the line does not look like an item.
    """
    # Strategy 1: Columnar format — "ITEM   QTY   UNIT   TOTAL"
    item = _try_columnar(line)
    if item:
        return item

    # Strategy 2: Quantity prefix — "2x ITEM   $19.98"
    item = _try_qty_prefix(line)
    if item:
        return item

    # Strategy 3: Quantity suffix — "ITEM $9.99 x2"
    item = _try_qty_suffix(line)
    if item:
        return item

    # Strategy 4: Simple — "ITEM NAME   $9.99"
    item = _try_simple(line)
    if item:
        return item

    return None


def _try_columnar(line: str) -> Optional[Dict[str, Any]]:
    """Parse columnar format: NAME   QTY   UNIT_PRICE   TOTAL_PRICE."""
    match = _COLUMNAR_RE.match(line)
    if not match:
        return None

    name = _clean_name(match.group(1))
    qty = int(match.group(2))
    unit_price = _parse_price(match.group(3))
    total_price = _parse_price(match.group(4))

    if not name or unit_price is None or total_price is None:
        return None

    return _build_item(name, qty, unit_price, total_price)


def _try_qty_prefix(line: str) -> Optional[Dict[str, Any]]:
    """Parse quantity-prefix format: 2x ITEM NAME   $19.98."""
    match = _QTY_PREFIX_RE.match(line)
    if not match:
        return None

    qty = int(match.group(1))
    remainder = match.group(2)

    prices = _PRICE_RE.findall(remainder)
    if not prices:
        return None

    # Use the last price as total_price
    total_price = _parse_price(prices[-1])
    if total_price is None:
        return None

    # Remove price from remainder to get name
    name = _PRICE_RE.sub("", remainder).strip()
    name = _clean_name(name)
    if not name:
        return None

    unit_price = round(total_price / qty, 2) if qty > 0 else total_price
    return _build_item(name, qty, unit_price, total_price)


def _try_qty_suffix(line: str) -> Optional[Dict[str, Any]]:
    """Parse quantity-suffix format: ITEM $9.99 x2."""
    # First check if there is a price and a trailing qty marker
    prices = _PRICE_RE.findall(line)
    if not prices:
        return None

    # Check for x<N> at the end after the last price
    match = _QTY_SUFFIX_RE.match(line)
    if not match:
        return None

    body = match.group(1)
    qty = int(match.group(2))

    body_prices = _PRICE_RE.findall(body)
    if not body_prices:
        return None

    total_price = _parse_price(body_prices[-1])
    if total_price is None:
        return None

    name = _PRICE_RE.sub("", body).strip()
    name = _clean_name(name)
    if not name:
        return None

    unit_price = round(total_price / qty, 2) if qty > 0 else total_price
    return _build_item(name, qty, unit_price, total_price)


def _try_simple(line: str) -> Optional[Dict[str, Any]]:
    """Parse simple format: ITEM NAME   $9.99."""
    prices = _PRICE_RE.findall(line)
    if not prices:
        return None

    # Use the last price found
    total_price = _parse_price(prices[-1])
    if total_price is None:
        return None

    # Everything before the price(s) is the name
    # Remove all price occurrences to get the name
    name = _PRICE_RE.sub("", line).strip()
    name = _clean_name(name)

    if not name:
        return None

    # Filter out lines that are too short or look like noise
    if len(name) < 2:
        return None

    return _build_item(name, 1, total_price, total_price)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _clean_name(name: str) -> str:
    """Normalize an item name: collapse whitespace, strip trailing punctuation."""
    # Remove leading/trailing whitespace and common separators
    name = re.sub(r"\s+", " ", name).strip()
    # Remove trailing dots, dashes, colons used as leaders
    name = re.sub(r"[\s.\-:]+$", "", name)
    # Remove leading dots, dashes
    name = re.sub(r"^[\s.\-:]+", "", name)
    # Remove dollar signs that might be part of the name
    name = name.replace("$", "").strip()
    return name


def _parse_price(price_str: str) -> Optional[float]:
    """Convert a price string like '1,234.56' to a float."""
    try:
        return float(price_str.replace(",", ""))
    except (ValueError, TypeError):
        return None


def _build_item(
    name: str,
    quantity: int,
    unit_price: float,
    total_price: float,
) -> Dict[str, Any]:
    """Build a normalized line item dict.

    If only one of unit_price/total_price is meaningfully set, compute
    the other from quantity.
    """
    quantity = max(quantity, 1)

    # Consistency fix: if unit * qty != total, trust total and recompute unit
    expected_total = round(unit_price * quantity, 2)
    if abs(expected_total - total_price) > 0.02 and quantity > 1:
        unit_price = round(total_price / quantity, 2)

    return {
        "name": name,
        "quantity": quantity,
        "unit_price": round(unit_price, 2),
        "total_price": round(total_price, 2),
    }
