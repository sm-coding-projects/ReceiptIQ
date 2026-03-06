"""Public extraction API router: synchronous receipt processing via API key."""

import logging
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.receipt import ExtractionResultResponse
from app.api.deps import get_current_user_from_api_key
from app.utils.file_validation import (
    validate_file_type,
    validate_file_size,
    sanitize_filename,
    get_safe_original_filename,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/extract", response_model=ExtractionResultResponse)
async def extract_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_api_key),
    db: Session = Depends(get_db),
):
    """Process a single receipt file synchronously via API key authentication.

    This endpoint accepts a receipt image, runs OCR extraction, and returns
    the structured result immediately.

    Authentication: X-API-Key header required.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename.",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate file size
    if not validate_file_size(file_size):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE // (1024 * 1024)}MB.",
        )

    # Validate file type
    is_valid, detected_mime = validate_file_type(content[:8192], file.filename)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Save file temporarily
    stored_name = sanitize_filename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    try:
        with open(file_path, "wb") as f:
            f.write(content)

        # Run OCR pipeline synchronously
        from app.ocr.pipeline import process_receipt
        result_data = process_receipt(file_path)

        logger.info(
            "API extraction completed for user=%s file=%s",
            current_user.email,
            file.filename,
        )

        return ExtractionResultResponse(
            vendor_name=result_data.get("vendor_name"),
            vendor_address=result_data.get("vendor_address"),
            receipt_number=result_data.get("receipt_number"),
            transaction_date=result_data.get("transaction_date"),
            transaction_time=result_data.get("transaction_time"),
            currency=result_data.get("currency"),
            subtotal=result_data.get("subtotal"),
            tax=result_data.get("tax"),
            total=result_data.get("total"),
            payment_method=result_data.get("payment_method"),
            line_items=result_data.get("line_items"),
            confidence=result_data.get("confidence"),
            extraction_metadata=result_data.get("extraction_metadata"),
        )

    finally:
        # Clean up temporary file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError as e:
            logger.warning("Failed to clean up temp file %s: %s", file_path, str(e))
