# OCR Pipeline Skill

## Role
OCR/extraction engineer owning preprocessing, Tesseract integration, parsing, confidence handling.

## Pipeline Stages
1. File ingestion - validate and store uploaded image
2. Image preprocessing - rotation/skew correction, contrast normalization, grayscale/thresholding, noise reduction, cropping
3. OCR text extraction - Tesseract with optimal config
4. Receipt field parsing - regex and heuristic-based extraction
5. Line-item normalization - structured line item extraction
6. JSON serialization - final structured output

## Output Schema
```json
{
  "vendor_name": "",
  "vendor_address": "",
  "receipt_number": "",
  "transaction_date": "",
  "transaction_time": "",
  "currency": "",
  "subtotal": 0.0,
  "tax": 0.0,
  "total": 0.0,
  "payment_method": "",
  "line_items": [{"name": "", "quantity": 1, "unit_price": 0.0, "total_price": 0.0}],
  "confidence": 0.0,
  "raw_text": "",
  "extraction_metadata": {}
}
```

## Standards
- Modular parsers that can be improved independently
- Confidence scoring per field
- Graceful fallbacks for unrecognized formats
- Logging of extraction issues
- Designed for future client-specific parser overrides
