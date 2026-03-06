"""Celery tasks for background OCR processing."""

import logging
import os
import uuid

from celery_app import celery
from app.config import settings
from app.database import SessionLocal
from app.models.receipt import ReceiptFile, ReceiptResult, ReceiptBatch
from app.services.receipt_service import (
    update_file_status,
    update_batch_status,
    create_receipt_result,
)
from app.ocr.pipeline import process_receipt

logger = logging.getLogger(__name__)


@celery.task(
    bind=True,
    name="app.tasks.process_receipt_file",
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
)
def process_receipt_file(self, receipt_file_id: str) -> dict:
    """Process a single receipt file through the OCR pipeline.

    This task:
    1. Looks up the receipt file record in the database
    2. Updates status to 'processing'
    3. Runs the OCR pipeline on the stored file
    4. Saves extraction results to the database
    5. Updates file and batch statuses

    Args:
        receipt_file_id: UUID string of the ReceiptFile to process.

    Returns:
        Dictionary with task result summary.
    """
    db = SessionLocal()
    try:
        file_id = uuid.UUID(receipt_file_id)

        # Look up the receipt file
        receipt_file = (
            db.query(ReceiptFile).filter(ReceiptFile.id == file_id).first()
        )
        if not receipt_file:
            logger.error("ReceiptFile not found: %s", receipt_file_id)
            return {"status": "error", "message": "Receipt file not found"}

        # Update status to processing
        update_file_status(db, file_id, "processing")
        logger.info(
            "Processing receipt file: %s (%s)",
            receipt_file_id,
            receipt_file.original_filename,
        )

        # Build file path
        file_path = os.path.join(settings.UPLOAD_DIR, receipt_file.stored_filename)
        if not os.path.exists(file_path):
            logger.error("File not found on disk: %s", file_path)
            update_file_status(db, file_id, "failed")
            update_batch_status(db, receipt_file.batch_id)
            return {"status": "error", "message": "File not found on disk"}

        # Run OCR pipeline
        result_data = process_receipt(file_path)

        # Save result to database
        create_receipt_result(db, file_id, result_data)

        # Update file status to completed
        update_file_status(db, file_id, "completed")

        # Update batch status
        update_batch_status(db, receipt_file.batch_id)

        logger.info(
            "Successfully processed receipt file: %s (confidence=%.2f)",
            receipt_file_id,
            result_data.get("confidence", 0.0),
        )

        return {
            "status": "completed",
            "file_id": receipt_file_id,
            "confidence": result_data.get("confidence", 0.0),
            "vendor": result_data.get("vendor_name"),
            "total": result_data.get("total"),
        }

    except Exception as exc:
        logger.exception("Error processing receipt file %s", receipt_file_id)

        # Update status to failed
        try:
            update_file_status(db, uuid.UUID(receipt_file_id), "failed")
            receipt_file = (
                db.query(ReceiptFile)
                .filter(ReceiptFile.id == uuid.UUID(receipt_file_id))
                .first()
            )
            if receipt_file:
                update_batch_status(db, receipt_file.batch_id)
        except Exception:
            logger.exception("Failed to update status after error")

        # Retry if retries remaining
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc)

        return {
            "status": "failed",
            "file_id": receipt_file_id,
            "error": str(exc),
        }

    finally:
        db.close()
