from fastapi import APIRouter, Depends
from sqlmodel import Session, select, col
from ..core.db import get_session
from pydantic import BaseModel
from ..services.validator import validator
from ..services.logger import log_activity, ActivityLog
from ..models.rule import GovernanceRule
from uuid import UUID
from typing import Optional
from datetime import datetime

router = APIRouter()


class ValidationRequest(BaseModel):
    code: str
    metadata: dict


@router.post("/validate", status_code=202)
async def submit_validation(
    request: ValidationRequest, session: Session = Depends(get_session)
):
    # In a real system, this would be a background task
    # For MVP, we'll run it synchronously or simulate the task_id
    rule = session.get(GovernanceRule, UUID(request.metadata.get("rule_id")))
    rule_content = rule.content if rule else "General guidance"

    result = await validator.validate_risk(request.code, rule_content)

    log_activity(
        action="risk_validation",
        details={"request": request.model_dump(), "result": result},
    )

    return {
        "status": "complete",
        "decision": result["decision"],
        "reasoning": result["reasoning"],
        "remediation": result.get("remediation"),
    }


@router.get("/validate")
async def list_validations(
    verdict: Optional[str] = None,
    since: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """
    List all past validations with optional query params: ?verdict=HIGH&since=2026-05-10
    """
    statement = select(ActivityLog).where(ActivityLog.action == "risk_validation")

    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            statement = statement.where(ActivityLog.timestamp >= since_dt)
        except ValueError:
            pass

    logs = session.exec(statement.order_by(col(ActivityLog.timestamp).desc())).all()

    results = []
    for log in logs:
        decision = log.details.get("result", {}).get("decision", "unknown").upper()

        # If verdict is HIGH/MEDIUM/LOW, we check if decision is 'unsafe' or matches rule risk
        # For simplicity, if verdict=SAFE/UNSAFE it filters by decision
        # If verdict=HIGH/MEDIUM/LOW, it's a bit ambiguous, but we'll treat it as decision filter
        if verdict and decision != verdict.upper():
            continue

        results.append(
            {
                "id": log.id,
                "timestamp": log.timestamp,
                "decision": decision,
                "reasoning": log.details.get("result", {}).get("reasoning"),
                "remediation": log.details.get("result", {}).get("remediation"),
                "metadata": log.details.get("request", {}).get("metadata"),
            }
        )

    return results
