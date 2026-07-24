"""MVP structured verdict logging schema (#76)."""

from datetime import UTC, datetime
from uuid import uuid4

REQUIRED_KEYS = {
    "action",
    "verdict",
    "repo",
    "timestamp",
    "policy_id",
    "validation_id",
    "rule_id",
}


def test_verdict_log_module_exports_schema():
    from app.services.verdict_log import REQUIRED_VERDICT_KEYS, build_verdict_event

    assert set(REQUIRED_VERDICT_KEYS) >= REQUIRED_KEYS
    assert callable(build_verdict_event)


def test_build_verdict_event_has_required_keys():
    from app.services.verdict_log import build_verdict_event

    event = build_verdict_event(
        action="risk_validation",
        verdict="HIGH",
        repo="liitkud/complyaigent",
        policy_id="pol-1",
        validation_id="val-1",
        rule_id="rule-1",
        timestamp=datetime(2026, 7, 24, 4, 0, tzinfo=UTC),
    )
    missing = REQUIRED_KEYS - set(event)
    assert not missing, f"missing keys: {missing}"
    assert event["verdict"] == "HIGH"
    assert event["action"] == "risk_validation"
    assert event.get("policyId") == "pol-1" or event.get("policy_id") == "pol-1"


def test_validate_path_returns_verdict_event(client, monkeypatch):
    async def fake_validate(code_snippet, rule_content):
        return {"verdict": "LOW", "reasoning": "ok"}

    monkeypatch.setattr("app.api.validate.validator.validate_risk", fake_validate)

    resp = client.post(
        "/validate",
        json={
            "code_snippet": "print('hi')",
            "rule_id": str(uuid4()),
            "context": "unit",
            "repo": "liitkud/complyaigent",
            "policy_id": "pol-demo",
        },
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert "validation_id" in body
    assert "verdict_event" in body
    event = body["verdict_event"]
    missing = REQUIRED_KEYS - set(event)
    assert not missing, f"missing keys: {missing}"
    assert event["verdict"] == "LOW"
    assert event["repo"] == "liitkud/complyaigent"
    assert event["policy_id"] == "pol-demo"
    assert event["validation_id"] == body["validation_id"]
