import io
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.rule import (
    GovernanceRule,
    ImpactRadius,
    RiskLevel,
    RuleType,
    SourceCategory,
)
from app.models.task import IngestionTask
from app.services.pipeline import _link_policy_revision


def test_duplicate_upload_returns_original_task(client: TestClient):
    payload = b"Stable policy content."
    first = client.post(
        "/ingest",
        files={"file": ("policy.md", io.BytesIO(payload), "text/markdown")},
    )
    duplicate = client.post(
        "/ingest",
        files={"file": ("renamed.md", io.BytesIO(payload), "text/markdown")},
    )

    assert first.status_code == 202
    assert duplicate.status_code == 202
    assert duplicate.json()["task_id"] == first.json()["task_id"]


def test_revised_policy_keeps_lineage(session: Session):
    first = IngestionTask(source_hash="first", source_name="policy.md")
    session.add(first)
    session.commit()
    session.refresh(first)

    revised = IngestionTask(source_hash="second", source_name="policy.md")
    session.add(revised)
    session.commit()
    session.refresh(revised)

    _link_policy_revision(session, revised, "unrelated deterministic text")

    assert revised.policy_id == first.policy_id
    assert revised.previous_version_id == first.id
    assert revised.version_number == 2
    assert revised.version_chain == [str(first.id), str(revised.id)]


def test_manifest_has_stable_policy_metadata(client: TestClient, session: Session):
    task = IngestionTask(
        source_hash="manifest-hash",
        source_name="retention-policy.md",
        version_number=3,
        previous_version_id=uuid4(),
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    task.version_chain = [str(task.previous_version_id), str(task.id)]
    session.add(
        GovernanceRule(
            task_id=task.id,
            type=RuleType.A1_SCANNABLE,
            impact_radius=ImpactRadius.CODE_BASE,
            risk_level=RiskLevel.LOW,
            source_category=SourceCategory.ORG_GUIDELINE,
            content="Keep records for seven years.",
        )
    )
    session.commit()

    response = client.get(f"/regulation/{task.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["policy_id"] == str(task.policy_id)
    assert body["meta"]["source_name"] == "retention-policy.md"
    assert body["meta"]["version"] == "3"
    assert body["meta"]["source_hash"] == "manifest-hash"
    assert body["meta"]["version_chain"] == [
        str(task.previous_version_id),
        str(task.id),
    ]
    assert set(body["buckets"]) == {"A1", "A2", "B", "C"}
    assert len(body["buckets"]["A1"]) == 1
