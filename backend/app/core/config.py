from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Governance Bridge API"
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Rate Limiting
    POST_RATE_LIMIT: str = "5/30 seconds"
    GET_RATE_LIMIT: str = "30/minute"

    # Pipeline
    MAX_RETRIES: int = 3

    class Config:
        env_file = ".env"


settings = Settings()
