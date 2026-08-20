from uuid import uuid4

from sqlalchemy import event, inspect, text
from sqlmodel import Session, SQLModel, create_engine

from .config import settings

db_url = settings.DATABASE_URL or "sqlite:///./test.db"
is_sqlite = db_url.startswith("sqlite")

if is_sqlite:
    engine_kwargs = {
        "echo": (settings.ENVIRONMENT == "development"),
        "connect_args": {
            "timeout": settings.DB_POOL_TIMEOUT,
            "check_same_thread": False,
        },
    }
else:
    engine_kwargs = {
        "echo": (settings.ENVIRONMENT == "development"),
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_pre_ping": settings.DB_POOL_PRE_PING,
    }

engine = create_engine(db_url, **engine_kwargs)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if is_sqlite:
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()
        except Exception:
            pass


def init_db():
    SQLModel.metadata.create_all(engine)
    _migrate_ingestion_task_columns()


def _migrate_ingestion_task_columns():
    """Apply additive MVP columns to an existing local database.

    This is intentionally small and idempotent. A full migration tool will
    replace it before production deployment is enabled.
    """
    with engine.begin() as connection:
        existing = {
            column["name"]
            for column in inspect(connection).get_columns("ingestiontask")
        }
        is_postgres = connection.dialect.name == "postgresql"
        column_types = {
            "policy_id": "UUID" if is_postgres else "TEXT",
            "source_name": "VARCHAR(255)",
            "source_type": "VARCHAR(64)",
            "version_number": "INTEGER",
            "version_chain": "JSON",
        }
        defaults = {
            "source_name": "'Unnamed policy'",
            "source_type": "'org_guideline'",
            "version_number": "1",
            "version_chain": "'[]'",
        }
        for name, column_type in column_types.items():
            if name not in existing:
                default = f" DEFAULT {defaults[name]}" if name in defaults else ""
                connection.execute(
                    # nosemgrep: python.sqlalchemy.security.audit.avoid-sqlalchemy-text.avoid-sqlalchemy-text
                    text(
                        f"ALTER TABLE ingestiontask ADD COLUMN {name} "
                        f"{column_type}{default}"
                    )
                )

        if "policy_id" not in existing:
            rows = (
                connection.execute(
                    text("SELECT id FROM ingestiontask WHERE policy_id IS NULL")
                )
                .scalars()
                .all()
            )
            for task_id in rows:
                connection.execute(
                    text(
                        "UPDATE ingestiontask SET policy_id = :policy_id "
                        "WHERE id = :task_id"
                    ),
                    {"policy_id": str(uuid4()), "task_id": task_id},
                )

        if "version_chain" not in existing:
            connection.execute(
                text(
                    "UPDATE ingestiontask SET version_chain = '[]' "
                    "WHERE version_chain IS NULL"
                )
            )


def get_session():
    with Session(engine) as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
