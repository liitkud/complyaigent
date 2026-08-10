"""Unit tests for PIIScannerService (#79)."""

from tests.fixtures.pii_snippets import (
    CARD_SNIPPET,
    CLEAN_SNIPPET,
    EMAIL_SNIPPET,
    MIXED_SNIPPET,
    PHONE_SNIPPET,
)


def test_pii_module_exports_scanner():
    from app.services.pii import PIIScannerService, pii_scanner

    assert callable(PIIScannerService)
    assert hasattr(pii_scanner, "scan")
    assert hasattr(pii_scanner, "has_high_risk_pii")


def test_clean_snippet_has_no_high_risk_pii():
    from app.services.pii import pii_scanner

    findings = pii_scanner.scan(CLEAN_SNIPPET)
    assert findings == []
    assert pii_scanner.has_high_risk_pii(CLEAN_SNIPPET) is False


def test_detects_email():
    from app.services.pii import pii_scanner

    findings = pii_scanner.scan(EMAIL_SNIPPET)
    types = {f.entity_type for f in findings}
    assert "EMAIL_ADDRESS" in types
    assert pii_scanner.has_high_risk_pii(EMAIL_SNIPPET) is True


def test_detects_credit_card():
    from app.services.pii import pii_scanner

    findings = pii_scanner.scan(CARD_SNIPPET)
    types = {f.entity_type for f in findings}
    assert "CREDIT_CARD" in types
    assert pii_scanner.has_high_risk_pii(CARD_SNIPPET) is True


def test_detects_phone():
    from app.services.pii import pii_scanner

    findings = pii_scanner.scan(PHONE_SNIPPET)
    types = {f.entity_type for f in findings}
    assert "PHONE_NUMBER" in types
    assert pii_scanner.has_high_risk_pii(PHONE_SNIPPET) is True


def test_mixed_snippet_reports_multiple_types():
    from app.services.pii import pii_scanner

    findings = pii_scanner.scan(MIXED_SNIPPET)
    types = {f.entity_type for f in findings}
    assert "EMAIL_ADDRESS" in types
    assert "CREDIT_CARD" in types
    assert "PHONE_NUMBER" in types


def test_findings_do_not_echo_raw_secrets():
    """Findings expose type/span/score only — not the matched value."""
    from app.services.pii import pii_scanner

    findings = pii_scanner.scan(EMAIL_SNIPPET)
    assert findings
    for f in findings:
        dumped = f.as_dict()
        assert "alice.demo@example.com" not in str(dumped)
        assert "value" not in dumped
        assert dumped["entity_type"]
        assert isinstance(dumped["start"], int)
        assert isinstance(dumped["end"], int)


def test_regex_backend_always_available():
    from app.services.pii import PIIScannerService

    scanner = PIIScannerService(prefer_presidio=False)
    assert scanner.backend == "regex"
    assert scanner.has_high_risk_pii(EMAIL_SNIPPET) is True
