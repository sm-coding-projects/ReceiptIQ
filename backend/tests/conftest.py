import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["UPLOAD_DIR"] = "/tmp/test_uploads"

from app.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite:///./test.db",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    os.makedirs("/tmp/test_uploads", exist_ok=True)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a user and return auth headers."""
    client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "test@example.com",
        "password": "TestPass123",
        "confirm_password": "TestPass123"
    })
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
