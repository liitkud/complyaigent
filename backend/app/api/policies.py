from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select

from ..core.db import get_session
from ..models.policy import Policy

router = APIRouter()


def _serialize(policy: Policy) -> dict:
    return {
        "id": str(policy.id),
        "name": policy.name,
        "source_url": policy.source_url,
        "version": policy.version,
        "hash": policy.hash,
        "task_id": str(policy.task_id) if policy.task_id else None,
        "is_current": policy.is_current,
        "created_at": policy.created_at.isoformat(),
    }


@router.get("/policies")
async def list_policies(
    current_only: bool = True,
    session: Session = Depends(get_session),
):
    statement = select(Policy)
    if current_only:
        statement = statement.where(col(Policy.is_current).is_(True))
    statement = statement.order_by(col(Policy.name), col(Policy.version).desc())
    policies = session.exec(statement).all()
    return [_serialize(p) for p in policies]


@router.get("/policies/{policy_id}")
async def get_policy(policy_id: UUID, session: Session = Depends(get_session)):
    policy = session.get(Policy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _serialize(policy)
