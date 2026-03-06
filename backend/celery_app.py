"""Celery application configuration for background OCR processing."""

from celery import Celery

from app.config import settings

celery = Celery(
    "receipt_ocr",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks"],
)

# Celery configuration
celery.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Task execution
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard limit per task
    task_soft_time_limit=240,  # 4 minutes soft limit

    # Worker
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    worker_concurrency=2,

    # Result backend
    result_expires=3600,  # Results expire after 1 hour

    # Retry
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)
