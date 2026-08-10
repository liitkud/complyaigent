"""Serve-path filter: quarantined / rejected A1 never leave `/reg` (#80)."""

from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.rule import GovernanceRule, RuleType, SourceCategory
from app.models.task import IngestionTask


def _seed_a1(
    session: Session,
    *,
    regex: str,
    validation: dict | None,
    content: str,
) -> GovernanceRule:
    task = IngestionTask(id=uuid4(), source_hash=f"hash-{uuid4().hex[:8]}")
    meta: dict = {"regex": regex, "test_pass": "x", "test_fail": "y"}
    if validation is not None:
        meta["a1_validation"] = validation
    rule = GovernanceRule(
        id=uuid4(),
        task_id=task.id,
        type=RuleType.A1_SCANNABLE,
        source_category=SourceCategory.ORG_CONSTITUTION,
        content=content,
        rule_metadata=meta,
    )
    session.add(task)
    session.add(rule)
    session.commit()
    return rule


def test_reg_hides_quarantined_a1(client: TestClient, session: Session) -> None:
    safe = _seed_a1(
        session,
        regex=r"token=[A-Z0-9]{8}",
        validation={"status": "ok", "reason": "passed"},
        content="safe-a1",
    )
    _seed_a1(
        session,
        regex=r"(a+)+$",
        validation={"status": "quarantined", "reason": "nested_quantifier"},
        content="evil-a1",
    )

    response = client.get("/reg?bucket=A1")
    assert response.status_code == 200
    a1 = response.json()["buckets"]["A1"]
    contents = {r["content"] for r in a1}
    assert "safe-a1" in contents
    assert "evil-a1" not in contents
    assert any(r["id"] == str(safe.id) for r in a1)


def test_reg_hides_legacy_evil_a1(client: TestClient, session: Session) -> None:
    """Unstamped A1 with catastrophic pattern is fail-closed on serve."""
    _seed_a1(
        session,
        regex=r"(a+)+$",
        validation=None,
        content="legacy-evil",
    )
    response = client.get("/reg?bucket=A1")
    assert response.status_code == 200
    contents = {r["content"] for r in response.json()["buckets"]["A1"]}
    assert "legacy-evil" not in contents
