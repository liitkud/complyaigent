import asyncio
import time

import pytest

from app.services.extractor import (
    BatchEmbeddingCache,
    clear_embedding_cache,
    compact_prompt_tokens,
    compact_text_for_prompt,
    estimate_token_count,
    get_embedding_cache,
)


def test_estimate_token_count():
    assert estimate_token_count("") == 0
    assert estimate_token_count("abcd") == 1
    assert estimate_token_count("a" * 40) == 10
    assert estimate_token_count("Hello, world!") == 4


def test_compact_prompt_tokens_strips_noise():
    raw_document = """
    ==================================================
    Page 1 of 12
    --------------------------------------------------
    Security Policy Overview

    *
    -
    All passwords must be at least 16 characters.

    Page 2 of 12
    --------------------------------------------------
    All employees must use MFA.
    ==================================================
    """
    compacted = compact_prompt_tokens(raw_document)
    assert "Page 1 of 12" not in compacted
    assert "Page 2 of 12" not in compacted
    assert "===" not in compacted
    assert "---" not in compacted
    assert "Security Policy Overview" in compacted
    assert "All passwords must be at least 16 characters." in compacted
    assert "All employees must use MFA." in compacted


def test_compact_prompt_tokens_budget_limits():
    text = "Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8 Word9 Word10"
    compacted_chars = compact_prompt_tokens(text, max_chars=30)
    assert len(compacted_chars) <= 30
    assert compacted_chars.endswith("...")

    compacted_tokens = compact_text_for_prompt(text, max_tokens=5)
    assert len(compacted_tokens) <= 20
    assert compacted_tokens.endswith("...")

    # Empty text handling
    assert compact_prompt_tokens("") == ""
    assert compact_prompt_tokens("   \n\n  ") == ""


def test_compact_prompt_tokens_preserve_newlines_flag():
    text = "Line 1\n\nLine 2\nLine 3"
    single_line = compact_prompt_tokens(text, preserve_newlines=False)
    assert single_line == "Line 1 Line 2 Line 3"


def test_batch_embedding_cache_basic_ops():
    cache = BatchEmbeddingCache(default_ttl=10.0, maxsize=10)
    assert cache.get("sample text", model_name="test-model") is None

    cache.set("sample text", [0.1, 0.2, 0.3], model_name="test-model")
    cached_vec = cache.get("sample text", model_name="test-model")
    assert cached_vec == [0.1, 0.2, 0.3]

    stats = cache.stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["cached_entries"] == 1
    assert stats["hit_ratio"] == 0.5


def test_batch_embedding_cache_expiration():
    cache = BatchEmbeddingCache(default_ttl=0.05, maxsize=10)
    cache.set("quick text", [1.0, 2.0], ttl=0.05)
    assert cache.get("quick text") == [1.0, 2.0]
    time.sleep(0.06)
    assert cache.get("quick text") is None


def test_batch_embedding_cache_get_or_compute_batch():
    cache = BatchEmbeddingCache(default_ttl=60.0)
    call_count = 0

    def mock_embed(texts: list[str]) -> list[list[float]]:
        nonlocal call_count
        call_count += 1
        return [[float(len(t)), float(idx)] for idx, t in enumerate(texts)]

    input_texts = ["apple", "banana", "cherry", "apple", "banana"]

    # 1. First run: all unique texts computed in 1 batch call
    embeddings1 = cache.get_or_compute_batch(input_texts, mock_embed, model_name="m1")
    assert call_count == 1
    assert len(embeddings1) == 5
    assert embeddings1[0] == embeddings1[3]  # "apple"
    assert embeddings1[1] == embeddings1[4]  # "banana"

    # 2. Second run: full cache hit, mock_embed not called
    embeddings2 = cache.get_or_compute_batch(input_texts, mock_embed, model_name="m1")
    assert call_count == 1
    assert embeddings2 == embeddings1

    # 3. Partial run: 1 new text, 2 cached texts
    partial_inputs = ["apple", "dragonfruit", "cherry"]
    embeddings3 = cache.get_or_compute_batch(partial_inputs, mock_embed, model_name="m1")
    assert call_count == 2
    assert len(embeddings3) == 3
    assert embeddings3[0] == embeddings1[0]  # "apple" from cache
    assert embeddings3[2] == embeddings1[2]  # "cherry" from cache


@pytest.mark.anyio
async def test_batch_embedding_cache_async():
    cache = BatchEmbeddingCache(default_ttl=60.0)
    call_count = 0

    async def mock_async_embed(texts: list[str]) -> list[list[float]]:
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.01)
        return [[1.0 * len(t)] for t in texts]

    inputs = ["rule A", "rule B", "rule A"]
    res1 = await cache.get_or_compute_batch_async(inputs, mock_async_embed)
    assert call_count == 1
    assert len(res1) == 3
    assert res1[0] == res1[2]

    # Repeated async call hits cache
    res2 = await cache.get_or_compute_batch_async(inputs, mock_async_embed)
    assert call_count == 1
    assert res2 == res1


def test_batch_embedding_cache_mismatched_output_error():
    cache = BatchEmbeddingCache()

    def bad_embed(_: list[str]) -> list[list[float]]:
        return [[1.0]]  # Returns 1 result regardless of input length

    with pytest.raises(ValueError, match="embed_fn returned"):
        cache.get_or_compute_batch(["t1", "t2"], bad_embed)


def test_global_embedding_cache_helper():
    clear_embedding_cache()
    g_cache = get_embedding_cache()
    assert g_cache.stats()["cached_entries"] == 0

    g_cache.set("global_k", [0.5, 0.5])
    assert g_cache.get("global_k") == [0.5, 0.5]

    clear_embedding_cache()
    assert g_cache.get("global_k") is None
