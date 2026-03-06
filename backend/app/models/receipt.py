"""Receipt-related ORM models: ReceiptBatch, ReceiptFile, ReceiptResult."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Integer,
    Float,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import GUID


class ReceiptBatch(Base):
    __tablename__ = "receipt_batches"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending | processing | completed | failed
    file_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="batches")
    files = relationship(
        "ReceiptFile", back_populates="batch", lazy="selectin", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ReceiptBatch {self.id} status={self.status}>"


class ReceiptFile(Base):
    __tablename__ = "receipt_files"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("receipt_batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending | processing | completed | failed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    batch = relationship("ReceiptBatch", back_populates="files")
    user = relationship("User", back_populates="receipt_files")
    result = relationship(
        "ReceiptResult", back_populates="receipt_file", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ReceiptFile {self.original_filename} status={self.status}>"


class ReceiptResult(Base):
    __tablename__ = "receipt_results"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    receipt_file_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("receipt_files.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vendor_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    receipt_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transaction_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    transaction_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    subtotal: Mapped[float | None] = mapped_column(Float, nullable=True)
    tax: Mapped[float | None] = mapped_column(Float, nullable=True)
    total: Mapped[float | None] = mapped_column(Float, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    line_items: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    extraction_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    receipt_file = relationship("ReceiptFile", back_populates="result")

    def __repr__(self) -> str:
        return f"<ReceiptResult file={self.receipt_file_id} vendor={self.vendor_name}>"
