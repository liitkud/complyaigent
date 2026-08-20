import asyncio
import statistics
import time
from uuid import uuid4

import httpx
import pytest
from sqlmodel import Session, SQLModel

from app.core import db as db_module
from app.core.cache import clear_manifest_cache
from app.models.rule import GovernanceRule, RuleType, SourceCategory
from app.models.task import IngestionTask
from main import app

SLA_MAX_SECONDS = 5.0
CONCURRENT_REQUESTS = 50


def compute_latency_stats(latencies: list[float], total_duration: float) -> dict:
    """Compute latency percentiles, throughput, and summary statistics."""
    sorted_latencies = sorted(latencies)
    n = len(sorted_latencies)

    def percentile(p: float) -> float:
        idx = int(p * n)
        return sorted_latencies[min(idx, n - 1)]

    return {
        "count": n,
        "total_seconds": total_duration,
        "rps": n / total_duration if total_duration > 0 else 0.0,
        "min_s": min(sorted_latencies),
        "max_s": max(sorted_latencies),
        "mean_s": statistics.mean(sorted_latencies),
        "p50_s": percentile(0.50),
        "p90_s": percentile(0.90),
        "p95_s": percentile(0.95),
        "p99_s": percentile(0.99),
    }


@pytest.fixture
def load_test_data():
    """Seed test data in the database for load tests."""
    clear_manifest_cache()
    SQLModel.metadata.create_all(db_module.engine)

    task_id = uuid4()
    rule_id = uuid4()

    with Session(db_module.engine) as session:
        task = IngestionTask(
            id=task_id,
            source_hash="load-test-hash-5s",
            source_name="Load Test Policy SLA",
            version_number=1,
        )
        rule = GovernanceRule(
            id=rule_id,
            task_id=task_id,
            type=RuleType.A1_SCANNABLE,
            source_category=SourceCategory.ORG_CONSTITUTION,
            content="Load testing governance rule: ensure secure configurations.",
            rule_metadata={
                "pattern": r"secret_token\s*=",
                "logic": "regex_match",
                "test_pass": "secret_token = '123'",
                "test_fail": "safe_token = '123'",
            },
        )
        session.add(task)
        session.add(rule)
        session.commit()

    yield {
        "task_id": str(task_id),
        "rule_id": str(rule_id),
    }

    SQLModel.metadata.drop_all(db_module.engine)
    clear_manifest_cache()


@pytest.mark.anyio
async def test_50_concurrent_validate_queries_within_5s_sla(load_test_data):
    """Assert that 50 concurrent /validate requests complete well within 5.0 seconds SLA."""
    rule_id = load_test_data["rule_id"]

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        async def run_single_validate(i: int) -> tuple[int, dict, float]:
            payload = {
                "code_snippet": f"def load_benchmark_{i}():\n    return 'payload_{i}'",
                "rule_id": rule_id,
                "context": f"benchmark_batch_{i}",
            }
            req_start = time.perf_counter()
            response = await client.post("/validate", json=payload)
            latency = time.perf_counter() - req_start
            return response.status_code, response.json(), latency

        start_time = time.perf_counter()
        results = await asyncio.gather(
            *(run_single_validate(i) for i in range(CONCURRENT_REQUESTS))
        )
        total_duration = time.perf_counter() - start_time

    latencies = [res[2] for res in results]
    stats = compute_latency_stats(latencies, total_duration)

    for status_code, body, _ in results:
        assert status_code == 202
        assert "validation_id" in body
        assert body["status"] in ("complete", "pending")

    assert stats["count"] == CONCURRENT_REQUESTS
    assert total_duration < SLA_MAX_SECONDS, (
        f"Validate 50 concurrent batch took {total_duration:.3f}s, exceeding {SLA_MAX_SECONDS}s SLA"
    )
    assert stats["p95_s"] < SLA_MAX_SECONDS, (
        f"Validate P95 latency {stats['p95_s']:.3f}s exceeded {SLA_MAX_SECONDS}s SLA"
    )


@pytest.mark.anyio
async def test_50_concurrent_reg_queries_within_5s_sla(load_test_data):
    """Assert that 50 concurrent /reg requests complete well within 5.0 seconds SLA."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        async def run_single_reg(i: int) -> tuple[int, dict, float]:
            bucket_choices = ["A1", "A2", "B", "C", None]
            bucket = bucket_choices[i % len(bucket_choices)]
            url = f"/reg?bucket={bucket}" if bucket else "/reg"

            req_start = time.perf_counter()
            response = await client.get(url)
            latency = time.perf_counter() - req_start
            return response.status_code, response.json(), latency

        start_time = time.perf_counter()
        results = await asyncio.gather(
            *(run_single_reg(i) for i in range(CONCURRENT_REQUESTS))
        )
        total_duration = time.perf_counter() - start_time

    latencies = [res[2] for res in results]
    stats = compute_latency_stats(latencies, total_duration)

    for status_code, body, _ in results:
        assert status_code == 200
        assert "buckets" in body

    assert stats["count"] == CONCURRENT_REQUESTS
    assert total_duration < SLA_MAX_SECONDS, (
        f"Reg 50 concurrent batch took {total_duration:.3f}s, exceeding {SLA_MAX_SECONDS}s SLA"
    )
    assert stats["p95_s"] < SLA_MAX_SECONDS, (
        f"Reg P95 latency {stats['p95_s']:.3f}s exceeded {SLA_MAX_SECONDS}s SLA"
    )


@pytest.mark.anyio
async def test_50_concurrent_mixed_validate_and_reg_queries_within_5s_sla(
    load_test_data,
):
    """Assert that 50 concurrent mixed /validate and /reg requests complete well within 5.0 seconds SLA."""
    rule_id = load_test_data["rule_id"]

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        async def run_validate(i: int) -> tuple[int, dict, float]:
            payload = {
                "code_snippet": f"item_{i} = calculate_metric({i})",
                "rule_id": rule_id,
            }
            req_start = time.perf_counter()
            response = await client.post("/validate", json=payload)
            latency = time.perf_counter() - req_start
            return response.status_code, response.json(), latency

        async def run_reg(i: int) -> tuple[int, dict, float]:
            req_start = time.perf_counter()
            response = await client.get("/reg")
            latency = time.perf_counter() - req_start
            return response.status_code, response.json(), latency

        tasks = []
        for i in range(CONCURRENT_REQUESTS):
            if i % 2 == 0:
                tasks.append(run_validate(i))
            else:
                tasks.append(run_reg(i))

        start_time = time.perf_counter()
        results = await asyncio.gather(*tasks)
        total_duration = time.perf_counter() - start_time

    latencies = [res[2] for res in results]
    stats = compute_latency_stats(latencies, total_duration)

    for i, (status_code, body, _) in enumerate(results):
        if i % 2 == 0:
            assert status_code == 202
            assert "validation_id" in body
        else:
            assert status_code == 200
            assert "buckets" in body

    assert stats["count"] == CONCURRENT_REQUESTS
    assert total_duration < SLA_MAX_SECONDS, (
        f"Mixed 50 concurrent batch took {total_duration:.3f}s, exceeding {SLA_MAX_SECONDS}s SLA"
    )
    assert stats["p95_s"] < SLA_MAX_SECONDS, (
        f"Mixed P95 latency {stats['p95_s']:.3f}s exceeded {SLA_MAX_SECONDS}s SLA"
    )
