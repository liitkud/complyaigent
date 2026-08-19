from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select

from ..core.db import get_session
from ..models.rule import GovernanceRule, SourceCategory
from ..models.task import IngestionTask

router = APIRouter()


@router.get("/regulation")
async def list_regulations(session: Session = Depends(get_session)):
    """
    List all ingested regulations.
    """
    tasks = session.exec(
        select(IngestionTask).order_by(col(IngestionTask.created_at).desc())
    ).all()

    results = []
    for task in tasks:
        results.append(
            {
                "id": str(task.id),
                "policy_id": str(task.policy_id),
                "source_name": task.source_name,
                "source_type": task.source_type,
                "ingested_at": task.created_at.isoformat(),
                "version": str(task.version_number),
                "version_number": task.version_number,
                "source_hash": task.source_hash,
                "previous_version_id": (
                    str(task.previous_version_id)
                    if task.previous_version_id
                    else None
                ),
            }
        )
    return results


@router.get("/regulation/{id}")
async def get_manifest(id: str, session: Session = Depends(get_session)):
    from uuid import UUID

    try:
        task_id = UUID(id)
    except ValueError:
        # Check if it's a rule ID instead
        try:
            rule = session.get(GovernanceRule, UUID(id))
            if rule:
                return rule
        except Exception:
            pass
        raise HTTPException(
            status_code=404, detail="Manifest or Rule not found"
        ) from None

    task = session.get(IngestionTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Manifest not found")

    rules = session.exec(
        select(GovernanceRule).where(GovernanceRule.task_id == task.id)
    ).all()

    buckets = {"A1": [], "A2": [], "B": [], "C": []}
    bucket_map = {
        "A1_SCANNABLE": "A1",
        "A2_ACTIONABLE": "A2",
        "B_INFRA_METADATA": "B",
        "C_SEMANTIC_GUIDANCE": "C",
    }

    for rule in rules:
        b_key = bucket_map.get(rule.type)
        if b_key:
            buckets[b_key].append(rule)

    return {
        "meta": {
            "source_uuid": str(task.id),
            "policy_id": str(task.policy_id),
            "source_name": task.source_name,
            "source_type": task.source_type,
            "ingested_at": task.created_at.isoformat(),
            "version": str(task.version_number),
            "version_number": task.version_number,
            "source_hash": task.source_hash,
            "previous_version_id": (
                str(task.previous_version_id) if task.previous_version_id else None
            ),
            "version_chain": task.version_chain,
            "total_rules": len(rules),
        },
        "buckets": buckets,
    }


@router.get("/reg")
async def list_rules(
    bucket: str | None = None,
    source_category: SourceCategory | None = None,
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
