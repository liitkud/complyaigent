from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class TaskStatus(StrEnum):
    COMPARING = "comparing"
    COMPACTING = "compacting"
    CATEGORIZING = "categorizing"
    COMPLETE = "complete"
    FAILED = "failed"


class IngestionTask(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    policy_id: UUID = Field(default_factory=uuid4, index=True)
    status: TaskStatus = Field(default=TaskStatus.COMPARING)
    progress_pct: int = Field(default=0)
    current_stage: str | None = None
    eta_seconds: int | None = None
    source_hash: str = Field(index=True, unique=True)
    source_name: str = Field(default="Unnamed policy")
    source_type: str = Field(default="org_guideline")
    version_number: int = Field(default=1)
    previous_version_id: UUID | None = None
    version_chain: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
