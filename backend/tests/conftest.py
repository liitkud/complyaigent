import json
import os
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# Keep test imports from reading live values in the repository .env file.
os.environ.update(
    {
        "DATABASE_URL": "sqlite://",
        "LLM_API_KEY": "test-only",  # pragma: allowlist secret
        "LLM_ENDPOINT": "http://127.0.0.1:9/v1",
        "CHAT_MODEL": "test-only",
    }
)

from app.core import db as db_module
from app.core.cache import clear_manifest_cache
from app.core.db import get_session
from app.services import categorizer, compactor, comparator, logger, validator
from main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


class FakeLLM:
    async def ainvoke(self, prompt: str):
        if "Return a JSON list of objects" in prompt:
            content = json.dumps(
                [
                    {
                        "type": "A1_SCANNABLE",
                        "impact_radius": "code_base",
                        "risk_level": "low",
                        "source_category": "org_constitution",
                        "content": "Test-only governance requirement.",
                        "remediation": "Review the requirement.",
                        "tags": [],
                        "metadata": {
                            "pattern": r"test-only",
                            "test_pass": "test-only value",
                            "test_fail": "safe value",
                        },
                    }
                ]
            )
        elif "Return exactly one word" in prompt:
            content = "DISTINCT"
        elif "Return JSON:" in prompt:
            content = json.dumps(
                {
                    "verdict": "HIGH" if "eval(" in prompt else "LOW",
                    "reasoning": "Deterministic test-only result.",
                    "remediation": "Review manually if required.",
                }
            )
        else:
            content = prompt.split("Document:", 1)[-1].strip()
        return SimpleNamespace(content=content)


@pytest.fixture(autouse=True)
def test_runtime(monkeypatch):
    # All services must use the same in-memory database and fake LLM.
    monkeypatch.setattr(db_module, "engine", engine)
    monkeypatch.setattr(logger, "engine", engine)
    monkeypatch.setattr(
        logger,
        "Session",
        lambda bind, **kwargs: Session(bind, **kwargs),
    )
    monkeypatch.setattr("app.services.pipeline.engine", engine)
    fake_llm = FakeLLM()
    services = (
        validator.validator,
        comparator.comparator,
        compactor.compactor,
        categorizer.categorizer,
    )
    for service in services:
        setattr(service, "_llm", fake_llm)  # noqa: B010


@pytest.fixture(name="session")
def session_fixture():
    clear_manifest_cache()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)
    clear_manifest_cache()


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
