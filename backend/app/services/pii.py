"""PII scanning for the validate path (#79 / legacy #17).

Prefers Microsoft Presidio when `presidio-analyzer` (and a spaCy model) are
available. Otherwise falls back to a built-in regex + Luhn detector covering
EMAIL_ADDRESS, CREDIT_CARD, and PHONE_NUMBER — the MVP minimum.

Install optional stack:
  cd backend && uv sync --extra pii
  uv run python -m spacy download en_core_web_sm
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Literal

from app.core.logging import logger

HIGH_RISK_ENTITIES = frozenset(
    {
        "EMAIL_ADDRESS",
        "CREDIT_CARD",
        "PHONE_NUMBER",
    }
)

BackendName = Literal["presidio", "regex"]

# Conservative patterns — synthetic fixtures in tests; not a full parser.
_EMAIL_RE = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
)
# 13-19 digits with optional separators (Visa/MC/Amex-shaped)
_CARD_RE = re.compile(
    r"(?<!\d)(?:\d[ -]*?){13,19}(?!\d)",
)
# US / E.164-ish phone forms used in code snippets
_PHONE_RE = re.compile(
    r"(?<!\w)(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}(?!\w)",
)


@dataclass(frozen=True, slots=True)
class PIIFinding:
    entity_type: str
    start: int
    end: int
    score: float
    backend: BackendName

    def as_dict(self) -> dict:
        return asdict(self)


def _luhn_ok(digits: str) -> bool:
    if not digits.isdigit() or not 13 <= len(digits) <= 19:
        return False
    total = 0
    reverse = digits[::-1]
    for i, ch in enumerate(reverse):
        n = int(ch)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


def _overlaps(a_start: int, a_end: int, b_start: int, b_end: int) -> bool:
    return a_start < b_end and b_start < a_end


def _scan_regex(text: str) -> list[PIIFinding]:
    findings: list[PIIFinding] = []

    for m in _EMAIL_RE.finditer(text):
        findings.append(
            PIIFinding(
                entity_type="EMAIL_ADDRESS",
                start=m.start(),
                end=m.end(),
                score=0.9,
                backend="regex",
            )
        )

    card_spans: list[tuple[int, int]] = []
    for m in _CARD_RE.finditer(text):
        digits = re.sub(r"\D", "", m.group(0))
        if _luhn_ok(digits):
            card_spans.append((m.start(), m.end()))
            findings.append(
                PIIFinding(
                    entity_type="CREDIT_CARD",
                    start=m.start(),
                    end=m.end(),
                    score=0.95,
                    backend="regex",
                )
            )

    for m in _PHONE_RE.finditer(text):
        digits = re.sub(r"\D", "", m.group(0))
        # Avoid mistaking short numbers / card digit runs for phones
        if not (10 <= len(digits) <= 15) or _luhn_ok(digits):
            continue
        if any(_overlaps(m.start(), m.end(), cs, ce) for cs, ce in card_spans):
            continue
        findings.append(
            PIIFinding(
                entity_type="PHONE_NUMBER",
                start=m.start(),
                end=m.end(),
                score=0.75,
                backend="regex",
            )
        )

    return _dedupe(findings)


def _dedupe(findings: list[PIIFinding]) -> list[PIIFinding]:
    seen: set[tuple[str, int, int]] = set()
    out: list[PIIFinding] = []
    for f in findings:
        key = (f.entity_type, f.start, f.end)
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    return out


def _try_presidio_engine():
    """Return AnalyzerEngine or None if Presidio/spaCy are unavailable."""
    try:
        from presidio_analyzer import AnalyzerEngine
    except ImportError:
        logger.info("presidio-analyzer not installed; using regex PII backend")
        return None

    try:
        # Prefer small model; AnalyzerEngine loads default NLP on init.
        engine = AnalyzerEngine()
        # Smoke: ensure analyze works (model present)
        engine.analyze(
            text="test@example.com", language="en", entities=["EMAIL_ADDRESS"]
        )
        return engine
    except Exception as exc:
        logger.warning(
            "Presidio unavailable (%s); using regex PII backend. "
            "Install with: uv sync --extra pii && "
            "uv run python -m spacy download en_core_web_sm",
            exc,
        )
        return None


class PIIScannerService:
    """Scan text for high-risk PII; Presidio when possible, else regex."""

    def __init__(self, *, prefer_presidio: bool = True) -> None:
        self._prefer_presidio = prefer_presidio
        self._presidio = _try_presidio_engine() if prefer_presidio else None

    @property
    def backend(self) -> BackendName:
        return "presidio" if self._presidio is not None else "regex"

    def scan(self, text: str) -> list[PIIFinding]:
        if not text or not text.strip():
            return []
        if self._presidio is not None:
            return self._scan_presidio(text)
        return _scan_regex(text)

    def has_high_risk_pii(self, text: str) -> bool:
        return any(f.entity_type in HIGH_RISK_ENTITIES for f in self.scan(text))

    def block_result(self, text: str) -> dict | None:
        """If high-risk PII is present, return a HIGH validation result dict."""
        findings = [f for f in self.scan(text) if f.entity_type in HIGH_RISK_ENTITIES]
        if not findings:
            return None
        types = sorted({f.entity_type for f in findings})
        return {
            "verdict": "HIGH",
            "reasoning": (
                "Blocked: high-risk PII detected in code_snippet "
                f"({', '.join(types)}). Remove or redact before resubmitting."
            ),
            "remediation": "Redact emails, payment cards, and phone numbers from the snippet.",
            "pii_findings": [f.as_dict() for f in findings],
            "pii_backend": self.backend,
        }

    def _scan_presidio(self, text: str) -> list[PIIFinding]:
        assert self._presidio is not None
        try:
            results = self._presidio.analyze(
                text=text,
                language="en",
                entities=list(HIGH_RISK_ENTITIES),
            )
        except Exception as exc:
            logger.warning("Presidio analyze failed (%s); falling back to regex", exc)
            return _scan_regex(text)

        findings = [
            PIIFinding(
                entity_type=r.entity_type,
                start=r.start,
                end=r.end,
                score=float(r.score),
                backend="presidio",
            )
            for r in results
            if r.entity_type in HIGH_RISK_ENTITIES
        ]
        # Pattern recognizers may miss some formats; union with regex for MVP DoD.
        return _dedupe(findings + _scan_regex(text))


pii_scanner = PIIScannerService()
