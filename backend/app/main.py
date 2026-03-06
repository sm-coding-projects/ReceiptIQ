"""FastAPI application entry point."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

# Import all models so they are registered with Base.metadata
from app.models import User, ReceiptBatch, ReceiptFile, ReceiptResult, ApiKey  # noqa: F401

# Import routers
from app.api.auth import router as auth_router
from app.api.receipts import router as receipts_router
from app.api.api_keys import router as api_keys_router
from app.api.extract import router as extract_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting Receipt OCR Platform API")

    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Upload directory: %s", settings.UPLOAD_DIR)

    # Create database tables (for development; use Alembic in production)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error("Failed to create database tables: %s", str(e))
        logger.warning(
            "Database may not be available. The app will start but "
            "database operations will fail until the database is ready."
        )

    yield

    # Shutdown
    logger.info("Shutting down Receipt OCR Platform API")


app = FastAPI(
    title="Receipt OCR Platform",
    description=(
        "A production-grade API for extracting structured data from scanned receipts "
        "using Tesseract OCR. Supports bulk upload, asynchronous processing, and "
        "developer-friendly API key authentication."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(receipts_router, prefix="/api/receipts", tags=["Receipts"])
app.include_router(api_keys_router, prefix="/api/keys", tags=["API Keys"])
app.include_router(extract_router, prefix="/api/v1", tags=["Public API"])


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": "receipt-ocr-api",
        "version": "1.0.0",
    }
