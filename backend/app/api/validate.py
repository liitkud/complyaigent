from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, col, select

from ..core.db import get_session
from ..models.rule import GovernanceRule
from ..services.logger import ActivityLog, VerdictEvent, log_activity
from ..services.pii import detect_pii
from ..services.validator import validator

router = APIRouter()


class ValidateRequest(BaseModel):
    code_snippet: str
    rule_id: str
    context: str | None = None


class HITLAction(BaseModel):
    action: str  # "approve" or "reject"


@router.post("/validate", status_code=202)
async def submit_validation(
    request: ValidateRequest, session: Session = Depends(get_session)
):
    # Retrieve the rule
    rule = None
    try:
        rule = session.get(GovernanceRule, UUID(request.rule_id))
    except Exception as e:
        print("Error retrieving rule:", e)
        pass

    rule_content = rule.content if rule else "General guidance"

    pii_findings = detect_pii(request.code_snippet)
    if pii_findings:
        pii_types = [finding.entity_type for finding in pii_findings]
        result = {
            "verdict": "HIGH",
            "reasoning": "Validation blocked because the input contains PII.",
            "remediation": "Remove personal data before submitting for validation.",
        }
        verdict_source = "pii_gate"
    else:
        result = await validator.validate_risk(request.code_snippet, rule_content)
        pii_types = []
        verdict_source = "llm"

    verdict_event = VerdictEvent(
        decision=result.get("verdict", "HIGH"),
        source=verdict_source,
        reasoning=result.get("reasoning", "No reasoning provided"),
        remediation=result.get("remediation", "Review manually."),
        pii_types=pii_types,
    ).model_dump()

    # Log activity
    log = log_activity(
        action="risk_validation",
        status="complete" if result["verdict"] != "MID" else "pending",
        details={
            "request": request.model_dump(),
            "result": result,
            "verdict_event": verdict_event,
        },
    )

    return {
        "validation_id": str(log.id),
        "status": log.status,
    }


@router.get("/validate/{id}")
async def get_validation(id: UUID, session: Session = Depends(get_session)):
    log = session.get(ActivityLog, id)
    if not log or log.action != "risk_validation":
        raise HTTPException(status_code=404, detail="Validation result not found")

    result = log.details.get("result", {})
    return {
        "validation_id": str(log.id),
        "verdict": result.get("verdict", "HIGH"),
        "reasoning": result.get("reasoning", "No reasoning provided"),
        "activity_logged": True,
        "created_at": log.timestamp.isoformat(),
        "status": log.status,
    }


@router.patch("/validate/{id}")
async def hitl_action(
    id: UUID, action: HITLAction, session: Session = Depends(get_session)
):
    log = session.get(ActivityLog, id)
    if not log or log.action != "risk_validation":
        raise HTTPException(status_code=404, detail="Validation result not found")

    if action.action == "approve":
        log.status = "approved"
    elif action.action == "reject":
        log.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    session.add(log)
    session.commit()
    return {
        "success": True,
        "validation_id": str(log.id),
        "status": log.status,
    }


@router.get("/validate")
async def list_validations(
    verdict: str | None = None,
    since: str | None = None,
    session: Session = Depends(get_session),
):
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
        res = log.details.get("result", {})
        current_verdict = res.get("verdict", "unknown").upper()

        if verdict and current_verdict != verdict.upper():
            continue

        results.append(
            {
                "validation_id": str(log.id),
                "verdict": current_verdict,
                "reasoning": res.get("reasoning"),
                "activity_logged": True,
                "created_at": log.timestamp.isoformat(),
                "status": log.status,
            }
        )

    return results
