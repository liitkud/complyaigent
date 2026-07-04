from .db import init_db
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialized")
    yield