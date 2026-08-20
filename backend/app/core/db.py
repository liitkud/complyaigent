from uuid import uuid4

from sqlalchemy import inspect, text
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
        yield session
