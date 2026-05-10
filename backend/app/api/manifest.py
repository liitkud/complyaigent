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
    bucket: Optional[str] = None,
    source_category: Optional[SourceCategory] = None,
    session: Session = Depends(get_session),
):
    statement = select(GovernanceRule)
    if source_category:
        statement = statement.where(GovernanceRule.source_category == source_category)

    bucket_map = {
        "A1": "A1_SCANNABLE",
        "A2": "A2_ACTIONABLE",
        "B": "B_INFRA_METADATA",
        "C": "C_SEMANTIC_GUIDANCE",
    }

    if bucket and bucket in bucket_map:
        statement = statement.where(GovernanceRule.type == bucket_map[bucket])

    rules = session.exec(statement).all()

    buckets = {"A1": [], "A2": [], "B": [], "C": []}
    reverse_map = {v: k for k, v in bucket_map.items()}

    for rule in rules:
        val = rule.type.value if hasattr(rule.type, "value") else str(rule.type)
        b_key = reverse_map.get(val)
        if b_key:
            buckets[b_key].append(rule)

    if bucket:
        # Even if filtered, return consistent structure but only with the requested bucket
        return {"buckets": {bucket: buckets.get(bucket, [])}}

    return {"buckets": buckets}


@router.get("/corp")
async def get_corp_rules(session: Session = Depends(get_session)):
    """
    Alias for /reg?source_category=org_constitution
    """
    return await list_rules(
        source_category=SourceCategory.ORG_CONSTITUTION, session=session
    )
