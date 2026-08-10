"""A1 regex validation gate (#80) — compile, test_pass/fail, ReDoS smoke.

LLM-generated A1 patterns must not be stored as servable or returned on
`/reg` until they pass this guard. Outcomes:

- ``ok`` — compile + self-tests + ReDoS smoke pass; safe to serve
- ``rejected`` — invalid / fails self-tests; demote away from A1
- ``quarantined`` — compiles but looks catastrophic (static or timed);
  may be stored for audit but must not be served to the CLI
"""

from __future__ import annotations

import multiprocessing as mp
import re
from dataclasses import asdict, dataclass
from typing import Any, Literal

from app.core.logging import logger

Status = Literal["ok", "rejected", "quarantined"]

# Nested / overlapping quantifiers that commonly trigger catastrophic
# backtracking in Python's `re` engine (e.g. (a+)+, (a|aa)+).
_NESTED_QUANT = re.compile(
    r"(?:\([^()]*[+*][^()]*\)|\([^()]*\)[+*])[+*{]",
)
_OVERLAPPING_ALT = re.compile(
    r"\((?:[^()]*\|){1,}[^()]*\)[+*{]",
)

# Adversarial payloads sized to trip nested quantifiers quickly without
# hanging a healthy pattern. Process spawn needs headroom over match time.
_SMOKE_PAYLOADS = (
    "a" * 30 + "!",
    "ab" * 24 + "!",
)
_SMOKE_TIMEOUT_S = 2.0


@dataclass(frozen=True, slots=True)
class A1ValidationResult:
    status: Status
    reason: str

    def as_dict(self) -> dict[str, str]:
        return asdict(self)

    @property
    def ok(self) -> bool:
        return self.status == "ok"

    @property
    def serveable(self) -> bool:
        return self.status == "ok"


def _looks_catastrophic(pattern: str) -> str | None:
    """Static heuristic for known ReDoS shapes. Returns reason or None."""
    if _NESTED_QUANT.search(pattern):
        return "nested_quantifier"
    if _OVERLAPPING_ALT.search(pattern) and any(ch in pattern for ch in "*+{"):
        # Quantified group that contains alternation — often overlapping.
        if re.search(r"\([^)]*\|[^)]*\)[+*{]", pattern):
            return "quantified_alternation"
    return None


def _match_worker(pattern: str, text: str, queue: mp.Queue) -> None:
    try:
        compiled = re.compile(pattern)
        queue.put(bool(compiled.search(text)))
    except re.error as exc:
        queue.put(f"error:{exc}")
    except Exception as exc:  # pragma: no cover - defensive
        queue.put(f"error:{exc}")


def _timed_search(pattern: str, text: str, timeout: float = _SMOKE_TIMEOUT_S) -> bool:
    """Run ``re.search`` in a child process; treat timeout as ReDoS."""
    try:
        ctx = mp.get_context("fork")
    except ValueError:  # pragma: no cover - platforms without fork
        ctx = mp.get_context("spawn")

    queue: mp.Queue = ctx.Queue(maxsize=1)
    proc = ctx.Process(target=_match_worker, args=(pattern, text, queue))
    proc.daemon = True
    proc.start()
    proc.join(timeout)
    if proc.is_alive():
        proc.terminate()
        proc.join(1.0)
        if proc.is_alive():  # pragma: no cover
            proc.kill()
            proc.join(1.0)
        raise TimeoutError("regex smoke timed out")
    if queue.empty():
        raise TimeoutError("regex smoke produced no result")
    result = queue.get()
    if isinstance(result, str) and result.startswith("error:"):
        raise re.error(result[len("error:") :])
    return bool(result)


def _smoke_redos(pattern: str) -> str | None:
    for payload in _SMOKE_PAYLOADS:
        try:
            _timed_search(pattern, payload)
        except TimeoutError:
            return "smoke_timeout"
        except re.error as exc:
            return f"compile_error:{exc}"
    return None


def validate_a1_regex(
    pattern: str | None,
    test_pass: str | None = None,
    test_fail: str | None = None,
    *,
    run_smoke: bool = True,
) -> A1ValidationResult:
    """Validate one A1 regex + optional self-tests for serve safety."""
    if pattern is None or not str(pattern).strip():
        return A1ValidationResult("rejected", "missing_regex")

    pattern = str(pattern)
    try:
        compiled = re.compile(pattern)
    except re.error as exc:
        return A1ValidationResult("rejected", f"compile_error:{exc}")

    if test_pass is not None:
        if not compiled.search(str(test_pass)):
            return A1ValidationResult("rejected", "test_pass_mismatch")

    if test_fail is not None:
        if compiled.search(str(test_fail)):
            return A1ValidationResult("rejected", "test_fail_matched")

    static_reason = _looks_catastrophic(pattern)
    if static_reason:
        return A1ValidationResult("quarantined", static_reason)

    if run_smoke:
        smoke_reason = _smoke_redos(pattern)
        if smoke_reason:
            return A1ValidationResult("quarantined", smoke_reason)

    return A1ValidationResult("ok", "passed")


def validate_a1_metadata(metadata: dict[str, Any] | None) -> A1ValidationResult:
    meta = metadata or {}
    return validate_a1_regex(
        meta.get("regex") or meta.get("pattern"),
        meta.get("test_pass"),
        meta.get("test_fail"),
    )


def apply_a1_guard_to_rule(rule: dict[str, Any]) -> dict[str, Any]:
    """Mutate a categorizer rule dict: stamp validation; demote rejects."""
    rule_type = rule.get("type")
    if rule_type != "A1_SCANNABLE":
        return rule

    meta = rule.get("metadata")
    if not isinstance(meta, dict):
        meta = {}
        rule["metadata"] = meta

    result = validate_a1_metadata(meta)
    meta["a1_validation"] = result.as_dict()

    if result.status == "rejected":
        logger.warning(
            "A1 regex rejected (%s); demoting to C_SEMANTIC_GUIDANCE",
            result.reason,
        )
        rule["type"] = "C_SEMANTIC_GUIDANCE"
        meta["a1_original_type"] = "A1_SCANNABLE"
    elif result.status == "quarantined":
        logger.warning(
            "A1 regex quarantined (%s); will not be served to CLI",
            result.reason,
        )

    return rule


def is_a1_serveable(rule_type: Any, metadata: dict[str, Any] | None) -> bool:
    """True only when an A1 rule is cleared for `/reg` / CLI fetch."""
    type_val = rule_type.value if hasattr(rule_type, "value") else str(rule_type)
    if type_val != "A1_SCANNABLE":
        return True

    meta = metadata or {}
    cached = meta.get("a1_validation")
    if isinstance(cached, dict) and "status" in cached:
        return cached.get("status") == "ok"

    # Legacy rows without a stamp: validate now (fail closed).
    return validate_a1_metadata(meta).serveable
