from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, col, select

from ..core.db import get_session
from ..models.rule import GovernanceRule, SourceCategory
from ..models.task import IngestionTask
from ..services.a1_regex_guard import is_a1_serveable

router = APIRouter()


def _serveable_rule(rule: GovernanceRule) -> bool:
    """Drop quarantined / unvalidated A1 patterns before CLI fetch (#80)."""
    return is_a1_serveable(rule.type, rule.rule_metadata)


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
        # Try to find rule category for source_type
        first_rule = session.exec(
            select(GovernanceRule).where(GovernanceRule.task_id == task.id)
        ).first()

        results.append(
            {
                "id": str(task.id),
                "source_name": f"Regulation {str(task.id)[:8]}",
                "source_type": first_rule.source_category
                if first_rule
                else "org_guideline",
                "ingested_at": task.created_at.isoformat(),
                "version": task.source_hash[:7],
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
                if not _serveable_rule(rule):
                    raise HTTPException(
                        status_code=404, detail="Manifest or Rule not found"
                    )
                return rule
        except HTTPException:
            raise
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

    served = 0
    for rule in rules:
        if not _serveable_rule(rule):
            continue
        b_key = bucket_map.get(rule.type)
        if b_key:
            buckets[b_key].append(rule)
            served += 1

    return {
        "meta": {
            "source_uuid": str(task.id),
            "source_name": f"Regulation {str(task.id)[:8]}",
            "source_type": rules[0].source_category if rules else "org_guideline",
            "ingested_at": task.created_at.isoformat(),
            "version": task.source_hash[:7],
            "total_rules": served,
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
        if not _serveable_rule(rule):
            continue
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
