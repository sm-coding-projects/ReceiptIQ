"""Receipts API router: upload, list batches, get batch details, download results."""

import json
import logging
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.receipt import (
    ReceiptBatchResponse,
    ReceiptFileResponse,
    ReceiptResultResponse,
)
from app.services.receipt_service import (
    create_batch,
    create_receipt_file,
    get_user_batches,
    get_batch_by_id,
    get_receipt_file,
    get_batch_results,
)
from app.utils.file_validation import (
    validate_file_type,
    validate_file_size,
    sanitize_filename,
    get_safe_original_filename,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload", response_model=ReceiptBatchResponse, status_code=status.HTTP_201_CREATED)
async def upload_receipts(
    files: List[UploadFile] = File(...),
    batch_name: str = Query(None, max_length=255),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk upload receipt files for OCR processing.

    Validates each file's extension, MIME type, and size before accepting.
    Creates a batch and queues OCR processing tasks.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required.",
        )

    if len(files) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 50 files per upload batch.",
        )

    # Validate all files first before saving any
    validated_files = []
    errors = []

    for i, file in enumerate(files):
        if not file.filename:
            errors.append({"index": i, "error": "File has no filename."})
            continue

        # Read first 8KB for magic byte detection
        content_header = await file.read(8192)
        await file.seek(0)

        # Validate type
        is_valid_type, detected_mime = validate_file_type(content_header, file.filename)
        if not is_valid_type:
            errors.append({
                "index": i,
                "filename": file.filename,
                "error": f"File type not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
            })
            continue

        # Read full content to check size
        full_content = await file.read()
        await file.seek(0)
        file_size = len(full_content)

        if not validate_file_size(file_size):
            errors.append({
                "index": i,
                "filename": file.filename,
                "error": f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE // (1024 * 1024)}MB.",
            })
            continue

        validated_files.append({
            "file": file,
            "content": full_content,
            "mime_type": detected_mime,
            "file_size": file_size,
        })

    if not validated_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "No valid files to process.",
                "errors": errors,
            },
        )

    # Create batch
    batch = create_batch(
        db=db,
        user_id=current_user.id,
        name=batch_name or f"Batch {uuid.uuid4().hex[:8]}",
        file_count=len(validated_files),
    )

    # Save files and create records
    created_files = []
    for item in validated_files:
        file = item["file"]
        safe_original = get_safe_original_filename(file.filename)
        stored_name = sanitize_filename(file.filename)

        # Save file to disk
        file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(item["content"])

        # Create DB record
        receipt_file = create_receipt_file(
            db=db,
            batch_id=batch.id,
            user_id=current_user.id,
            original_filename=safe_original,
            stored_filename=stored_name,
            file_size=item["file_size"],
            mime_type=item["mime_type"],
        )
        created_files.append(receipt_file)

    # Queue OCR tasks via Celery
    try:
        from app.tasks import process_receipt_file
        for receipt_file in created_files:
            process_receipt_file.delay(str(receipt_file.id))
        logger.info(
            "Queued %d OCR tasks for batch %s", len(created_files), batch.id
        )
    except Exception as e:
        logger.warning(
            "Could not queue Celery tasks (worker may be offline): %s. "
            "Files saved but will need manual processing.",
            str(e),
        )

    # Refresh batch to include files
    db.refresh(batch)

    response_data = ReceiptBatchResponse.model_validate(batch)
    if errors:
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "batch": response_data.model_dump(mode="json"),
                "warnings": errors,
            },
        )
    return response_data


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics for the current user."""
    from app.models.receipt import ReceiptFile as RF
    total = db.query(RF).filter(RF.user_id == current_user.id).count()
    processed = db.query(RF).filter(RF.user_id == current_user.id, RF.status == "completed").count()
    pending = db.query(RF).filter(RF.user_id == current_user.id, RF.status.in_(["pending", "processing"])).count()
    failed = db.query(RF).filter(RF.user_id == current_user.id, RF.status == "failed").count()
    return {
        "total_receipts": total,
        "processed": processed,
        "pending": pending,
        "failed": failed,
    }


@router.get("/", response_model=List[ReceiptBatchResponse])
def list_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the current user's receipt upload batches with pagination."""
    batches, total = get_user_batches(db, current_user.id, page, page_size)
    return [ReceiptBatchResponse.model_validate(b) for b in batches]


@router.get("/{batch_id}", response_model=ReceiptBatchResponse)
def get_batch(
    batch_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific batch with all its files and extraction results."""
    batch = get_batch_by_id(db, batch_id, current_user.id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found.",
        )
    return ReceiptBatchResponse.model_validate(batch)


@router.get("/{batch_id}/files/{file_id}/download")
def download_file_result(
    batch_id: uuid.UUID,
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the JSON extraction result for a single receipt file."""
    receipt_file = get_receipt_file(db, file_id, current_user.id)
    if not receipt_file or receipt_file.batch_id != batch_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt file not found.",
        )

    if not receipt_file.result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No extraction result available yet for this file.",
        )

    result = receipt_file.result
    result_data = {
        "file_id": str(receipt_file.id),
        "original_filename": receipt_file.original_filename,
        "vendor_name": result.vendor_name,
        "vendor_address": result.vendor_address,
        "receipt_number": result.receipt_number,
        "transaction_date": result.transaction_date,
        "transaction_time": result.transaction_time,
        "currency": result.currency,
        "subtotal": result.subtotal,
        "tax": result.tax,
        "total": result.total,
        "payment_method": result.payment_method,
        "line_items": result.line_items,
        "confidence": result.confidence,
        "extraction_metadata": result.extraction_metadata,
    }

    return JSONResponse(
        content=result_data,
        headers={
            "Content-Disposition": f'attachment; filename="{receipt_file.original_filename}.json"'
        },
    )


@router.get("/{batch_id}/download")
def download_batch_results(
    batch_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download all extraction results for a batch as a JSON array."""
    results = get_batch_results(db, batch_id, current_user.id)
    if results is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found.",
        )

    return JSONResponse(
        content=results,
        headers={
            "Content-Disposition": f'attachment; filename="batch_{batch_id}_results.json"'
        },
    )
