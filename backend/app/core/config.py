from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Detect project root (where .env lives)
# config.py is in backend/app/core/
ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = ROOT / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "ComplyAIgent"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "DEBUG"

    # Database
    DATABASE_URL: str = ""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # External LLM Providers (Groq, etc.)
    LLM_API_KEY: str = ""
    LLM_ENDPOINT: str = "https://api.groq.com/openai/v1"
    CHAT_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    # Embeddings (Cohere, etc.)
    COHERE_API_KEY: str = ""
    EMBEDDING_MODEL: str = "embed-multilingual-v3.0"

    # Vector DB (Optional Milvus)
    MILVUS_URI: str = ""
    MILVUS_TOKEN: str = ""

    # Rate Limiting
    POST_RATE_LIMIT: str = "5/30 seconds"
    GET_RATE_LIMIT: str = "30/minute"

    # Pipeline
    MAX_RETRIES: int = 3

    # Verdict sink (#77) — Loki when LOKI_URL set; else optional JSONL file; else no-op
    LOKI_URL: str = ""
    LOKI_JOB: str = "complyaigent"
    VERDICT_SINK_PATH: str = ""

    model_config = SettingsConfigDict(
        env_file=ENV_PATH, env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
