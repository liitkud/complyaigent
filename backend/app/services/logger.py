from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, Session, SQLModel, create_engine

from ..core.config import settings


class ActivityLog(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    action: str
    status: str = Field(default="pending")
    user_id: str | None = None
    details: dict = Field(default_factory=dict, sa_column=Column(JSON))
    task_id: UUID | None = None


engine = create_engine(settings.DATABASE_URL)


def log_activity(
    action: str,
    details: dict,
    task_id: UUID | None = None,
    status: str = "pending",
):
    """
    Persist activity log to database.
    """
    with Session(engine) as session:
        log = ActivityLog(
            action=action, details=details, task_id=task_id, status=status
        )
        session.add(log)
        session.commit()
        return log
