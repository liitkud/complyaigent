import re
import threading
from collections.abc import Awaitable, Callable
from typing import Any

import fitz  # PyMuPDF

from ..core.cache import TTLCache
from ..core.hashing import calculate_sha256
from ..core.logging import logger


class EmptyDocumentError(ValueError):
    """Raised when a supported document contains no extractable text."""


def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from PDF using PyMuPDF."""
    try:
        with fitz.open(file_path) as doc:
            text = "\n".join(page.get_text("text", sort=True) for page in doc)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e!s}")
        raise

    if not text.strip():
        raise EmptyDocumentError(
            "PDF contains no extractable text; image-only PDFs are not supported"
        )
    return text


def extract_text_from_markdown(file_path: str) -> str:
    """Read text from Markdown file."""
    with open(file_path, encoding="utf-8") as f:
        return f.read()


def clean_text(text: str) -> str:
    """Strip non-printable characters and normalize whitespace."""
    # Simple normalization for backward compatibility
    return " ".join(text.split())


# Regex patterns for prompt compaction
_PAGE_NUM_PATTERN = re.compile(
    r"^(?:page\s+\d+(\s+of\s+\d+)?|\d+\s*/\s*\d+|[-=_*~]{3,})$", re.IGNORECASE
)
_DECORATIVE_SEPARATOR_PATTERN = re.compile(r"^[-=*_#\s]{4,}$")
_EMPTY_BULLET_PATTERN = re.compile(r"^[-*•]\s*$")
_CONSECUTIVE_SPACES_PATTERN = re.compile(r"[ \t]+")
_CONSECUTIVE_NEWLINES_PATTERN = re.compile(r"\n{3,}")


def estimate_token_count(text: str) -> int:
    """Fast conservative heuristic approximation of token count (~4 chars per token)."""
    if not text:
        return 0
    # Average ~4 characters per token in English text/code
    return max(1, (len(text) + 3) // 4)


def compact_prompt_tokens(
    text: str,
    max_tokens: int | None = None,
    max_chars: int | None = None,
    preserve_newlines: bool = True,
) -> str:
    """
    Compact extracted document text to optimize LLM prompt token usage.
    - Strips standalone page numbers, redundant dividers, empty list markers.
    - Compresses excessive spaces and redundant blank lines.
    - Optionally truncates to a token/character budget cleanly at line/word boundaries.
    """
    if not text:
        return ""

    lines = text.splitlines()
    filtered_lines: list[str] = []

    for line in lines:
        cleaned_line = _CONSECUTIVE_SPACES_PATTERN.sub(" ", line).strip()
        if not cleaned_line:
            # Preserve a single blank line if last wasn't blank
            if preserve_newlines and filtered_lines and filtered_lines[-1] != "":
                filtered_lines.append("")
            continue

        # Skip document artifact noise (standalone page numbers, decorative lines, empty bullets)
        if _PAGE_NUM_PATTERN.match(cleaned_line):
            continue
        if _DECORATIVE_SEPARATOR_PATTERN.match(cleaned_line):
            continue
        if _EMPTY_BULLET_PATTERN.match(cleaned_line):
            continue

        filtered_lines.append(cleaned_line)

    if preserve_newlines:
        compacted = "\n".join(filtered_lines).strip()
        compacted = _CONSECUTIVE_NEWLINES_PATTERN.sub("\n\n", compacted)
    else:
        compacted = " ".join(line for line in filtered_lines if line).strip()

    # Enforce character budget if specified
    if max_chars is not None and len(compacted) > max_chars:
        if max_chars <= 3:
            compacted = compacted[:max_chars]
        else:
            # Truncate at last space if possible
            truncated = compacted[: max_chars - 3]
            last_space = truncated.rfind(" ")
            if last_space > max_chars // 2:
                compacted = truncated[:last_space] + "..."
            else:
                compacted = truncated + "..."

    # Enforce token budget if specified
    if max_tokens is not None:
        approx_chars = max_tokens * 4
        if len(compacted) > approx_chars:
            if approx_chars <= 3:
                compacted = compacted[:approx_chars]
            else:
                truncated = compacted[: approx_chars - 3]
                last_space = truncated.rfind(" ")
                if last_space > approx_chars // 2:
                    compacted = truncated[:last_space] + "..."
                else:
                    compacted = truncated + "..."

    return compacted


def compact_text_for_prompt(
    text: str,
    max_tokens: int | None = None,
    max_chars: int | None = None,
) -> str:
    """Convenience alias for compact_prompt_tokens."""
    return compact_prompt_tokens(
        text, max_tokens=max_tokens, max_chars=max_chars, preserve_newlines=True
    )


class BatchEmbeddingCache:
    """
    Thread-safe cache for batch embedding calculations to avoid redundant API calls.
    Keys are hashed deterministically per (model_name, text_content).
    """

    def __init__(
        self,
        default_ttl: float = 3600.0,
        maxsize: int = 4096,
        cache: TTLCache | None = None,
    ):
        self.default_ttl = default_ttl
        self.maxsize = maxsize
        self._cache = cache if cache is not None else TTLCache(default_ttl=default_ttl, maxsize=maxsize)
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def _make_key(self, text: str, model_name: str = "default") -> str:
        content_hash = calculate_sha256(text.strip().encode("utf-8"))
        return f"emb:{model_name}:{content_hash}"

    def get(self, text: str, model_name: str = "default") -> list[float] | None:
        """Get cached embedding vector for a single text."""
        key = self._make_key(text, model_name)
        val = self._cache.get(key)
        with self._lock:
            if val is not None:
                self._hits += 1
            else:
                self._misses += 1
        return val

    def set(
        self,
        text: str,
        embedding: list[float],
        model_name: str = "default",
        ttl: float | None = None,
    ) -> None:
        """Store embedding vector in cache."""
        key = self._make_key(text, model_name)
        self._cache.set(key, embedding, ttl=ttl or self.default_ttl)

    def get_or_compute_batch(
        self,
        texts: list[str],
        embed_fn: Callable[[list[str]], list[list[float]]],
        model_name: str = "default",
        ttl: float | None = None,
    ) -> list[list[float]]:
        """
        Batch embed texts with caching.
        Only uncached unique texts are passed to embed_fn.
        Preserves the exact ordering of the input texts.
        """
        if not texts:
            return []

        results: list[list[float] | None] = [None] * len(texts)
        uncached_indices: dict[str, list[int]] = {}

        for idx, text in enumerate(texts):
            key = self._make_key(text, model_name)
            cached_val = self._cache.get(key)
            if cached_val is not None:
                results[idx] = cached_val
                with self._lock:
                    self._hits += 1
            else:
                with self._lock:
                    self._misses += 1
                if text not in uncached_indices:
                    uncached_indices[text] = []
                uncached_indices[text].append(idx)

        if uncached_indices:
            unique_texts = list(uncached_indices.keys())
            computed_embeddings = embed_fn(unique_texts)
            if len(computed_embeddings) != len(unique_texts):
                raise ValueError(
                    f"embed_fn returned {len(computed_embeddings)} embeddings for {len(unique_texts)} texts"
                )

            for text, emb in zip(unique_texts, computed_embeddings, strict=False):
                self.set(text, emb, model_name=model_name, ttl=ttl)
                for idx in uncached_indices[text]:
                    results[idx] = emb

        return [res for res in results if res is not None]

    async def get_or_compute_batch_async(
        self,
        texts: list[str],
        embed_fn: Callable[[list[str]], Awaitable[list[list[float]]]],
        model_name: str = "default",
        ttl: float | None = None,
    ) -> list[list[float]]:
        """
        Async batch embed texts with caching.
        Only uncached unique texts are passed to embed_fn.
        Preserves the exact ordering of the input texts.
        """
        if not texts:
            return []

        results: list[list[float] | None] = [None] * len(texts)
        uncached_indices: dict[str, list[int]] = {}

        for idx, text in enumerate(texts):
            key = self._make_key(text, model_name)
            cached_val = self._cache.get(key)
            if cached_val is not None:
                results[idx] = cached_val
                with self._lock:
                    self._hits += 1
            else:
                with self._lock:
                    self._misses += 1
                if text not in uncached_indices:
                    uncached_indices[text] = []
                uncached_indices[text].append(idx)

        if uncached_indices:
            unique_texts = list(uncached_indices.keys())
            computed_embeddings = await embed_fn(unique_texts)
            if len(computed_embeddings) != len(unique_texts):
                raise ValueError(
                    f"embed_fn returned {len(computed_embeddings)} embeddings for {len(unique_texts)} texts"
                )

            for text, emb in zip(unique_texts, computed_embeddings, strict=False):
                self.set(text, emb, model_name=model_name, ttl=ttl)
                for idx in uncached_indices[text]:
                    results[idx] = emb

        return [res for res in results if res is not None]

    def stats(self) -> dict[str, Any]:
        """Return cache hit/miss statistics and current size."""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_ratio = (self._hits / total_requests) if total_requests > 0 else 0.0
            return {
                "hits": self._hits,
                "misses": self._misses,
                "total_requests": total_requests,
                "hit_ratio": hit_ratio,
                "cached_entries": len(self._cache),
            }

    def clear(self) -> None:
        """Clear the cache and reset statistics."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0


# Global embedding cache instance
embedding_cache = BatchEmbeddingCache(default_ttl=3600.0, maxsize=4096)


def get_embedding_cache() -> BatchEmbeddingCache:
    """Return the global BatchEmbeddingCache instance."""
    return embedding_cache


def clear_embedding_cache() -> None:
    """Clear the global embedding cache."""
    embedding_cache.clear()

