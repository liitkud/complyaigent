"""MVP verdict sink / Loki push (#77)."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.services.verdict_log import build_verdict_event
from app.services.verdict_sink import (
    VerdictSinkError,
    push_to_loki,
    push_verdict,
    safe_push_verdict,
)


def _sample_event(**overrides):
    base = build_verdict_event(
        action="risk_validation",
        verdict="LOW",
        repo="liitkud/complyaigent",
        policy_id="pol-1",
        validation_id="val-1",
        rule_id="rule-1",
        timestamp=datetime(2026, 8, 10, 12, 0, tzinfo=UTC),
    )
    base.update(overrides)
    return base


class _FakeResp:
    def __init__(self, status_code: int, text: str = ""):
        self.status_code = status_code
        self.text = text


class _FakeClient:
    def __init__(self, *, status_code: int = 204, raise_exc: Exception | None = None):
        self.status_code = status_code
        self.raise_exc = raise_exc
        self.calls: list[dict] = []

    def post(
        self, url: str, *, content: bytes, headers: dict[str, str], timeout: float
    ):
        self.calls.append(
            {"url": url, "content": content, "headers": headers, "timeout": timeout}
        )
        if self.raise_exc:
            raise self.raise_exc
        return _FakeResp(
            self.status_code, text="ok" if self.status_code < 400 else "boom"
        )


def test_push_verdict_noop_when_unset():
    event = _sample_event()
    assert push_verdict(event, loki_url="", sink_path="") == "noop"


def test_push_verdict_loki_success_with_mock():
    client = _FakeClient(status_code=204)
    event = _sample_event()
    result = push_verdict(
        event,
        loki_url="http://loki.test:3100",
        sink_path="",
        client=client,
    )
    assert result == "loki"
    assert len(client.calls) == 1
    assert client.calls[0]["url"] == "http://loki.test:3100/loki/api/v1/push"
    assert b"risk_validation" in client.calls[0]["content"]


def test_push_verdict_loki_failure_raises():
    client = _FakeClient(status_code=500)
    with pytest.raises(VerdictSinkError, match="rejected"):
        push_to_loki(
            _sample_event(),
            loki_url="http://loki.test:3100",
            client=client,
        )


def test_safe_push_verdict_returns_error_on_failure():
    client = _FakeClient(status_code=503)
    assert (
        safe_push_verdict(
            _sample_event(),
            loki_url="http://loki.test:3100",
            sink_path="",
            client=client,
        )
        == "error"
    )


def test_push_verdict_file_fallback(tmp_path):
    path = tmp_path / "verdicts.jsonl"
    event = _sample_event()
    assert push_verdict(event, loki_url="", sink_path=str(path)) == "file"
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    assert "LOW" in lines[0]


def test_validate_path_calls_sink(client, monkeypatch):
    calls: list[dict] = []

    def fake_push(event, **kwargs):
        calls.append(event)
        return "noop"

    monkeypatch.setattr("app.services.verdict_log.safe_push_verdict", fake_push)

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
    assert len(calls) == 1
    assert calls[0]["verdict"] == "LOW"


def test_hitl_resolve_emits_sink(client, monkeypatch):
    calls: list[dict] = []

    def fake_push(event, **kwargs):
        calls.append(event)
        return "noop"

    monkeypatch.setattr("app.services.verdict_log.safe_push_verdict", fake_push)

    async def fake_validate(code_snippet, rule_content):
        return {"verdict": "MID", "reasoning": "needs human"}

    monkeypatch.setattr("app.api.validate.validator.validate_risk", fake_validate)

    create = client.post(
        "/validate",
        json={
            "code_snippet": "x",
            "rule_id": str(uuid4()),
            "repo": "liitkud/complyaigent",
            "policy_id": "pol-hitl",
        },
    )
    assert create.status_code == 202
    vid = create.json()["validation_id"]
    calls.clear()

    patch = client.patch(f"/validate/{vid}", json={"action": "approve"})
    assert patch.status_code == 200, patch.text
    body = patch.json()
    assert body["status"] == "approved"
    assert body["verdict_event"]["action"] == "hitl_resolve"
    assert len(calls) == 1
    assert calls[0]["action"] == "hitl_resolve"
    assert calls[0]["verdict"] == "approved"
