from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, col, select

from ..core.config import settings
from ..core.db import get_session
from ..models.rule import GovernanceRule
from ..services.logger import ActivityLog, engine as activity_engine, log_activity
from ..services.validator import validator
from ..services.verdict_log import build_verdict_event, emit_verdict_log

router = APIRouter()


class ValidateRequest(BaseModel):
    code_snippet: str
    rule_id: str
    context: str | None = None
    repo: str | None = None
    policy_id: str | None = None


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

    # Perform validation
    result = await validator.validate_risk(request.code_snippet, rule_content)

    status = "complete" if result["verdict"] != "MID" else "pending"

    # Pre-allocate validation id via activity log, then attach structured verdict
    details = {
        "request": request.model_dump(),
        "result": result,
    }
    log = log_activity(
        action="risk_validation",
        status=status,
        details=details,
    )

    verdict_event = build_verdict_event(
        action="risk_validation",
        verdict=result["verdict"],
        repo=request.repo or getattr(settings, "PROJECT_NAME", "") or "",
        policy_id=request.policy_id,
        validation_id=str(log.id),
        rule_id=request.rule_id,
        timestamp=log.timestamp if log.timestamp.tzinfo else log.timestamp.replace(tzinfo=None),
    )
    emit_verdict_log(verdict_event)

    # Persist structured event on the activity row (same engine as log_activity)
    with Session(activity_engine) as s:
        row = s.get(ActivityLog, log.id)
        if row:
            merged = dict(row.details or {})
            merged["verdict_event"] = verdict_event
            row.details = merged
            s.add(row)
            s.commit()

    return {
        "validation_id": str(log.id),
        "status": "processing" if result["verdict"] == "MID" else "complete",
        "verdict_event": verdict_event,
    }


@router.get("/validate/{id}")
async def get_validation(id: UUID, session: Session = Depends(get_session)):
    log = session.get(ActivityLog, id)
    if not log or log.action != "risk_validation":
        raise HTTPException(status_code=404, detail="Validation result not found")

    result = log.details.get("result", {})
    verdict_event = log.details.get("verdict_event")
    payload = {
        "validation_id": str(log.id),
        "verdict": result.get("verdict", "HIGH"),
        "reasoning": result.get("reasoning", "No reasoning provided"),
        "activity_logged": True,
        "created_at": log.timestamp.isoformat(),
        "status": log.status,
    }
    if verdict_event:
        payload["verdict_event"] = verdict_event
    return payload


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
    return {"success": True, "status": log.status}


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

        item = {
            "validation_id": str(log.id),
            "verdict": current_verdict,
            "reasoning": res.get("reasoning"),
            "activity_logged": True,
            "created_at": log.timestamp.isoformat(),
            "status": log.status,
        }
        if "verdict_event" in (log.details or {}):
            item["verdict_event"] = log.details["verdict_event"]
        results.append(item)

    return results
