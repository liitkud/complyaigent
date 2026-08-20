import re
from uuid import uuid4

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from ..core.config import settings
from ..models.rule import GovernanceRule, ImpactRadius, RuleType
from .comparator import comparator


class ImpactedRuleSummary(BaseModel):
    rule_id: str
    task_id: str
    type: str
    impact_radius: str
    risk_level: str
    source_category: str
    content: str
    change_type: str
    similarity_score: float
    reasoning: str


class RiskSummary(BaseModel):
    high_risk_count: int = 0
    medium_risk_count: int = 0
    low_risk_count: int = 0
    overall_risk_level: str = "low"


class BucketBreakdown(BaseModel):
    A1: int = 0
    A2: int = 0
    B: int = 0
    C: int = 0


class SimulationResult(BaseModel):
    simulation_id: str = Field(default_factory=lambda: str(uuid4()))
    candidate_text: str
    impact_radius: str
    overall_risk_level: str
    total_rules_evaluated: int
    impacted_rules_count: int
    risk_summary: RiskSummary
    bucket_breakdown: BucketBreakdown
    impacted_rules: list[ImpactedRuleSummary] = Field(default_factory=list)
    summary: str


RADIUS_WEIGHT = {
    ImpactRadius.GLOBAL_STANDARD: 3,
    ImpactRadius.ORG_WIDE: 2,
    ImpactRadius.CODE_BASE: 1,
}

GLOBAL_KEYWORDS = {
    "gdpr",
    "eu ai act",
    "iso",
    "soc2",
    "nist",
    "federal",
    "international",
    "global_standard",
    "global standard",
    "statutory",
    "legislation",
    "government_law",
}

ORG_KEYWORDS = {
    "company-wide",
    "organization",
    "all employees",
    "all teams",
    "org_guideline",
    "org_constitution",
    "constitution",
    "corporate policy",
    "internal policy",
}

BUCKET_MAP = {
    RuleType.A1_SCANNABLE: "A1",
    RuleType.A2_ACTIONABLE: "A2",
    RuleType.B_INFRA_METADATA: "B",
    RuleType.C_SEMANTIC_GUIDANCE: "C",
}

CONFLICT_NEGATION_WORDS = {
    "prohibit",
    "prohibited",
    "must not",
    "shall not",
    "forbidden",
    "disallow",
    "never",
}

ALLOW_WORDS = {
    "allow",
    "allowed",
    "must",
    "shall",
    "required",
    "permit",
    "permitted",
    "mandatory",
}


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"\b\w{3,}\b", text.lower()))


def _jaccard_similarity(tokens1: set[str], tokens2: set[str]) -> float:
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)
    return float(intersection / union) if union > 0 else 0.0


def _detect_intrinsic_impact_radius(text: str) -> ImpactRadius:
    lower = text.lower()
    for kw in GLOBAL_KEYWORDS:
        if kw in lower:
            return ImpactRadius.GLOBAL_STANDARD
    for kw in ORG_KEYWORDS:
        if kw in lower:
            return ImpactRadius.ORG_WIDE
    return ImpactRadius.CODE_BASE


def _detect_change_type(
    candidate_text: str,
    rule_content: str,
    jaccard: float,
    anchor_match: bool,
) -> tuple[str, str]:
    if (
        rule_content.strip().lower() == candidate_text.strip().lower()
        or jaccard >= 0.85
    ):
        return (
            "DUPLICATE",
            "Candidate requirement is identical or semantically identical to existing rule.",
        )

    cand_lower = candidate_text.lower()
    rule_lower = rule_content.lower()

    cand_has_neg = any(w in cand_lower for w in CONFLICT_NEGATION_WORDS)
    rule_has_neg = any(w in rule_lower for w in CONFLICT_NEGATION_WORDS)
    cand_has_allow = any(w in cand_lower for w in ALLOW_WORDS)
    rule_has_allow = any(w in rule_lower for w in ALLOW_WORDS)

    if (cand_has_neg and rule_has_allow and not rule_has_neg) or (
        rule_has_neg and cand_has_allow and not cand_has_neg
    ):
        return (
            "CONFLICT",
            "Candidate requirement contradicts permissions or prohibitions in existing rule.",
        )

    if anchor_match:
        return (
            "MODIFIED",
            "Candidate regulation amends existing requirement under the same regulatory anchor.",
        )

    if jaccard >= 0.4:
        return (
            "MODIFIED",
            "Candidate text significantly modifies the scope or terms of existing rule.",
        )

    return (
        "RELATED",
        "Candidate text shares domain overlap or regulatory scope with existing rule.",
    )


class SimulatorService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=settings.CHAT_MODEL,
                openai_api_key=settings.LLM_API_KEY,
                base_url=settings.LLM_ENDPOINT,
                timeout=5.0,
            )
        return self._llm

    async def simulate(
        self,
        candidate_text: str,
        existing_rules: list[GovernanceRule],
        similarity_threshold: float = 0.2,
    ) -> SimulationResult:
        candidate_anchors = set(comparator.extract_anchors(candidate_text))
        candidate_tokens = _tokenize(candidate_text)
        candidate_intrinsic_radius = _detect_intrinsic_impact_radius(candidate_text)

        impacted_rules: list[ImpactedRuleSummary] = []
        bucket_counts = {"A1": 0, "A2": 0, "B": 0, "C": 0}
        risk_counts = {"high": 0, "medium": 0, "low": 0}

        max_radius_val = RADIUS_WEIGHT.get(candidate_intrinsic_radius, 1)

        for rule in existing_rules:
            rule_anchors = set(comparator.extract_anchors(rule.content))
            anchor_overlap = bool(
                candidate_anchors
                and rule_anchors
                and (candidate_anchors & rule_anchors)
            )
            rule_tokens = _tokenize(rule.content)
            jaccard = _jaccard_similarity(candidate_tokens, rule_tokens)

            tag_overlap = False
            if rule.tags:
                tag_overlap = any(
                    tag.lower() in candidate_text.lower() for tag in rule.tags
                )

            score = jaccard
            if anchor_overlap:
                score = max(score, 0.75)
            elif tag_overlap and score < 0.3:
                score = max(score, 0.35)

            if score >= similarity_threshold or anchor_overlap:
                change_type, reasoning = _detect_change_type(
                    candidate_text, rule.content, jaccard, anchor_overlap
                )

                rule_type_str = (
                    rule.type.value if hasattr(rule.type, "value") else str(rule.type)
                )
                bucket_key = BUCKET_MAP.get(rule.type, "C")
                bucket_counts[bucket_key] = bucket_counts.get(bucket_key, 0) + 1

                risk_str = (
                    rule.risk_level.value
                    if hasattr(rule.risk_level, "value")
                    else str(rule.risk_level)
                )
                risk_counts[risk_str.lower()] = risk_counts.get(risk_str.lower(), 0) + 1

                rule_radius = (
                    rule.impact_radius
                    if isinstance(rule.impact_radius, ImpactRadius)
                    else ImpactRadius(rule.impact_radius)
                )
                radius_weight = RADIUS_WEIGHT.get(rule_radius, 1)
                if radius_weight > max_radius_val:
                    max_radius_val = radius_weight

                source_cat_str = (
                    rule.source_category.value
                    if hasattr(rule.source_category, "value")
                    else str(rule.source_category)
                )

                impacted_rules.append(
                    ImpactedRuleSummary(
                        rule_id=str(rule.id),
                        task_id=str(rule.task_id),
                        type=rule_type_str,
                        impact_radius=rule_radius.value,
                        risk_level=risk_str,
                        source_category=source_cat_str,
                        content=rule.content,
                        change_type=change_type,
                        similarity_score=round(score, 4),
                        reasoning=reasoning,
                    )
                )

        weight_to_radius = {v: k for k, v in RADIUS_WEIGHT.items()}
        resolved_impact_radius = weight_to_radius.get(
            max_radius_val, ImpactRadius.CODE_BASE
        )

        if risk_counts["high"] > 0:
            overall_risk = "high"
        elif risk_counts["medium"] > 0:
            overall_risk = "medium"
        else:
            overall_risk = "low"

        summary = (
            f"Simulation evaluated {len(existing_rules)} existing rule(s). "
            f"Found {len(impacted_rules)} impacted rule(s) with overall impact radius '{resolved_impact_radius.value}' "
            f"and risk level '{overall_risk}'. "
            f"Affected buckets: A1={bucket_counts['A1']}, A2={bucket_counts['A2']}, B={bucket_counts['B']}, C={bucket_counts['C']}."
        )

        return SimulationResult(
            candidate_text=candidate_text,
            impact_radius=resolved_impact_radius.value,
            overall_risk_level=overall_risk,
            total_rules_evaluated=len(existing_rules),
            impacted_rules_count=len(impacted_rules),
            risk_summary=RiskSummary(
                high_risk_count=risk_counts["high"],
                medium_risk_count=risk_counts["medium"],
                low_risk_count=risk_counts["low"],
                overall_risk_level=overall_risk,
            ),
            bucket_breakdown=BucketBreakdown(**bucket_counts),
            impacted_rules=impacted_rules,
            summary=summary,
        )


simulator = SimulatorService()
