import io

from fastapi.testclient import TestClient


def test_ingest_document(client: TestClient):
    file_content = b"This is a test governance document."
    response = client.post(
        "/ingest",
        files={"file": ("test.md", io.BytesIO(file_content), "text/markdown")},
    )
    assert response.status_code == 202
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "comparing"


def test_get_status(client: TestClient):
    # First ingest
    file_content = b"Document for status check."
    ingest_resp = client.post(
        "/ingest",
        files={"file": ("status.md", io.BytesIO(file_content), "text/markdown")},
    )
    task_id = ingest_resp.json()["task_id"]

    # Poll status
    status_resp = client.get(f"/ingest/{task_id}")
    assert status_resp.status_code == 200
    assert status_resp.json()["task_id"] == task_id
