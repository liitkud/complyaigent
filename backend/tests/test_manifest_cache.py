import time

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.cache import TTLCache, clear_manifest_cache, manifest_cache
from app.models.rule import (
    GovernanceRule,
    ImpactRadius,
    RiskLevel,
    RuleType,
    SourceCategory,
)
from app.models.task import IngestionTask


def test_ttl_cache_basic_ops():
    cache = TTLCache(default_ttl=1.0, maxsize=5)
    cache.set("key1", "val1")
    assert cache.get("key1") == "val1"
    assert cache.get("nonexistent") is None

    # Test deletion
    assert cache.delete("key1") is True
    assert cache.get("key1") is None
    assert cache.delete("key1") is False


def test_ttl_cache_expiration():
    cache = TTLCache(default_ttl=0.1)
    cache.set("expire_soon", "value", ttl=0.05)
    assert cache.get("expire_soon") == "value"
    time.sleep(0.06)
    assert cache.get("expire_soon") is None


def test_ttl_cache_eviction():
    cache = TTLCache(default_ttl=10.0, maxsize=3)
    cache.set("k1", "v1")
    cache.set("k2", "v2")
    cache.set("k3", "v3")
    assert len(cache) == 3
    # Exceed capacity
    cache.set("k4", "v4")
    assert len(cache) == 3
    assert cache.get("k4") == "v4"


def test_manifest_cache_hits_and_invalidation(client: TestClient, session: Session):
    clear_manifest_cache()

    task = IngestionTask(
        source_hash="cache-test-hash",
        source_name="caching-policy.md",
        version_number=1,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    rule = GovernanceRule(
        task_id=task.id,
        type=RuleType.A1_SCANNABLE,
        impact_radius=ImpactRadius.CODE_BASE,
        risk_level=RiskLevel.LOW,
        source_category=SourceCategory.ORG_CONSTITUTION,
        content="Cache test rule content",
        rule_metadata={"pattern": "cache_check", "logic": "must pass"},
    )
    session.add(rule)
    session.commit()

    # 1. First GET /regulation/{id} fills cache
    res1 = client.get(f"/regulation/{task.id}")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["meta"]["source_name"] == "caching-policy.md"
    assert len(data1["buckets"]["A1"]) == 1
    assert data1["buckets"]["A1"][0]["pattern"] == "cache_check"

    # Verify item is in cache
    assert manifest_cache.get(("manifest", str(task.id))) is not None

    # Mutate DB directly without clearing cache to verify response comes from cache
    rule.content = "Mutated but cached"
    session.add(rule)
    session.commit()

    res2 = client.get(f"/regulation/{task.id}")
    assert res2.status_code == 200
    # Should still match the cached original rule
    assert res2.json()["buckets"]["A1"][0]["content"] == "Cache test rule content"

    # Clear cache and verify updated DB content is returned
    clear_manifest_cache()
    res3 = client.get(f"/regulation/{task.id}")
    assert res3.status_code == 200
    assert res3.json()["buckets"]["A1"][0]["content"] == "Mutated but cached"


def test_reg_and_corp_endpoints_caching(client: TestClient, session: Session):
    clear_manifest_cache()

    task = IngestionTask(source_hash="hash-corp", source_name="corp-policy.md")
    session.add(task)
    session.commit()
    session.refresh(task)

    rule = GovernanceRule(
        task_id=task.id,
        type=RuleType.A1_SCANNABLE,
        impact_radius=ImpactRadius.CODE_BASE,
        risk_level=RiskLevel.LOW,
        source_category=SourceCategory.ORG_CONSTITUTION,
        content="Corp rule 1",
    )
    session.add(rule)
    session.commit()

    # Hit /corp
    corp_res1 = client.get("/corp")
    assert corp_res1.status_code == 200
    assert len(corp_res1.json()["buckets"]["A1"]) == 1

    # Verify cached
    cached_corp = manifest_cache.get(("reg", None, "org_constitution"))
    assert cached_corp is not None

    # Hit /reg
    reg_res1 = client.get("/reg")
    assert reg_res1.status_code == 200
    assert manifest_cache.get(("reg", None, None)) is not None

    # Hit /reg with bucket filter
    reg_bucket_res = client.get("/reg?bucket=A1")
    assert reg_bucket_res.status_code == 200
    assert manifest_cache.get(("reg", "A1", None)) is not None


def test_regulation_list_caching(client: TestClient, session: Session):
    clear_manifest_cache()

    task1 = IngestionTask(source_hash="h1", source_name="p1.md")
    task2 = IngestionTask(source_hash="h2", source_name="p2.md")
    session.add(task1)
    session.add(task2)
    session.commit()

    list_res = client.get("/regulation")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 2
    assert manifest_cache.get(("regulation_list",)) is not None
