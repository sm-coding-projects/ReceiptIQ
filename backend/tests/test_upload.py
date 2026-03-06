"""Upload validation tests."""
import io


def test_upload_no_auth(client):
    response = client.post("/api/receipts/upload")
    assert response.status_code == 401


def test_upload_no_files(client, auth_headers):
    response = client.post("/api/receipts/upload", headers=auth_headers)
    assert response.status_code == 422


def test_upload_invalid_file_type(client, auth_headers):
    file = io.BytesIO(b"not an image")
    response = client.post(
        "/api/receipts/upload",
        headers=auth_headers,
        files=[("files", ("test.txt", file, "text/plain"))]
    )
    assert response.status_code == 400


def test_upload_valid_image(client, auth_headers):
    # Create a minimal valid PNG (1x1 pixel)
    import struct
    import zlib

    def create_minimal_png():
        signature = b'\x89PNG\r\n\x1a\n'
        # IHDR chunk
        ihdr_data = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
        ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
        ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc & 0xffffffff)
        # IDAT chunk
        raw_data = zlib.compress(b'\x00\xff\x00\x00')
        idat_crc = zlib.crc32(b'IDAT' + raw_data)
        idat = struct.pack('>I', len(raw_data)) + b'IDAT' + raw_data + struct.pack('>I', idat_crc & 0xffffffff)
        # IEND chunk
        iend_crc = zlib.crc32(b'IEND')
        iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc & 0xffffffff)
        return signature + ihdr + idat + iend

    png_data = create_minimal_png()
    file = io.BytesIO(png_data)
    response = client.post(
        "/api/receipts/upload",
        headers=auth_headers,
        files=[("files", ("receipt.png", file, "image/png"))]
    )
    assert response.status_code in [200, 201]


def test_list_receipts(client, auth_headers):
    response = client.get("/api/receipts/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
