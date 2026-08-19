import asyncio
from uuid import uuid4

import pytest
from sqlmodel import Session, select

from app.models.rule import GovernanceRule
from app.models.task import IngestionTask, TaskStatus
from app.services import pipeline
from app.services.categorizer import validate_a1_rule


def a1_rule(pattern: str, test_pass: str, test_fail: str) -> dict:
    return {
        "type": "A1_SCANNABLE",
        "metadata": {
            "pattern": pattern,
            "test_pass": test_pass,
            "test_fail": test_fail,
        },
    }


def test_a1_regex_requires_compilable_matching_examples():
    assert validate_a1_rule(a1_rule(r"\bsecret\b", "a secret", "public")) is None
    assert "malformed regex" in (validate_a1_rule(a1_rule("[", "", "")) or "")
    assert "test_pass" in (
        validate_a1_rule(a1_rule("secret", "public", "public")) or ""
    )
    assert "test_fail" in (
        validate_a1_rule(a1_rule("secret", "secret", "secret")) or ""
    )


@pytest.mark.parametrize("pattern", [r"(a+)+$", r"(a|aa)+$"])
def test_a1_regex_rejects_pathological_repetition(pattern: str):
    reason = validate_a1_rule(a1_rule(pattern, "a", "b"))

    assert reason == "pathological regex: nested or ambiguous repetition"


def test_pipeline_discards_unsafe_a1_rule_and_fails_without_persistence(
    session: Session, tmp_path, monkeypatch
):
    task = IngestionTask(id=uuid4(), source_hash="unsafe-regex")
    session.add(task)
    session.commit()
    policy_path = tmp_path / "policy.md"
    policy_path.write_text("A requirement", encoding="utf-8")

    async def compact(text: str) -> str:
        return "compacted requirements"

    async def unsafe_rules(compacted_text: str) -> list[dict]:
        return [
            {
                **a1_rule("[", "", ""),
                "impact_radius": "code_base",
                "risk_level": "low",
                "source_category": "org_constitution",
                "content": "Unsafe rule",
            }
        ]

    monkeypatch.setattr(pipeline.compactor, "compact_document", compact)
    monkeypatch.setattr(pipeline.categorizer, "categorize_rules", unsafe_rules)

    with pytest.raises(ValueError, match="zero valid rules"):
        asyncio.run(pipeline._run_pipeline(str(task.id), str(policy_path)))

    session.refresh(task)
    assert task.status == TaskStatus.FAILED
    assert session.exec(select(GovernanceRule)).all() == []
