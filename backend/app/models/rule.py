from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, SQLModel


class RuleType(StrEnum):
    A1_SCANNABLE = "A1_SCANNABLE"
    A2_ACTIONABLE = "A2_ACTIONABLE"
    B_INFRA_METADATA = "B_INFRA_METADATA"
    C_SEMANTIC_GUIDANCE = "C_SEMANTIC_GUIDANCE"


class ImpactRadius(StrEnum):
    CODE_BASE = "code_base"
    ORG_WIDE = "org_wide"
    GLOBAL_STANDARD = "global_standard"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SourceCategory(StrEnum):
    GOVERNMENT_LAW = "government_law"
    ORG_GUIDELINE = "org_guideline"
    ORG_CONSTITUTION = "org_constitution"


class GovernanceRule(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    task_id: UUID = Field(foreign_key="ingestiontask.id")
    type: RuleType
    impact_radius: ImpactRadius = Field(default=ImpactRadius.CODE_BASE)
    risk_level: RiskLevel = Field(default=RiskLevel.LOW)
    source_category: SourceCategory
    content: str
    remediation: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    related_rules: list[UUID] = Field(default_factory=list, sa_column=Column(JSON))
    rule_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
