"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql://receipt_user:receipt_pass@db:5432/receipt_db"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT / Auth
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # File upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS_STR: str = "jpg,jpeg,png,gif,bmp,tiff,pdf"
    UPLOAD_DIR: str = "/app/uploads"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:80,http://localhost"

    @property
    def ALLOWED_EXTENSIONS(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS_STR.split(",") if ext.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
