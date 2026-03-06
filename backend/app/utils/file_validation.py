"""File validation utilities for upload security."""

import os
import re
import uuid
from typing import Optional

from app.config import settings

# MIME type mapping for allowed file extensions
EXTENSION_MIME_MAP: dict[str, list[str]] = {
    "jpg": ["image/jpeg"],
    "jpeg": ["image/jpeg"],
    "png": ["image/png"],
    "gif": ["image/gif"],
    "bmp": ["image/bmp", "image/x-ms-bmp"],
    "tiff": ["image/tiff"],
    "pdf": ["application/pdf"],
}

# Magic bytes for content-based MIME detection
MAGIC_BYTES: dict[str, list[bytes]] = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/gif": [b"GIF87a", b"GIF89a"],
    "image/bmp": [b"BM"],
    "image/tiff": [b"II\x2a\x00", b"MM\x00\x2a"],
    "application/pdf": [b"%PDF"],
}


def get_extension(filename: str) -> str:
    """Extract the file extension (lowercase, without dot)."""
    _, ext = os.path.splitext(filename)
    return ext.lstrip(".").lower()


def validate_file_extension(filename: str) -> bool:
    """Check if the file extension is in the allowed list."""
    ext = get_extension(filename)
    return ext in settings.ALLOWED_EXTENSIONS


def get_mime_type(file_content: bytes, filename: str) -> Optional[str]:
    """Determine MIME type by checking magic bytes in file content.

    Falls back to extension-based detection if magic bytes don't match.

    Args:
        file_content: The first few bytes of the file.
        filename: The original filename (for extension-based fallback).

    Returns:
        The detected MIME type, or None if unrecognized.
    """
    # Check magic bytes
    for mime, signatures in MAGIC_BYTES.items():
        for sig in signatures:
            if file_content[:len(sig)] == sig:
                return mime

    # Fallback to extension-based detection
    ext = get_extension(filename)
    if ext in EXTENSION_MIME_MAP:
        return EXTENSION_MIME_MAP[ext][0]

    return None


def validate_file_type(file_content: bytes, filename: str) -> tuple[bool, Optional[str]]:
    """Validate that the file type is allowed by checking both extension and content.

    Args:
        file_content: The beginning bytes of the file for magic byte detection.
        filename: The original filename.

    Returns:
        Tuple of (is_valid, detected_mime_type).
    """
    # Step 1: Check extension
    if not validate_file_extension(filename):
        return False, None

    ext = get_extension(filename)

    # Step 2: Detect MIME type from content
    detected_mime = get_mime_type(file_content, filename)
    if detected_mime is None:
        return False, None

    # Step 3: Verify detected MIME matches the extension's expected MIME types
    allowed_mimes = EXTENSION_MIME_MAP.get(ext, [])
    if detected_mime not in allowed_mimes:
        # Allow JPEG for both .jpg and .jpeg
        if detected_mime == "image/jpeg" and ext in ("jpg", "jpeg"):
            return True, detected_mime
        return False, detected_mime

    return True, detected_mime


def validate_file_size(file_size: int) -> bool:
    """Check if the file size is within the allowed limit."""
    return 0 < file_size <= settings.MAX_UPLOAD_SIZE


def sanitize_filename(filename: str) -> str:
    """Sanitize the original filename and generate a safe stored filename.

    Returns:
        A UUID-based stored filename with the original extension preserved.
    """
    ext = get_extension(filename)
    if ext:
        return f"{uuid.uuid4()}.{ext}"
    return str(uuid.uuid4())


def get_safe_original_filename(filename: str) -> str:
    """Clean the original filename, removing path components and dangerous characters."""
    # Remove directory components
    filename = os.path.basename(filename)
    # Remove non-alphanumeric characters except dots, hyphens, underscores
    filename = re.sub(r"[^\w.\-]", "_", filename)
    # Limit length
    if len(filename) > 255:
        ext = get_extension(filename)
        name_part = filename[: 255 - len(ext) - 1] if ext else filename[:255]
        filename = f"{name_part}.{ext}" if ext else name_part
    return filename
