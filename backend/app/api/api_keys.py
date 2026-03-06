"""API key management router: create, list, revoke."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.utils.security import generate_api_key, hash_api_key
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a new API key for the current user.

    The raw key is returned ONLY in this response. It cannot be retrieved later.
    """
    # Limit number of active API keys per user
    active_count = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id, ApiKey.is_active == True)
        .count()
    )
    if active_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 10 active API keys allowed per user.",
        )

    # Generate raw key
    raw_key = generate_api_key()
    key_prefix = raw_key[:8]
    key_hash = hash_api_key(raw_key)

    # Store hashed key
    api_key = ApiKey(
        user_id=current_user.id,
        name=key_data.name.strip(),
        key_prefix=key_prefix,
        key_hash=key_hash,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    logger.info(
        "API key created: prefix=%s user=%s name=%s",
        key_prefix,
        current_user.email,
        key_data.name,
    )

    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        raw_key=raw_key,
        created_at=api_key.created_at,
    )


@router.get("/", response_model=List[ApiKeyResponse])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the current user's API keys (prefix only, no raw keys)."""
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id)
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return [ApiKeyResponse.model_validate(k) for k in keys]


@router.delete("/{key_id}")
def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke and delete an API key."""
    api_key = (
        db.query(ApiKey)
        .filter(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
        .first()
    )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found.",
        )

    logger.info("API key revoked: prefix=%s user=%s", api_key.key_prefix, current_user.email)

    db.delete(api_key)
    db.commit()

    return {"detail": "API key revoked successfully."}
