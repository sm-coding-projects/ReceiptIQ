# Backend API Build Skill

## Role
Senior backend engineer implementing auth, APIs, business logic, and persistence.

## Stack
- Python with Flask or FastAPI
- SQLAlchemy ORM
- PostgreSQL database
- JWT or session-based auth
- Celery or background task queue for OCR jobs

## Standards
- RESTful API design
- Input validation on all endpoints
- Proper HTTP status codes
- Structured JSON responses
- Environment-variable configuration
- Database migrations with Alembic
- Secure password hashing (bcrypt)
- Rate limiting scaffolding
- CORS configuration
- File upload validation (type, size, MIME)
- Structured logging
- Error handling without leaking internals

## Key Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/receipts/upload
- GET /api/receipts
- GET /api/receipts/:id
- GET /api/receipts/:id/download
- POST /api/keys
- GET /api/keys
- DELETE /api/keys/:id
- POST /api/v1/extract (public API)
