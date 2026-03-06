"""
Image Preprocessing Module
==========================

Prepares scanned receipt images for OCR by applying a composable chain
of transformations: grayscale conversion, contrast enhancement, denoising,
deskewing, and adaptive thresholding.

Each function is standalone and accepts / returns numpy arrays so they
can be reordered or skipped depending on the source image quality.
"""

import logging
import math
from pathlib import Path
from typing import Union

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Individual preprocessing stages
# ---------------------------------------------------------------------------


def load_image(file_path: Union[str, Path]) -> np.ndarray:
    """Load an image from *file_path* and return it as a BGR numpy array.

    Supports common raster formats via OpenCV.  Falls back to Pillow for
    formats that OpenCV cannot open (e.g. certain TIFF variants, WebP).

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file cannot be decoded as an image.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"Image file not found: {file_path}")

    # Attempt OpenCV first (fast, supports most formats)
    image = cv2.imread(str(file_path), cv2.IMREAD_COLOR)
    if image is not None:
        logger.debug("Loaded image via OpenCV: %s (%dx%d)", file_path, image.shape[1], image.shape[0])
        return image

    # Fallback: Pillow -> numpy
    try:
        pil_image = Image.open(file_path).convert("RGB")
        image = np.array(pil_image)
        # Pillow gives RGB; OpenCV convention is BGR
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        logger.debug("Loaded image via Pillow fallback: %s (%dx%d)", file_path, image.shape[1], image.shape[0])
        return image
    except Exception as exc:
        raise ValueError(f"Unable to decode image file: {file_path}") from exc


def convert_to_grayscale(image: np.ndarray) -> np.ndarray:
    """Convert a BGR image to single-channel grayscale.

    If the image is already single-channel it is returned unchanged.
    """
    if len(image.shape) == 2:
        return image
    if image.shape[2] == 1:
        return image.squeeze(axis=2)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    logger.debug("Converted to grayscale: shape=%s", gray.shape)
    return gray


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).

    Works on grayscale images.  If the input has 3 channels, it is
    converted to grayscale first.
    """
    if len(image.shape) == 3:
        image = convert_to_grayscale(image)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(image)
    logger.debug("Applied CLAHE contrast enhancement")
    return enhanced


def denoise(image: np.ndarray) -> np.ndarray:
    """Reduce noise using Non-Local Means Denoising.

    Expects a single-channel (grayscale) image.
    """
    if len(image.shape) == 3:
        image = convert_to_grayscale(image)

    denoised = cv2.fastNlMeansDenoising(image, h=10, templateWindowSize=7, searchWindowSize=21)
    logger.debug("Applied Non-Local Means denoising")
    return denoised


def deskew(image: np.ndarray) -> np.ndarray:
    """Detect and correct skew in a document image.

    Uses Hough line detection on the Canny edge image to estimate the
    dominant skew angle, then rotates the image to correct it.  Only
    corrects angles in the range (-45, 45) degrees to avoid flipping.
    """
    if len(image.shape) == 3:
        gray = convert_to_grayscale(image)
    else:
        gray = image

    # Edge detection
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    # Probabilistic Hough transform
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=100,
        minLineLength=gray.shape[1] // 4,
        maxLineGap=10,
    )

    if lines is None or len(lines) == 0:
        logger.debug("No lines detected; skipping deskew")
        return image

    # Compute angles of detected lines
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        dx = x2 - x1
        dy = y2 - y1
        if dx == 0:
            continue
        angle = math.degrees(math.atan2(dy, dx))
        # Only consider near-horizontal lines (within +-45 deg)
        if -45 < angle < 45:
            angles.append(angle)

    if not angles:
        logger.debug("No near-horizontal lines found; skipping deskew")
        return image

    median_angle = float(np.median(angles))

    # Only correct if the angle is meaningful (> 0.3 degrees)
    if abs(median_angle) < 0.3:
        logger.debug("Skew angle %.2f deg is negligible; skipping rotation", median_angle)
        return image

    logger.info("Detected skew angle: %.2f deg — rotating to correct", median_angle)

    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)

    # Compute new bounding size so corners are not clipped
    cos_a = abs(rotation_matrix[0, 0])
    sin_a = abs(rotation_matrix[0, 1])
    new_w = int(h * sin_a + w * cos_a)
    new_h = int(h * cos_a + w * sin_a)
    rotation_matrix[0, 2] += (new_w - w) / 2
    rotation_matrix[1, 2] += (new_h - h) / 2

    border_value = 255 if len(image.shape) == 2 else (255, 255, 255)
    rotated = cv2.warpAffine(
        image, rotation_matrix, (new_w, new_h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=border_value,
    )
    return rotated


def apply_threshold(image: np.ndarray) -> np.ndarray:
    """Apply adaptive binary thresholding using Otsu's method.

    Converts to grayscale first if needed.  Returns a binary image
    suitable for OCR.
    """
    if len(image.shape) == 3:
        image = convert_to_grayscale(image)

    # Otsu's binarization automatically picks a global threshold
    _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    logger.debug("Applied Otsu threshold")
    return binary


def resize_if_needed(image: np.ndarray, min_height: int = 800, max_height: int = 4000) -> np.ndarray:
    """Resize the image if it is too small or excessively large.

    Tesseract works best with images where text is at least ~12 px tall.
    Very large images slow processing without quality gain.
    """
    h, w = image.shape[:2]

    if h < min_height:
        scale = min_height / h
        new_w = int(w * scale)
        image = cv2.resize(image, (new_w, min_height), interpolation=cv2.INTER_CUBIC)
        logger.debug("Upscaled image from %d to %d px height", h, min_height)
    elif h > max_height:
        scale = max_height / h
        new_w = int(w * scale)
        image = cv2.resize(image, (new_w, max_height), interpolation=cv2.INTER_AREA)
        logger.debug("Downscaled image from %d to %d px height", h, max_height)

    return image


# ---------------------------------------------------------------------------
# Full preprocessing chain
# ---------------------------------------------------------------------------


def preprocess_receipt(file_path: Union[str, Path]) -> np.ndarray:
    """Run the full preprocessing pipeline on a receipt image.

    Pipeline order:
        1. Load image
        2. Resize if necessary
        3. Convert to grayscale
        4. Enhance contrast (CLAHE)
        5. Denoise
        6. Deskew
        7. Apply binary threshold (Otsu)

    Args:
        file_path: Path to the receipt image file.

    Returns:
        A preprocessed single-channel binary numpy array ready for OCR.

    Raises:
        FileNotFoundError: If *file_path* does not exist.
        ValueError: If the file cannot be loaded as an image.
    """
    logger.info("Starting preprocessing: %s", file_path)

    image = load_image(file_path)
    image = resize_if_needed(image)
    image = convert_to_grayscale(image)
    image = enhance_contrast(image)
    image = denoise(image)
    image = deskew(image)
    image = apply_threshold(image)

    logger.info(
        "Preprocessing complete: output shape=%s, dtype=%s",
        image.shape,
        image.dtype,
    )
    return image
