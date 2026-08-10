"""Live HITL approve/reject against ActivityLog (#78)."""

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.services.validator import E2E_HITL_MID_MARKER


def test_hitl_approve_reject_live(client: TestClient, session: Session):
    # rule_id need not exist — validator uses General guidance + E2E marker
    rule_id = str(uuid4())

    create = client.post(
        "/validate",
        json={
            "code_snippet": f"x = 1  # {E2E_HITL_MID_MARKER}",
            "rule_id": rule_id,
            "repo": "test-repo",
        },
    )
    assert create.status_code == 202, create.text
    body = create.json()
    vid = body["validation_id"]
    assert body["status"] == "processing"

    listed = client.get("/validate")
    assert listed.status_code == 200
    rows = listed.json()
    match = [r for r in rows if r["validation_id"] == vid]
    assert match
    assert match[0]["verdict"] == "MID"
    assert match[0]["status"] == "pending"

    got = client.get(f"/validate/{vid}")
    assert got.status_code == 200
    assert got.json()["status"] == "pending"

    approve = client.patch(f"/validate/{vid}", json={"action": "approve"})
    assert approve.status_code == 200, approve.text
    assert approve.json() == {"success": True, "status": "approved"}

    after = client.get(f"/validate/{vid}")
    assert after.json()["status"] == "approved"

    # Second validation → reject path
    create2 = client.post(
        "/validate",
        json={
            "code_snippet": f"y = 2  # {E2E_HITL_MID_MARKER}",
            "rule_id": rule_id,
        },
    )
    vid2 = create2.json()["validation_id"]
    reject = client.patch(f"/validate/{vid2}", json={"action": "reject"})
    assert reject.status_code == 200
    assert reject.json()["status"] == "rejected"
    assert client.get(f"/validate/{vid2}").json()["status"] == "rejected"
