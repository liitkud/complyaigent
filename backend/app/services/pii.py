import re
from dataclasses import dataclass


@dataclass(frozen=True)
class PIIFinding:
    entity_type: str
    count: int


EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
CARD_PATTERN = re.compile(r"(?<!\d)(?:\d[ -]?){13,19}(?!\d)")
PHONE_PATTERN = re.compile(
    r"(?<!\w)(?:\+\d{1,3}[ .-]?)?(?:\(\d{2,4}\)|\d{3})[ .-]\d{3,4}[ .-]\d{4}(?!\w)"
)


def _is_luhn_valid(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    if not 13 <= len(digits) <= 19:
        return False

    checksum = 0
    for index, digit in enumerate(reversed(digits)):
        number = int(digit)
        if index % 2 == 1:
            number *= 2
            if number > 9:
                number -= 9
        checksum += number
    return checksum % 10 == 0


def detect_pii(text: str) -> list[PIIFinding]:
    """Return deterministic, non-sensitive PII findings for validation input."""
    findings: list[PIIFinding] = []

    email_count = len(EMAIL_PATTERN.findall(text))
    if email_count:
        findings.append(PIIFinding("email", email_count))

    card_count = sum(
        _is_luhn_valid(match.group()) for match in CARD_PATTERN.finditer(text)
    )
    if card_count:
        findings.append(PIIFinding("card", card_count))

    phone_count = len(PHONE_PATTERN.findall(text))
    if phone_count:
        findings.append(PIIFinding("phone", phone_count))

    return findings
