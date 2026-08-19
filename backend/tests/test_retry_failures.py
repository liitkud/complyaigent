import asyncio
from uuid import uuid4

import pytest
from sqlmodel import Session

from app.models.task import IngestionTask, TaskStatus
from app.services import categorizer, pipeline
from app.worker.tasks import run_background_task


def test_background_task_retries_at_most_three_attempts():
    attempts = 0

    async def flaky_task():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise RuntimeError("temporary failure")

    asyncio.run(run_background_task(flaky_task))

    assert attempts == 3


def test_background_task_reraises_after_three_attempts():
    attempts = 0

    async def failing_task():
        nonlocal attempts
        attempts += 1
        raise RuntimeError("terminal failure")

    asyncio.run(run_background_task(failing_task))

    assert attempts == 3


def test_categorizer_exhaustion_raises(monkeypatch):
    attempts = 0

    class FailingLLM:
        async def ainvoke(self, prompt: str):
            nonlocal attempts
            attempts += 1
            raise RuntimeError("provider unavailable")

    async def no_wait(delay: float):
        return None

    monkeypatch.setattr(categorizer.categorizer, "_llm", FailingLLM())
    monkeypatch.setattr(categorizer.asyncio, "sleep", no_wait)

    with pytest.raises(RuntimeError, match="Categorizer failed after 3 attempts"):
        asyncio.run(categorizer.categorizer.categorize_rules("requirements"))

    assert attempts == 3


def test_pipeline_marks_zero_rules_as_failed(session: Session, tmp_path, monkeypatch):
    task = IngestionTask(id=uuid4(), source_hash="zero-rules")
    session.add(task)
    session.commit()

    policy_path = tmp_path / "policy.md"
    policy_path.write_text("A requirement", encoding="utf-8")

    async def empty_rules(compacted_text: str) -> list[dict]:
        return []

    async def compact(text: str) -> str:
        return "compacted requirements"

    monkeypatch.setattr(pipeline.categorizer, "categorize_rules", empty_rules)
    monkeypatch.setattr(pipeline.compactor, "compact_document", compact)

    with pytest.raises(ValueError, match="Categorizer returned zero rules"):
        asyncio.run(pipeline._run_pipeline(str(task.id), str(policy_path)))

    session.refresh(task)
    assert task.status == TaskStatus.FAILED
    assert task.current_stage is not None
    assert "Categorizer returned zero rules" in task.current_stage
