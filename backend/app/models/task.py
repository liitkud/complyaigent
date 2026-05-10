from sqlmodel import SQLModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Column, JSON


class TaskStatus(str, Enum):
    COMPARING = "comparing"
    COMPACTING = "compacting"
    CATEGORIZING = "categorizing"
    COMPLETE = "complete"
    FAILED = "failed"


class IngestionTask(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: TaskStatus = Field(default=TaskStatus.COMPARING)
    progress_pct: int = Field(default=0)
    current_stage: Optional[str] = None
    eta_seconds: Optional[int] = None
    source_hash: str = Field(index=True)
    previous_version_id: Optional[UUID] = None
    version_chain: List[UUID] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
