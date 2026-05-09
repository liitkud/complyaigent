from fastapi.testclient import TestClient
from uuid import uuid4
from app.models.rule import GovernanceRule, RuleType, SourceCategory
from sqlmodel import Session


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
        json={"code": "password = 'secret'", "metadata": {"rule_id": str(rule_id)}},
    )
    assert response.status_code == 202
    data = response.json()
    assert "decision" in data
    assert "reasoning" in data


def test_activity_logging(client: TestClient, session: Session):
    from app.services.logger import ActivityLog
    from sqlmodel import select
    from app.models.rule import GovernanceRule, RuleType, SourceCategory
    from app.models.task import IngestionTask

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
        json={"code": "eval('evil')", "metadata": {"rule_id": str(rule_id)}},
    )

    # Check if log exists
    logs = session.exec(select(ActivityLog)).all()
    assert len(logs) > 0
    assert logs[0].action == "risk_validation"
