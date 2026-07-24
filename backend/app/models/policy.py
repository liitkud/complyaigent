"""Policy metadata + version history (#75)."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Policy(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True)
    source_url: str | None = None
    version: int = Field(default=1)
    hash: str = Field(index=True)
    task_id: UUID | None = Field(default=None, foreign_key="ingestiontask.id")
    is_current: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
