# ReceiptIQ - Receipt OCR Platform

A production-grade web application that uses Tesseract OCR to extract structured data from scanned receipts. Features include bulk upload, asynchronous processing, JSON export, and a developer API with key management.

## Architecture

```
                        +------------------+
                        |    Frontend      |
                        |  React + Vite    |
                        |  (Nginx :80)     |
                        +--------+---------+
                                 |
                        +--------+---------+
                        |    Backend API   |
                        |  FastAPI :8000   |
                        +----+--------+----+
                             |        |
                    +--------+--+  +--+---------+
                    | PostgreSQL |  | Celery     |
                    |   :5432    |  | Worker     |
                    +------------+  +-----+------+
                                          |
                                   +------+------+
                                   | Redis :6379 |
                                   +-------------+
```

## Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS, Vite, Framer Motion |
| Backend    | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic |
| OCR        | Tesseract, OpenCV, Pillow, pytesseract |
| Queue      | Celery + Redis                 |
| Database   | PostgreSQL 16                  |
| Auth       | JWT (python-jose), bcrypt (passlib) |
| Container  | Docker, Docker Compose         |

## Quick Start (Docker)

```bash
# Clone the repository
git clone <repo-url> && cd Receipt_OCR_Platform

# Copy environment file
cp .env.example .env

# Build and start all services
docker compose up --build

# Access the app
open http://localhost
```

The app will be available at `http://localhost` (frontend) with the API at `http://localhost/api`.

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://receipt_user:receipt_pass@localhost:5432/receipt_db
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=dev-secret-key-change-in-production

# Run the API server
uvicorn app.main:app --reload --port 8000

# Run the Celery worker (separate terminal)
celery -A celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on `http://localhost:3000` with API proxy to backend.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://receipt_user:receipt_pass@db:5432/receipt_db` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `SECRET_KEY` | JWT signing key (change in production!) | `change-me-in-production...` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL in minutes | `1440` |
| `MAX_UPLOAD_SIZE` | Max file size in bytes | `10485760` (10MB) |
| `UPLOAD_DIR` | File storage directory | `/app/uploads` |
| `ALLOWED_EXTENSIONS` | Comma-separated extensions | `jpg,jpeg,png,gif,bmp,tiff,pdf` |

## Database Migrations

```bash
cd backend

# Generate a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

Note: In development, tables are auto-created on startup. Use Alembic for production migrations.

## OCR Pipeline

The OCR pipeline processes receipts in 4 stages:

1. **Preprocessing** - Load image, resize, grayscale, CLAHE contrast enhancement, denoising, deskew correction, Otsu thresholding
2. **Extraction** - Tesseract OCR with `--oem 3 --psm 6` config, per-word confidence scoring
3. **Parsing** - Regex and heuristic-based field extraction (vendor, date, totals, payment method, line items)
4. **Serialization** - Structured JSON output with confidence scores and metadata

Each stage is modular and can be improved independently. The parser supports multiple date formats, currency symbols, and line item layouts.

## API Key Management

1. Register and log in
2. Navigate to Dashboard > API Keys
3. Click "Generate New Key"
4. Copy the key immediately (shown only once)
5. Use the key in the `X-API-Key` header

## API Usage

### Extract Receipt Data

```bash
curl -X POST http://localhost/api/v1/extract \
  -H "X-API-Key: your_api_key_here" \
  -F "file=@receipt.jpg"
```

### Python

```python
import requests

response = requests.post(
    "http://localhost/api/v1/extract",
    headers={"X-API-Key": "your_api_key_here"},
    files={"file": open("receipt.jpg", "rb")}
)
data = response.json()
print(f"Total: {data['total']}")
```

### JavaScript

```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);

const response = await fetch('http://localhost/api/v1/extract', {
  method: 'POST',
  headers: { 'X-API-Key': 'your_api_key_here' },
  body: form
});

const data = await response.json();
```

### Response Format

```json
{
  "vendor_name": "SUPER MARKET",
  "vendor_address": "123 Main Street, Springfield, IL 62704",
  "receipt_number": "00012345",
  "transaction_date": "2024-01-15",
  "transaction_time": "14:30",
  "currency": "USD",
  "subtotal": 25.24,
  "tax": 2.08,
  "total": 27.32,
  "payment_method": "VISA",
  "line_items": [
    {"name": "MILK 2%", "quantity": 1, "unit_price": 3.99, "total_price": 3.99}
  ],
  "confidence": 0.89,
  "extraction_metadata": {
    "processing_time_ms": 1523.4,
    "tesseract_confidence": 91.2,
    "field_confidences": {"vendor_name": 0.95, "total": 0.98},
    "warnings": []
  }
}
```

## Testing

```bash
cd backend

# Run all tests
pytest -v

# Run specific test files
pytest tests/test_auth.py -v
pytest tests/test_ocr_parser.py -v
pytest tests/test_api_keys.py -v
```

## Docker Startup Verification

After `docker compose up --build`:

1. Health check: `curl http://localhost/api/health`
2. Register: POST to `http://localhost/api/auth/register`
3. Login: POST to `http://localhost/api/auth/login`
4. Upload receipt: POST to `http://localhost/api/receipts/upload`
5. Check Swagger docs: `http://localhost/api/docs`

## Security

- Passwords hashed with bcrypt
- JWT tokens with configurable expiration
- API keys hashed with SHA-256 before storage
- File upload validation (extension + MIME magic bytes)
- Input validation on all endpoints
- CORS configured for specific origins
- Non-root Docker containers
- No hardcoded secrets
- SQL injection prevention (SQLAlchemy ORM)
- XSS prevention (React auto-escaping, JSON responses)

## Known Limitations

- OCR accuracy depends on image quality; preprocessing helps but cannot fix severely degraded images
- Line item extraction uses heuristics and may miss non-standard formats
- PDF support is limited to single-page documents
- Rate limiting is scaffolded but not enforced in the current version
- Multi-tenant isolation is modeled but not fully enforced at the query level

## Future Improvements

- Client-specific parser overrides
- Machine learning-based field extraction
- Multi-language OCR support
- Webhook notifications for batch completion
- Usage-based billing and rate limit enforcement
- Horizontal worker scaling
- S3/cloud storage for uploads
- Export to CSV, Excel formats
