"""MVP policy storage schema & versioning (#75)."""

import io

from fastapi.testclient import TestClient


def test_policy_model_fields():
    from app.models.policy import Policy

    fields = set(Policy.model_fields)
    for required in ("id", "name", "source_url", "version", "hash"):
        assert required in fields, f"Policy missing field: {required}"


def test_ingest_creates_policy_version(client: TestClient):
    content = b"# Sample\n\n## Controls\n- one\n"
    resp = client.post(
        "/ingest",
        files={"file": ("data-classification.md", io.BytesIO(content), "text/markdown")},
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert "task_id" in body
    assert "policy_id" in body, "ingest should return policy_id"

    listed = client.get("/policies")
    assert listed.status_code == 200, listed.text
    policies = listed.json()
    assert isinstance(policies, list)
    assert policies, "expected at least one policy after ingest"
    current = policies[0]
    assert current["name"] == "data-classification.md"
    assert current["version"] == 1
    assert current["hash"]
    assert current["id"] == body["policy_id"]

    got = client.get(f"/policies/{current['id']}")
    assert got.status_code == 200
    assert got.json()["hash"] == current["hash"]


def test_reingest_same_hash_is_idempotent(client: TestClient):
    content = b"# Same\n\n## Controls\n- a\n"
    r1 = client.post(
        "/ingest",
        files={"file": ("access-control.md", io.BytesIO(content), "text/markdown")},
    )
    r2 = client.post(
        "/ingest",
        files={"file": ("access-control.md", io.BytesIO(content), "text/markdown")},
    )
    assert r1.status_code == 202
    assert r2.status_code == 202
    assert r1.json()["policy_id"] == r2.json()["policy_id"]

    policies = client.get("/policies").json()
    named = [p for p in policies if p["name"] == "access-control.md"]
    assert len(named) == 1
    assert named[0]["version"] == 1


def test_reingest_new_hash_bumps_version(client: TestClient):
    r1 = client.post(
        "/ingest",
        files={
            "file": (
                "access-control.md",
                io.BytesIO(b"# V1\n\n## Controls\n- a\n"),
                "text/markdown",
            )
        },
    )
    r2 = client.post(
        "/ingest",
        files={
            "file": (
                "access-control.md",
                io.BytesIO(b"# V2\n\n## Controls\n- b\n"),
                "text/markdown",
            )
        },
    )
    assert r1.status_code == 202
    assert r2.status_code == 202
    assert r1.json()["policy_id"] != r2.json()["policy_id"]

    current = client.get("/policies").json()
    named = [p for p in current if p["name"] == "access-control.md"]
    assert len(named) == 1
    assert named[0]["version"] == 2
    assert named[0]["id"] == r2.json()["policy_id"]
