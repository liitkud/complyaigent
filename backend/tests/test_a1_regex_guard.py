"""Unit tests for A1 regex ReDoS / self-test gate (#80)."""

from __future__ import annotations

from typing import Any

import pytest

from app.services.a1_regex_guard import (
    apply_a1_guard_to_rule,
    is_a1_serveable,
    validate_a1_regex,
)


@pytest.mark.parametrize(
    ("pattern", "test_pass", "test_fail"),
    [
        (
            r"\bAKIA[0-9A-Z]{16}\b",
            "creds AKIAIOSFODNN7EXAMPLE here",
            "creds AKIAshort here",
        ),
        (
            r"password\s*=\s*\S+",
            "password = hunter2",
            "username = alice",
        ),
        (
            r"(?i)api[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{8,}",
            'api_key: "abcd1234efgh"',
            "api_key: short",
        ),
    ],
)
def test_safe_regex_ok(pattern: str, test_pass: str, test_fail: str) -> None:
    result = validate_a1_regex(pattern, test_pass, test_fail)
    assert result.status == "ok"
    assert result.serveable


@pytest.mark.parametrize(
    "pattern",
    [
        r"(a+)+$",
        r"(a*)*$",
        r"([a-zA-Z]+)*$",
        r"(a|aa)+$",
        r"(a|a?)+$",
    ],
)
def test_evil_regex_quarantined(pattern: str) -> None:
    result = validate_a1_regex(pattern, run_smoke=False)
    assert result.status == "quarantined"
    assert not result.serveable


def test_invalid_regex_rejected() -> None:
    result = validate_a1_regex(r"(unclosed")
    assert result.status == "rejected"
    assert result.reason.startswith("compile_error")


def test_missing_regex_rejected() -> None:
    assert validate_a1_regex(None).status == "rejected"
    assert validate_a1_regex("   ").status == "rejected"


def test_test_pass_fail_enforced() -> None:
    pattern = r"secret-\d{4}"
    assert (
        validate_a1_regex(pattern, test_pass="nope", test_fail="x").status == "rejected"
    )
    assert (
        validate_a1_regex(
            pattern, test_pass="secret-1234", test_fail="secret-1234"
        ).status
        == "rejected"
    )
    assert (
        validate_a1_regex(
            pattern, test_pass="secret-1234", test_fail="secret-xx"
        ).status
        == "ok"
    )


def test_apply_guard_demotes_reject() -> None:
    rule: dict[str, Any] = {
        "type": "A1_SCANNABLE",
        "metadata": {"regex": "(unclosed"},
    }
    apply_a1_guard_to_rule(rule)
    assert rule["type"] == "C_SEMANTIC_GUIDANCE"
    stamp = rule["metadata"]["a1_validation"]
    assert isinstance(stamp, dict)
    assert stamp["status"] == "rejected"


def test_apply_guard_quarantines_evil() -> None:
    rule: dict[str, Any] = {
        "type": "A1_SCANNABLE",
        "metadata": {
            "regex": r"(a+)+$",
            "test_pass": "aaa",
            "test_fail": "bbb",
        },
    }
    apply_a1_guard_to_rule(rule)
    assert rule["type"] == "A1_SCANNABLE"
    stamp = rule["metadata"]["a1_validation"]
    assert isinstance(stamp, dict)
    assert stamp["status"] == "quarantined"
    assert not is_a1_serveable(rule["type"], rule["metadata"])


def test_apply_guard_stamps_ok() -> None:
    rule: dict[str, Any] = {
        "type": "A1_SCANNABLE",
        "metadata": {
            "regex": r"token=[A-Z0-9]{8}",
            "test_pass": "token=ABCD1234",
            "test_fail": "token=short",
        },
    }
    apply_a1_guard_to_rule(rule)
    assert rule["type"] == "A1_SCANNABLE"
    stamp = rule["metadata"]["a1_validation"]
    assert isinstance(stamp, dict)
    assert stamp["status"] == "ok"
    assert is_a1_serveable(rule["type"], rule["metadata"])


def test_smoke_timeout_quarantines(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*_a, **_k):
        raise TimeoutError("regex smoke timed out")

    monkeypatch.setattr(
        "app.services.a1_regex_guard._timed_search",
        boom,
    )
    result = validate_a1_regex(r"abc", run_smoke=True)
    assert result.status == "quarantined"
    assert result.reason == "smoke_timeout"
