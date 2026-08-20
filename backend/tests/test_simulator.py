from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.rule import (
    GovernanceRule,
    ImpactRadius,
    RiskLevel,
    RuleType,
    SourceCategory,
)
from app.models.task import IngestionTask
from app.services.logger import ActivityLog


def test_simulate_empty_text_returns_400(client: TestClient):
    response = client.post("/simulate", json={"candidate_text": "   "})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]


def test_simulate_without_existing_rules(client: TestClient):
    response = client.post(
        "/simulate",
        json={"candidate_text": "Local formatting rule for linting."},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_rules_evaluated"] == 0
    assert data["impacted_rules_count"] == 0
    assert data["impact_radius"] == "code_base"
    assert data["overall_risk_level"] == "low"
    assert data["impacted_rules"] == []


def test_simulate_global_standard_intrinsic_detection(client: TestClient):
    response = client.post(
        "/simulate",
        json={
            "candidate_text": (
                "Under GDPR statutory requirements, personal data must be erased upon request."
            )
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["impact_radius"] == "global_standard"


def test_simulate_org_wide_intrinsic_detection(client: TestClient):
    response = client.post(
        "/simulate",
        json={
            "candidate_text": (
                "Company-wide policy: all employees must complete security awareness training annually."
            )
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["impact_radius"] == "org_wide"


def test_simulate_anchor_match_evaluates_modified_rule(
    client: TestClient, session: Session
):
    task = IngestionTask(source_hash="hash-1", source_name="gdpr.md")
    session.add(task)
    session.commit()
    session.refresh(task)

    rule = GovernanceRule(
        task_id=task.id,
        type=RuleType.A1_SCANNABLE,
        impact_radius=ImpactRadius.ORG_WIDE,
        risk_level=RiskLevel.HIGH,
        source_category=SourceCategory.GOVERNMENT_LAW,
        content="Article 17: Personal data retention must not exceed 7 years.",
        tags=["retention", "gdpr"],
    )
    session.add(rule)
    session.commit()

    response = client.post(
        "/simulate",
        json={
            "candidate_text": (
                "Article 17: Personal data retention must not exceed 10 years with mandatory audit logging."
            )
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_rules_evaluated"] == 1
    assert data["impacted_rules_count"] == 1
    assert data["impact_radius"] == "org_wide"
    assert data["overall_risk_level"] == "high"
    assert data["bucket_breakdown"]["A1"] == 1
    assert data["risk_summary"]["high_risk_count"] == 1

    impacted = data["impacted_rules"][0]
    assert impacted["rule_id"] == str(rule.id)
    assert impacted["change_type"] == "MODIFIED"
    assert impacted["type"] == "A1_SCANNABLE"
    assert impacted["risk_level"] == "high"


def test_simulate_duplicate_rule_detection(client: TestClient, session: Session):
    task = IngestionTask(source_hash="hash-2", source_name="auth.md")
    session.add(task)
    session.commit()
    session.refresh(task)

    rule_text = "All external API endpoints must enforce JWT token authentication."
    rule = GovernanceRule(
        task_id=task.id,
        type=RuleType.B_INFRA_METADATA,
        impact_radius=ImpactRadius.CODE_BASE,
        risk_level=RiskLevel.MEDIUM,
        source_category=SourceCategory.ORG_GUIDELINE,
        content=rule_text,
    )
    session.add(rule)
    session.commit()

    response = client.post(
        "/simulate",
        json={"candidate_text": rule_text},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["impacted_rules_count"] == 1
    assert data["impacted_rules"][0]["change_type"] == "DUPLICATE"


def test_simulate_conflicting_rule_detection(client: TestClient, session: Session):
    task = IngestionTask(source_hash="hash-3", source_name="db-access.md")
    session.add(task)
    session.commit()
    session.refresh(task)

    rule = GovernanceRule(
        task_id=task.id,
        type=RuleType.A2_ACTIONABLE,
        impact_radius=ImpactRadius.CODE_BASE,
        risk_level=RiskLevel.MEDIUM,
        source_category=SourceCategory.ORG_GUIDELINE,
        content="Direct production database access is permitted for approved emergency batch jobs.",
    )
    session.add(rule)
    session.commit()

    response = client.post(
        "/simulate",
        json={
            "candidate_text": (
                "Direct production database access is prohibited for all emergency jobs."
            )
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["impacted_rules_count"] == 1
    assert data["impacted_rules"][0]["change_type"] == "CONFLICT"


def test_simulate_target_policy_scoping(client: TestClient, session: Session):
    task1 = IngestionTask(source_hash="h1", source_name="p1.md")
    task2 = IngestionTask(source_hash="h2", source_name="p2.md")
    session.add(task1)
    session.add(task2)
    session.commit()
    session.refresh(task1)
    session.refresh(task2)

    rule1 = GovernanceRule(
        task_id=task1.id,
        type=RuleType.C_SEMANTIC_GUIDANCE,
        impact_radius=ImpactRadius.CODE_BASE,
        risk_level=RiskLevel.LOW,
        source_category=SourceCategory.ORG_GUIDELINE,
        content="Section 4.1: Log error details safely.",
    )
    rule2 = GovernanceRule(
        task_id=task2.id,
        type=RuleType.C_SEMANTIC_GUIDANCE,
        impact_radius=ImpactRadius.GLOBAL_STANDARD,
        risk_level=RiskLevel.HIGH,
        source_category=SourceCategory.GOVERNMENT_LAW,
        content="Section 4.1: Log error details in compliance with international audit standard.",
    )
    session.add(rule1)
    session.add(rule2)
    session.commit()

    # Scope only to task1's policy
    response = client.post(
        "/simulate",
        json={
            "candidate_text": "Section 4.1: Updated error logging instructions.",
            "target_policy_id": str(task1.policy_id),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_rules_evaluated"] == 1
    assert data["impacted_rules_count"] == 1
    assert data["impacted_rules"][0]["rule_id"] == str(rule1.id)


def test_simulate_alternative_field_and_get_by_id(client: TestClient, session: Session):
    task = IngestionTask(source_hash="h-field", source_name="p.md")
    session.add(task)
    session.commit()
    session.refresh(task)

    rule = GovernanceRule(
        task_id=task.id,
        type=RuleType.B_INFRA_METADATA,
        impact_radius=ImpactRadius.CODE_BASE,
        risk_level=RiskLevel.LOW,
        source_category=SourceCategory.ORG_GUIDELINE,
        content="Infrastructure TLS version must be 1.3.",
    )
    session.add(rule)
    session.commit()

    # Submit using 'text' instead of 'candidate_text'
    post_res = client.post(
        "/simulate",
        json={"text": "Infrastructure TLS configuration must require TLS 1.3."},
    )
    assert post_res.status_code == 200
    result_data = post_res.json()
    assert result_data["impacted_rules_count"] == 1

    # Check activity log was created
    from sqlmodel import select

    log = session.exec(
        select(ActivityLog).where(ActivityLog.action == "regulatory_simulation")
    ).first()
    assert log is not None
    assert log.status == "complete"

    # Query GET /simulate/{log.id}
    get_res = client.get(f"/simulate/{log.id}")
    assert get_res.status_code == 200
    assert get_res.json()["impact_radius"] == result_data["impact_radius"]


def test_simulate_get_nonexistent_id_returns_404(client: TestClient):
    res = client.get(f"/simulate/{uuid4()}")
    assert res.status_code == 404
