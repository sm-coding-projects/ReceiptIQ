"""Auth endpoint tests."""


def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePass1",
        "confirm_password": "SecurePass1"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_weak_password(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "weak",
        "confirm_password": "weak"
    })
    assert response.status_code == 422


def test_register_password_mismatch(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePass1",
        "confirm_password": "DifferentPass1"
    })
    assert response.status_code == 422


def test_register_duplicate_email(client):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePass1",
        "confirm_password": "SecurePass1"
    }
    client.post("/api/auth/register", json=payload)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400


def test_login_success(client):
    client.post("/api/auth/register", json={
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePass1",
        "confirm_password": "SecurePass1"
    })
    response = client.post("/api/auth/login", json={
        "email": "jane@example.com",
        "password": "SecurePass1"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePass1",
        "confirm_password": "SecurePass1"
    })
    response = client.post("/api/auth/login", json={
        "email": "jane@example.com",
        "password": "WrongPass1"
    })
    assert response.status_code == 401


def test_get_me(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert "password" not in data
    assert "password_hash" not in data


def test_get_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
