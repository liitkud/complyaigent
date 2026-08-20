from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models.rule import GovernanceRule, RuleType, SourceCategory


def test_validate_code_safe(client: TestClient, session: Session):
    # Setup a mock rule in DB
    rule_id = uuid4()
    rule = GovernanceRule(
        id=rule_id,
        task_id=uuid4(),  # Dummy task_id (SQLModel might complain if it doesn't exist)
        type=RuleType.A1_SCANNABLE,
        source_category=SourceCategory.ORG_CONSTITUTION,
        content="No plain text passwords.",
    )
    # We need a task too because of foreign key
    from app.models.task import IngestionTask

    task = IngestionTask(id=rule.task_id, source_hash="dummy")
    session.add(task)
    session.add(rule)
    session.commit()

    response = client.post(
        "/validate",
        json={"code_snippet": "password = 'secret'", "rule_id": str(rule_id)},
    )
    assert response.status_code == 202
    data = response.json()
    assert "validation_id" in data
    assert "status" in data


def test_activity_logging(client: TestClient, session: Session):
    from sqlmodel import select

    from app.models.rule import GovernanceRule, RuleType, SourceCategory
    from app.models.task import IngestionTask
    from app.services.logger import ActivityLog

    # Setup rule
    rule_id = uuid4()
    task_id = uuid4()
    session.add(IngestionTask(id=task_id, source_hash="dummy2"))
    session.add(
        GovernanceRule(
            id=rule_id,
            task_id=task_id,
            type=RuleType.A1_SCANNABLE,
            source_category=SourceCategory.ORG_CONSTITUTION,
            content="Test rule",
        )
    )
    session.commit()

    # Trigger a validation
    client.post(
        "/validate",
        json={"code_snippet": "eval('evil')", "rule_id": str(rule_id)},
    )

    # Check if log exists
    logs = session.exec(select(ActivityLog)).all()
    assert len(logs) > 0
    assert logs[0].action == "risk_validation"


@pytest.mark.parametrize(
    "action, expected_status", [("approve", "approved"), ("reject", "rejected")]
)
def test_hitl_lifecycle_uses_stable_statuses(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    action: str,
    expected_status: str,
):
    async def fake_mid_validation(code: str, rule_context: str) -> dict:
        return {
            "verdict": "MID",
            "reasoning": "Human review required.",
            "remediation": "Review the change.",
        }

    monkeypatch.setattr("app.api.validate.validator.validate_risk", fake_mid_validation)

    submitted = client.post(
        "/validate",
        json={"code_snippet": "needs review", "rule_id": str(uuid4())},
    )
    assert submitted.status_code == 202
    assert submitted.json()["status"] == "pending"
    validation_id = submitted.json()["validation_id"]

    pending = client.get(f"/validate/{validation_id}")
    assert pending.status_code == 200
    assert pending.json() == {
        "validation_id": validation_id,
        "verdict": "MID",
        "reasoning": "Human review required.",
        "activity_logged": True,
        "created_at": pending.json()["created_at"],
        "status": "pending",
    }

    updated = client.patch(f"/validate/{validation_id}", json={"action": action})
    assert updated.status_code == 200
    assert updated.json() == {
        "success": True,
        "validation_id": validation_id,
        "status": expected_status,
    }

    assert client.get(f"/validate/{validation_id}").json()["status"] == expected_status


def test_pii_blocks_validator_and_persists_verdict_event(
    client: TestClient, session: Session, monkeypatch
):
    from app.services import validator
    from app.services.logger import ActivityLog

    async def fail_if_called(*args, **kwargs):
        raise AssertionError("LLM validator must not run for PII")

    monkeypatch.setattr(validator.validator, "validate_risk", fail_if_called)

    response = client.post(
        "/validate",
        json={
            "code_snippet": (
                "email = 'person@example.com'; phone = '+1 555-123-4567'; "
                "card = '4111 1111 1111 1111'"
            ),
            "rule_id": str(uuid4()),
        },
    )

    assert response.status_code == 202
    log = session.exec(select(ActivityLog)).one()
    assert log.details["result"]["verdict"] == "HIGH"
    assert log.details["verdict_event"] == {
        "schema_version": 1,
        "event_type": "validation.verdict",
        "decision": "HIGH",
        "source": "pii_gate",
        "reasoning": "Validation blocked because the input contains PII.",
        "remediation": "Remove personal data before submitting for validation.",
        "pii_types": ["email", "card", "phone"],
    }


def test_validation_persists_verdict_event_for_llm_decision(
    client: TestClient, session: Session
):
    from app.services.logger import ActivityLog

    response = client.post(
        "/validate",
        json={"code_snippet": "print('safe')", "rule_id": str(uuid4())},
    )

    assert response.status_code == 202
    log = session.exec(select(ActivityLog)).one()
    event = log.details["verdict_event"]
    assert event["schema_version"] == 1
    assert event["event_type"] == "validation.verdict"
    assert event["decision"] == "LOW"
    assert event["source"] == "llm"
    assert event["pii_types"] == []
