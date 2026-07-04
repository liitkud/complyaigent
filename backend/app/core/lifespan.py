from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.logging import logger
from openai import AsyncOpenAI

from .db import init_db
from .config import settings
class AppState:
    groq_client: Optional[AsyncOpenAI] = None

app_state = AppState()




@asynccontextmanager
async def lifespan(app: FastAPI):

    try:
        init_db()
        logger.info("Database initialized")

        app_state.groq_client = AsyncOpenAI(
            base_url=settings.LLM_ENDPOINT, api_key=settings.LLM_API_KEY or "missing-key"
        )
        yield

    finally:

        await app_state.groq_client.close()