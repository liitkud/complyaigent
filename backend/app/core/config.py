from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Detect project root (where .env lives)
# config.py is in backend/app/core/
ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = ROOT / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "FerretOPS"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "DEBUG"

    # Database
    DATABASE_URL: str = ""
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_PRE_PING: bool = True

    # Manifest Cache
    MANIFEST_CACHE_TTL: float = 60.0

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

    model_config = SettingsConfigDict(
        env_file=ENV_PATH, env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
