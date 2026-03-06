"""OCR parser unit tests."""
import pytest


def test_parse_total():
    from app.ocr.parser import parse_receipt
    text = """WALMART
123 Main St
Receipt #12345
01/15/2024 14:30
MILK          $3.99
BREAD         $2.49
SUBTOTAL      $6.48
TAX           $0.52
TOTAL         $7.00
VISA ****1234
"""
    result = parse_receipt(text)
    assert result["total"] == 7.00
    assert result["subtotal"] == 6.48
    assert result["tax"] == 0.52


def test_parse_vendor():
    from app.ocr.parser import parse_receipt
    text = """TARGET
456 Oak Avenue
Some City, ST 12345

Date: 03/20/2024
TOTAL: $15.99
"""
    result = parse_receipt(text)
    assert result["vendor_name"] is not None
    assert "TARGET" in result["vendor_name"].upper()


def test_parse_date_formats():
    from app.ocr.parser import parse_receipt
    # MM/DD/YYYY
    result = parse_receipt("STORE\nDate: 01/15/2024\nTOTAL $10.00")
    assert result["transaction_date"] is not None

    # YYYY-MM-DD
    result = parse_receipt("STORE\nDate: 2024-01-15\nTOTAL $10.00")
    assert result["transaction_date"] is not None


def test_parse_payment_method():
    from app.ocr.parser import parse_receipt
    text = "STORE\nTOTAL $10.00\nVISA ****1234"
    result = parse_receipt(text)
    assert result["payment_method"] is not None
    assert "VISA" in result["payment_method"].upper()


def test_parse_empty_text():
    from app.ocr.parser import parse_receipt
    result = parse_receipt("")
    assert result["total"] is None
    assert result["vendor_name"] is None
    assert result["confidence"] < 0.5


def test_parse_line_items():
    from app.ocr.line_item_parser import parse_line_items
    text = """MILK          $3.99
BREAD         $2.49
EGGS   2x     $5.98
"""
    items = parse_line_items(text)
    assert len(items) >= 2
    for item in items:
        assert "name" in item
        assert "total_price" in item


def test_json_output_schema():
    from app.ocr.parser import parse_receipt
    result = parse_receipt("STORE\nTOTAL $10.00")
    required_fields = [
        "vendor_name", "vendor_address", "receipt_number",
        "transaction_date", "transaction_time", "currency",
        "subtotal", "tax", "total", "payment_method",
        "line_items", "confidence", "raw_text"
    ]
    for field in required_fields:
        assert field in result, f"Missing field: {field}"
