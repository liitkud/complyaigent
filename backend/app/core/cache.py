import threading
import time
from typing import Any


class TTLCache:
    """Thread-safe in-memory cache with time-to-live (TTL) expiration."""

    def __init__(self, default_ttl: float = 60.0, maxsize: int = 2048):
        self.default_ttl = default_ttl
        self.maxsize = maxsize
        self._cache: dict[Any, tuple[Any, float]] = {}
        self._lock = threading.RLock()

    def get(self, key: Any) -> Any | None:
        """Retrieve value if exists and not expired, else None."""
        now = time.monotonic()
        with self._lock:
            item = self._cache.get(key)
            if item is None:
                return None
            val, expiry = item
            if now > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: Any, value: Any, ttl: float | None = None) -> None:
        """Store value with specified or default TTL."""
        now = time.monotonic()
        ttl_val = ttl if ttl is not None else self.default_ttl
        with self._lock:
            if len(self._cache) >= self.maxsize:
                # Evict expired items first
                expired = [k for k, (_, exp) in self._cache.items() if now > exp]
                for k in expired:
                    del self._cache[k]
                # If still full, evict the oldest inserted key
                if len(self._cache) >= self.maxsize:
                    self._cache.pop(next(iter(self._cache)))
            self._cache[key] = (value, now + ttl_val)

    def delete(self, key: Any) -> bool:
        """Delete specific key from cache."""
        with self._lock:
            return self._cache.pop(key, None) is not None

    def invalidate_prefix(self, prefix: Any) -> None:
        """Invalidate all keys matching the given prefix."""
        with self._lock:
            keys_to_delete = [
                k
                for k in self._cache.keys()
                if (isinstance(k, tuple) and k and k[0] == prefix)
                or (isinstance(k, str) and k.startswith(str(prefix)))
            ]
            for k in keys_to_delete:
                del self._cache[k]

    def clear(self) -> None:
        """Clear all entries from the cache."""
        with self._lock:
            self._cache.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._cache)


# Global cache instance for manifest and rules serialization
manifest_cache = TTLCache(default_ttl=60.0, maxsize=2048)


def get_manifest_cache() -> TTLCache:
    return manifest_cache


def clear_manifest_cache() -> None:
    manifest_cache.clear()
