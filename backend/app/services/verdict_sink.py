"""Push structured verdict events to Loki or a local sink (#77).

When ``LOKI_URL`` is set, POSTs to Loki's push API.
When unset but ``VERDICT_SINK_PATH`` is set, appends JSONL to that file.
Otherwise returns ``noop`` (structured app logging still happens via
``emit_verdict_log``).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

import httpx

from app.core.config import settings
from app.core.logging import logger


class VerdictSinkError(Exception):
    """Configured sink rejected or failed to accept a verdict."""


class HttpPoster(Protocol):
    def post(
        self, url: str, *, content: bytes, headers: dict[str, str], timeout: float
    ) -> Any: ...


def _loki_push_url(base: str) -> str:
    base = base.rstrip("/")
    if base.endswith("/loki/api/v1/push"):
        return base
    return f"{base}/loki/api/v1/push"


def _loki_payload(event: dict[str, Any], *, job: str) -> dict[str, Any]:
    ts = event.get("timestamp")
    if isinstance(ts, str):
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            dt = datetime.now(UTC)
    else:
        dt = datetime.now(UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    ns = str(int(dt.timestamp() * 1_000_000_000))
    line = json.dumps(event, default=str, separators=(",", ":"))
    labels = {
        "job": job,
        "action": str(event.get("action") or "unknown"),
        "verdict": str(event.get("verdict") or "unknown"),
    }
    return {"streams": [{"stream": labels, "values": [[ns, line]]}]}


def push_to_loki(
    event: dict[str, Any],
    *,
    loki_url: str,
    job: str = "complyaigent",
    client: HttpPoster | None = None,
    timeout: float = 5.0,
) -> None:
    """POST a single verdict event to Grafana Loki. Raises VerdictSinkError on failure."""
    url = _loki_push_url(loki_url)
    body = json.dumps(_loki_payload(event, job=job)).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    if client is None:
        try:
            with httpx.Client(timeout=timeout) as http:
                resp = http.post(url, content=body, headers=headers)
        except httpx.HTTPError as exc:
            raise VerdictSinkError(f"Loki request failed: {exc}") from exc
    else:
        try:
            resp = client.post(url, content=body, headers=headers, timeout=timeout)
        except Exception as exc:  # noqa: BLE001 — mock or transport failure
            raise VerdictSinkError(f"Loki request failed: {exc}") from exc

    status = getattr(resp, "status_code", None)
    if status is None or status >= 400:
        text = getattr(resp, "text", "") or getattr(resp, "content", b"")
        raise VerdictSinkError(f"Loki push rejected status={status}: {text}")


def append_verdict_file(event: dict[str, Any], path: str | Path) -> None:
    """Append one JSON line to a durable local sink file."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event, default=str) + "\n")


def push_verdict(
    event: dict[str, Any],
    *,
    loki_url: str | None = None,
    sink_path: str | None = None,
    job: str | None = None,
    client: HttpPoster | None = None,
) -> str:
    """
    Ship ``event`` to the configured sink.

    Returns ``\"loki\"``, ``\"file\"``, or ``\"noop\"``.
    Raises ``VerdictSinkError`` when a configured remote/file sink fails.
    """
    url = (loki_url if loki_url is not None else settings.LOKI_URL or "").strip()
    path = (
        sink_path if sink_path is not None else settings.VERDICT_SINK_PATH or ""
    ).strip()
    job_label = (job if job is not None else settings.LOKI_JOB) or "complyaigent"

    if url:
        push_to_loki(event, loki_url=url, job=job_label, client=client)
        return "loki"
    if path:
        try:
            append_verdict_file(event, path)
        except OSError as exc:
            raise VerdictSinkError(f"File sink failed: {exc}") from exc
        return "file"
    return "noop"


def safe_push_verdict(event: dict[str, Any], **kwargs: Any) -> str:
    """Like ``push_verdict`` but logs and returns ``\"error\"`` instead of raising."""
    try:
        return push_verdict(event, **kwargs)
    except VerdictSinkError as exc:
        logger.warning("verdict sink push failed: %s", exc)
        return "error"
