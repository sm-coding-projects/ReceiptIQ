"""API key management tests."""


def test_create_api_key(client, auth_headers):
    response = client.post(
        "/api/keys/",
        headers=auth_headers,
        json={"name": "Test Key"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "raw_key" in data
    assert data["name"] == "Test Key"
    assert "key_prefix" in data


def test_list_api_keys(client, auth_headers):
    client.post("/api/keys/", headers=auth_headers, json={"name": "Key 1"})
    client.post("/api/keys/", headers=auth_headers, json={"name": "Key 2"})
    response = client.get("/api/keys/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    for key in data:
        assert "raw_key" not in key
        assert "key_hash" not in key


def test_delete_api_key(client, auth_headers):
    create_resp = client.post("/api/keys/", headers=auth_headers, json={"name": "To Delete"})
    key_id = create_resp.json()["id"]
    response = client.delete(f"/api/keys/{key_id}", headers=auth_headers)
    assert response.status_code == 200
    list_resp = client.get("/api/keys/", headers=auth_headers)
    assert len(list_resp.json()) == 0


def test_api_keys_unauthenticated(client):
    response = client.get("/api/keys/")
    assert response.status_code == 401
