from fastapi.testclient import TestClient
from uuid import uuid4
from app.models.rule import GovernanceRule, RuleType, SourceCategory
from app.models.task import IngestionTask
from sqlmodel import Session


def test_get_activity(client: TestClient):
    # Ensure some activity exists
    client.get("/health")

    response = client.get("/activity")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_validations_filter(client: TestClient, session: Session):
    # Create mock rule and validation
    rule_id = uuid4()
    task_id = uuid4()
    session.add(IngestionTask(id=task_id, source_hash="test-filter"))
    session.add(
        GovernanceRule(
            id=rule_id,
            task_id=task_id,
            type=RuleType.A1_SCANNABLE,
            source_category=SourceCategory.ORG_CONSTITUTION,
            content="Filter test rule",
        )
    )
    session.commit()

    # Trigger validation (will return safe/unsafe)
    client.post(
        "/validate",
        json={"code": "print('test')", "metadata": {"rule_id": str(rule_id)}},
    )

    # List validations
    response = client.get("/validate")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

    # Test filtering by since (future date should return 0)
    response_future = client.get("/validate?since=2099-01-01")
    assert len(response_future.json()) == 0
