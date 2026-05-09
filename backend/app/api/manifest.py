from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..core.db import get_session
from ..models.task import IngestionTask
from ..models.rule import GovernanceRule, SourceCategory
from typing import Optional

router = APIRouter()


@router.get("/regulation/{id}")
async def get_manifest(id: str, session: Session = Depends(get_session)):
    task = session.get(IngestionTask, id)
    if not task:
        # Check if it's a rule ID instead
        rule = session.get(GovernanceRule, id)
        if rule:
            return rule
        raise HTTPException(status_code=404, detail="Manifest or Rule not found")

    rules = session.exec(
        select(GovernanceRule).where(GovernanceRule.task_id == task.id)
    ).all()

    return {
        "manifest_id": task.id,
        "source_hash": task.source_hash,
        "version_chain": task.version_chain,
        "rules": rules,
    }


@router.get("/reg")
async def list_rules(
    source_category: Optional[SourceCategory] = None,
    session: Session = Depends(get_session),
):
    statement = select(GovernanceRule)
    if source_category:
        statement = statement.where(GovernanceRule.source_category == source_category)

    rules = session.exec(statement).all()
    return {"rules": rules}


@router.get("/corp")
async def get_corp_rules(session: Session = Depends(get_session)):
    """
    Alias for /reg?source_category=org_constitution
    """
    return await list_rules(
        source_category=SourceCategory.ORG_CONSTITUTION, session=session
    )
