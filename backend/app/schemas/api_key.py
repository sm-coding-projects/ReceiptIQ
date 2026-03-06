"""Pydantic schemas for API key management."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class ApiKeyCreate(BaseModel):
    """Schema for creating an API key."""

    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("API key name is required")
        if len(v) > 255:
            raise ValueError("API key name must be 255 characters or fewer")
        return v


class ApiKeyResponse(BaseModel):
    """Schema for listing API keys (no raw key)."""

    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(BaseModel):
    """Schema returned when a new API key is created. The raw key is shown only once."""

    id: uuid.UUID
    name: str
    key_prefix: str
    raw_key: str  # The raw API key, shown only once at creation time
    created_at: datetime

    model_config = {"from_attributes": True}
