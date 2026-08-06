import hashlib


def calculate_sha256(content: bytes) -> str:
    """
    Calculate SHA-256 hash for idempotency checks.
    """
    return hashlib.sha256(content).hexdigest()
