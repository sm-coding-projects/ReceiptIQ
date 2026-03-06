"""Service functions for receipt CRUD operations."""

import uuid
from typing import Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.receipt import ReceiptBatch, ReceiptFile, ReceiptResult


def create_batch(
    db: Session,
    user_id: uuid.UUID,
    name: Optional[str] = None,
    file_count: int = 0,
) -> ReceiptBatch:
    """Create a new receipt upload batch."""
    batch = ReceiptBatch(
        user_id=user_id,
        name=name,
        status="pending",
        file_count=file_count,
        processed_count=0,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def create_receipt_file(
    db: Session,
    batch_id: uuid.UUID,
    user_id: uuid.UUID,
    original_filename: str,
    stored_filename: str,
    file_size: int,
    mime_type: str,
) -> ReceiptFile:
    """Create a new receipt file record."""
    receipt_file = ReceiptFile(
        batch_id=batch_id,
        user_id=user_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_size=file_size,
        mime_type=mime_type,
        status="pending",
    )
    db.add(receipt_file)
    db.commit()
    db.refresh(receipt_file)
    return receipt_file


def create_receipt_result(
    db: Session,
    receipt_file_id: uuid.UUID,
    result_data: dict,
) -> ReceiptResult:
    """Create a receipt extraction result."""
    result = ReceiptResult(
        receipt_file_id=receipt_file_id,
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
        raw_text=result_data.get("raw_text"),
        extraction_metadata=result_data.get("extraction_metadata"),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def get_user_batches(
    db: Session,
    user_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
) -> tuple[List[ReceiptBatch], int]:
    """Get paginated batches for a user.

    Returns:
        Tuple of (batches, total_count).
    """
    query = db.query(ReceiptBatch).filter(ReceiptBatch.user_id == user_id)
    total = query.count()

    batches = (
        query.order_by(ReceiptBatch.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return batches, total


def get_batch_by_id(
    db: Session,
    batch_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Optional[ReceiptBatch]:
    """Get a batch by ID, scoped to the given user."""
    return (
        db.query(ReceiptBatch)
        .options(joinedload(ReceiptBatch.files).joinedload(ReceiptFile.result))
        .filter(
            ReceiptBatch.id == batch_id,
            ReceiptBatch.user_id == user_id,
        )
        .first()
    )


def get_receipt_file(
    db: Session,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Optional[ReceiptFile]:
    """Get a receipt file by ID, scoped to the given user."""
    return (
        db.query(ReceiptFile)
        .options(joinedload(ReceiptFile.result))
        .filter(
            ReceiptFile.id == file_id,
            ReceiptFile.user_id == user_id,
        )
        .first()
    )


def get_receipt_file_by_id(
    db: Session,
    file_id: uuid.UUID,
) -> Optional[ReceiptFile]:
    """Get a receipt file by ID (no user scoping, for internal/worker use)."""
    return (
        db.query(ReceiptFile)
        .options(joinedload(ReceiptFile.result))
        .filter(ReceiptFile.id == file_id)
        .first()
    )


def update_file_status(
    db: Session,
    file_id: uuid.UUID,
    status: str,
) -> None:
    """Update the status of a receipt file."""
    db.query(ReceiptFile).filter(ReceiptFile.id == file_id).update({"status": status})
    db.commit()


def update_batch_status(
    db: Session,
    batch_id: uuid.UUID,
) -> None:
    """Recalculate and update batch status based on its files' statuses."""
    batch = db.query(ReceiptBatch).filter(ReceiptBatch.id == batch_id).first()
    if not batch:
        return

    files = db.query(ReceiptFile).filter(ReceiptFile.batch_id == batch_id).all()
    if not files:
        return

    completed = sum(1 for f in files if f.status == "completed")
    failed = sum(1 for f in files if f.status == "failed")
    processing = sum(1 for f in files if f.status == "processing")

    batch.processed_count = completed + failed

    if completed + failed == len(files):
        if failed == len(files):
            batch.status = "failed"
        else:
            batch.status = "completed"
    elif processing > 0 or completed > 0:
        batch.status = "processing"
    else:
        batch.status = "pending"

    db.commit()


def get_batch_results(
    db: Session,
    batch_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Optional[List[dict]]:
    """Get all extraction results for a batch as a list of dicts."""
    batch = get_batch_by_id(db, batch_id, user_id)
    if not batch:
        return None

    results = []
    for file in batch.files:
        if file.result:
            result_dict = {
                "file_id": str(file.id),
                "original_filename": file.original_filename,
                "status": file.status,
                "vendor_name": file.result.vendor_name,
                "vendor_address": file.result.vendor_address,
                "receipt_number": file.result.receipt_number,
                "transaction_date": file.result.transaction_date,
                "transaction_time": file.result.transaction_time,
                "currency": file.result.currency,
                "subtotal": file.result.subtotal,
                "tax": file.result.tax,
                "total": file.result.total,
                "payment_method": file.result.payment_method,
                "line_items": file.result.line_items,
                "confidence": file.result.confidence,
                "extraction_metadata": file.result.extraction_metadata,
            }
            results.append(result_dict)
        else:
            results.append(
                {
                    "file_id": str(file.id),
                    "original_filename": file.original_filename,
                    "status": file.status,
                }
            )

    return results
