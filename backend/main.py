from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import activity, ingest, manifest, simulate, validate
from app.core.config import settings
from app.core.db import init_db
from app.core.logging import logger
from app.core.rate_limit import setup_rate_limiting


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://comply.kuyacarlo.dev",
    ],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

setup_rate_limiting(app)


# Include routers
app.include_router(ingest.router, tags=["Ingestion"])
app.include_router(manifest.router, tags=["Manifest"])
app.include_router(validate.router, tags=["Validation"])
app.include_router(activity.router, tags=["Activity"])
app.include_router(simulate.router, tags=["Simulation"])


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=80, reload=False, log_level="info")
