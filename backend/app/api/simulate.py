from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, col, select

from ..core.db import get_session
from ..models.rule import GovernanceRule
from ..models.task import IngestionTask
from ..services.logger import ActivityLog, log_activity
from ..services.simulator import SimulationResult, simulator

router = APIRouter()


class SimulateRequest(BaseModel):
    candidate_text: str = Field(
        default="",
        description="Candidate or proposed regulatory text to evaluate",
    )
    text: str | None = Field(
        default=None,
        description="Alternative field name for candidate text",
    )
    source_name: str | None = Field(
        default=None,
        description="Optional source identifier or regulation title",
    )
    target_policy_id: UUID | None = Field(
        default=None,
        description="Optional policy ID to scope rule evaluation",
    )
    similarity_threshold: float = Field(
        default=0.2,
        ge=0.0,
        le=1.0,
        description="Threshold score for identifying impacted rules",
    )


@router.post(
    "/simulate", response_model=SimulationResult, status_code=status.HTTP_200_OK
)
async def simulate_regulatory_change(
    request: SimulateRequest,
    session: Session = Depends(get_session),
):
    candidate_text = request.candidate_text.strip()
    if not candidate_text and request.text:
        candidate_text = request.text.strip()

    if not candidate_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate regulation text is required and cannot be empty.",
        )

    statement = select(GovernanceRule)
    if request.target_policy_id:
        tasks = session.exec(
            select(IngestionTask).where(
                IngestionTask.policy_id == request.target_policy_id
            )
        ).all()
        task_ids = [t.id for t in tasks]
        statement = statement.where(col(GovernanceRule.task_id).in_(task_ids))

    existing_rules = session.exec(statement).all()

    result = await simulator.simulate(
        candidate_text=candidate_text,
        existing_rules=list(existing_rules),
        similarity_threshold=request.similarity_threshold,
    )

    log_activity(
        action="regulatory_simulation",
        status="complete",
        details={
            "request": {
                "source_name": request.source_name,
                "target_policy_id": (
                    str(request.target_policy_id) if request.target_policy_id else None
                ),
                "similarity_threshold": request.similarity_threshold,
            },
            "result": result.model_dump(),
        },
    )

    return result


@router.get("/simulate/{id}")
async def get_simulation(id: UUID, session: Session = Depends(get_session)):
    log = session.get(ActivityLog, id)
    if not log or log.action != "regulatory_simulation":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation result not found",
        )
    return log.details.get("result", {})
