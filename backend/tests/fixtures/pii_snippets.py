"""PII snippet fixtures for #79 (email / card / phone)."""

# Safe control — no high-risk PII
CLEAN_SNIPPET = """
def greet(name: str) -> str:
    return f"hello {name}"
"""

# Synthetic test data only — not real people or cards
EMAIL_SNIPPET = """
user_email = "alice.demo@example.com"
notify(user_email)
"""

# Visa test number (passes Luhn); spaces as often pasted from docs
CARD_SNIPPET = """
payment = {
    "card": "4111 1111 1111 1111",
    "exp": "12/30",
}
"""

PHONE_SNIPPET = """
contact_phone = "+1-415-555-0132"
call(contact_phone)
"""

MIXED_SNIPPET = """
# onboarding dump
email: bob.demo@example.org
cc: 5500-0000-0000-0004
mobile: (415) 555-0199
"""
