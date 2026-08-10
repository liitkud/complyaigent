"""Canonical structured verdict event schema (#76) + sink push (#77)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.logging import logger
from app.services.verdict_sink import safe_push_verdict

REQUIRED_VERDICT_KEYS = (
    "action",
    "verdict",
    "repo",
    "timestamp",
    "policy_id",
    "policyId",
    "validation_id",
    "rule_id",
)


def build_verdict_event(
    *,
    action: str,
    verdict: str,
    repo: str | None = None,
    policy_id: str | None = None,
    validation_id: str | None = None,
    rule_id: str | None = None,
    timestamp: datetime | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a JSON-serializable verdict event with required keys."""
    ts = timestamp or datetime.now(UTC)
    pid = policy_id
    event: dict[str, Any] = {
        "action": action,
        "verdict": verdict,
        "repo": repo or "",
        "timestamp": ts.isoformat(),
        "policy_id": pid,
        "policyId": pid,
        "validation_id": validation_id,
        "rule_id": rule_id,
    }
    if extra:
        event.update(extra)
    return event


def emit_verdict_log(event: dict[str, Any]) -> None:
    """Emit structured verdict to app logger and configured sink (Loki/file/noop)."""
    missing = [k for k in ("action", "verdict", "timestamp", "validation_id") if k not in event]
    if missing:
        logger.warning("verdict_event missing keys: %s", missing)
    logger.info("verdict_event %s", event)
    sink = safe_push_verdict(event)
    if sink != "noop":
        logger.debug("verdict_event sunk via %s", sink)
