from sqlmodel import SQLModel, Field, Session, create_engine
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional
from ..core.config import settings
from sqlalchemy import Column, JSON


from datetime import timezone


class ActivityLog(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    action: str
    user_id: Optional[str] = None
    details: dict = Field(default_factory=dict, sa_column=Column(JSON))
    task_id: Optional[UUID] = None


engine = create_engine(settings.DATABASE_URL)


def log_activity(action: str, details: dict, task_id: Optional[UUID] = None):
    """
    Persist activity log to database.
    """
    with Session(engine) as session:
        log = ActivityLog(action=action, details=details, task_id=task_id)
        session.add(log)
        session.commit()
