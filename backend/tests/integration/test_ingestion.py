import io
import time
from pathlib import Path

from fastapi.testclient import TestClient

IMAGE_ONLY_PDF = Path(__file__).parents[3] / "docs/mvp/fixtures/image-only.pdf"


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


def test_ingest_image_only_pdf_fails_explicitly(client: TestClient):
    response = client.post(
        "/ingest",
        files={
            "file": (
                "policy.pdf",
                IMAGE_ONLY_PDF.read_bytes(),
                "application/pdf",
            )
        },
    )
    assert response.status_code == 202
    task_id = response.json()["task_id"]

    for _ in range(20):
        status = client.get(f"/ingest/{task_id}").json()
        if status["status"] == "failed":
            break
        time.sleep(0.01)

    assert status["status"] == "failed"
    assert "no extractable text" in status["current_stage"]


def test_ingest_rejects_unsupported_file_type(client: TestClient):
    response = client.post(
        "/ingest",
        files={"file": ("policy.docx", io.BytesIO(b"not supported"), "application/octet-stream")},
    )

    assert response.status_code == 415
