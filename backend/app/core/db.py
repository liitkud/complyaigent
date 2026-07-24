from sqlmodel import Session, SQLModel, create_engine

from .config import settings

engine = create_engine(
    settings.DATABASE_URL or "sqlite:///./test.db",
    echo=(settings.ENVIRONMENT == "development"),
    connect_args={"timeout": 10}
    if "sqlite" in (settings.DATABASE_URL or "sqlite")
    else {},
)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
