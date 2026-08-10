"""Integration: PII on /validate forces HIGH/block (#79)."""

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.rule import GovernanceRule, RuleType, SourceCategory
from app.models.task import IngestionTask
from tests.fixtures.pii_snippets import CARD_SNIPPET, CLEAN_SNIPPET, EMAIL_SNIPPET


def _seed_rule(session: Session) -> str:
    rule_id = uuid4()
    task_id = uuid4()
    session.add(IngestionTask(id=task_id, source_hash=f"pii-{rule_id}"))
    session.add(
        GovernanceRule(
            id=rule_id,
            task_id=task_id,
            type=RuleType.A1_SCANNABLE,
            source_category=SourceCategory.ORG_CONSTITUTION,
            content="No secrets in source.",
        )
    )
    session.commit()
    return str(rule_id)


def test_validate_blocks_email_pii(client: TestClient, session: Session, monkeypatch):
    rule_id = _seed_rule(session)

    async def boom(*_args, **_kwargs):
        raise AssertionError("LLM validator must not run when PII is present")

    monkeypatch.setattr("app.api.validate.validator.validate_risk", boom)

    resp = client.post(
        "/validate",
        json={
            "code_snippet": EMAIL_SNIPPET,
            "rule_id": rule_id,
            "repo": "liitkud/complyaigent",
            "policy_id": "pol-pii",
        },
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "complete"
    event = body["verdict_event"]
    assert event["verdict"] == "HIGH"
    assert event["validation_id"] == body["validation_id"]

    detail = client.get(f"/validate/{body['validation_id']}")
    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["verdict"] == "HIGH"
    assert (
        "PII" in detail_body["reasoning"] or "pii" in detail_body["reasoning"].lower()
    )


def test_validate_blocks_card_pii(client: TestClient, session: Session, monkeypatch):
    rule_id = _seed_rule(session)

    async def boom(*_args, **_kwargs):
        raise AssertionError("LLM validator must not run when PII is present")

    monkeypatch.setattr("app.api.validate.validator.validate_risk", boom)

    resp = client.post(
        "/validate",
        json={"code_snippet": CARD_SNIPPET, "rule_id": rule_id},
    )
    assert resp.status_code == 202, resp.text
    assert resp.json()["verdict_event"]["verdict"] == "HIGH"


def test_validate_clean_snippet_uses_llm_path(
    client: TestClient, session: Session, monkeypatch
):
    rule_id = _seed_rule(session)

    async def fake_validate(code_snippet, rule_content):
        assert "alice.demo" not in code_snippet
        return {"verdict": "LOW", "reasoning": "clean", "remediation": "n/a"}

    monkeypatch.setattr("app.api.validate.validator.validate_risk", fake_validate)

    resp = client.post(
        "/validate",
        json={"code_snippet": CLEAN_SNIPPET, "rule_id": rule_id},
    )
    assert resp.status_code == 202, resp.text
    assert resp.json()["verdict_event"]["verdict"] == "LOW"
