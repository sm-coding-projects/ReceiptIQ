"""Pydantic schemas for receipt-related responses."""

import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class LineItem(BaseModel):
    """Single line item extracted from a receipt."""

    name: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None


class ReceiptResultResponse(BaseModel):
    """Schema for a single receipt extraction result."""

    id: uuid.UUID
    receipt_file_id: uuid.UUID
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    receipt_number: Optional[str] = None
    transaction_date: Optional[str] = None
    transaction_time: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    payment_method: Optional[str] = None
    line_items: Optional[List[Any]] = None
    confidence: Optional[float] = None
    raw_text: Optional[str] = None
    extraction_metadata: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReceiptFileResponse(BaseModel):
    """Schema for a single receipt file with optional result."""

    id: uuid.UUID
    batch_id: uuid.UUID
    original_filename: str
    file_size: int
    mime_type: str
    status: str
    created_at: datetime
    result: Optional[ReceiptResultResponse] = None

    model_config = {"from_attributes": True}


class ReceiptBatchResponse(BaseModel):
    """Schema for a receipt batch with files."""

    id: uuid.UUID
    user_id: uuid.UUID
    name: Optional[str] = None
    status: str
    file_count: int
    processed_count: int
    created_at: datetime
    files: Optional[List[ReceiptFileResponse]] = None

    model_config = {"from_attributes": True}


class ReceiptBatchListResponse(BaseModel):
    """Paginated list of receipt batches."""

    batches: List[ReceiptBatchResponse]
    total: int
    page: int
    page_size: int


class ExtractionResultResponse(BaseModel):
    """Public API response for extraction result."""

    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    receipt_number: Optional[str] = None
    transaction_date: Optional[str] = None
    transaction_time: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    payment_method: Optional[str] = None
    line_items: Optional[List[Any]] = None
    confidence: Optional[float] = None
    extraction_metadata: Optional[dict] = None

    model_config = {"from_attributes": True}
