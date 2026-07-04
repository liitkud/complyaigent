from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.logging import logger
from openai import AsyncOpenAI
from llama_index.vector_stores.postgres import PGVectorStore
import sqlalchemy

from .db import init_db
from .config import settings



class AppState:
    groq_client: Optional[AsyncOpenAI] = None
    vector_client: Optional[PGVectorStore] = None

app_state = AppState()




@asynccontextmanager
async def lifespan(app: FastAPI):

    try:
        init_db()
        logger.info("Database initialized")

        app_state.groq_client = AsyncOpenAI(
            base_url=settings.LLM_ENDPOINT, api_key=settings.LLM_API_KEY or "missing-key"
        )

        url = sqlalchemy.make_url(settings.DATABASE_URL)
        app_state.vector_client = PGVectorStore.from_params(
            host=url.host,
            port=str(url.port or 5432),
            user=url.username,
            password=url.password,
            database=url.database,
            table_name="regulations_vectors",
            embed_dim=1024,
        )
        yield

    finally:
        if app_state.groq_client:
            await app_state.groq_client.close()
        if app_state.vector_client:
            await app_state.vector_client.close()
