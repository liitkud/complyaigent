import asyncio
import json
import re
from re import _constants, _parser

from langchain_openai import ChatOpenAI

from ..core.config import settings
from ..core.logging import logger

MAX_A1_PATTERN_LENGTH = 500
MAX_A1_TEST_LENGTH = 10_000


def validate_a1_rule(rule: dict) -> str | None:
    """Return a rejection reason when an A1 rule is unsafe to publish."""
    metadata = rule.get("metadata")
    if not isinstance(metadata, dict):
        return "metadata must be an object"

    pattern = metadata.get("pattern")
    test_pass = metadata.get("test_pass")
    test_fail = metadata.get("test_fail")
    if not all(isinstance(value, str) for value in (pattern, test_pass, test_fail)):
        return "pattern, test_pass, and test_fail are required strings"
    if not pattern:
        return "pattern must not be empty"
    if len(pattern) > MAX_A1_PATTERN_LENGTH:
        return f"pattern exceeds {MAX_A1_PATTERN_LENGTH} characters"
    if len(test_pass) > MAX_A1_TEST_LENGTH or len(test_fail) > MAX_A1_TEST_LENGTH:
        return f"test strings exceed {MAX_A1_TEST_LENGTH} characters"

    try:
        compiled = re.compile(pattern)
        parsed = _parser.parse(pattern, 0)
    except (re.error, ValueError) as error:
        return f"malformed regex: {error}"

    def contains_token(tokens, wanted) -> bool:
        for token, value in tokens:
            if token == wanted:
                return True
            if token in (_constants.MAX_REPEAT, _constants.MIN_REPEAT):
                if contains_token(value[2], wanted):
                    return True
            elif token == _constants.SUBPATTERN and contains_token(value[3], wanted):
                return True
            elif token == _constants.BRANCH and any(
                contains_token(branch, wanted) for branch in value[1]
            ):
                return True
        return False

    def has_pathological_repetition(tokens) -> bool:
        for token, value in tokens:
            if token in (_constants.MAX_REPEAT, _constants.MIN_REPEAT):
                children = value[2]
                if contains_token(children, _constants.MAX_REPEAT) or contains_token(
                    children, _constants.MIN_REPEAT
                ):
                    return True
                if contains_token(children, _constants.BRANCH):
                    return True
                if has_pathological_repetition(children):
                    return True
            elif token == _constants.SUBPATTERN:
                if has_pathological_repetition(value[3]):
                    return True
            elif token == _constants.BRANCH and any(
                has_pathological_repetition(branch) for branch in value[1]
            ):
                return True
        return False

    if has_pathological_repetition(parsed):
        return "pathological regex: nested or ambiguous repetition"
    if compiled.search(test_pass) is None:
        return "test_pass does not match pattern"
    if compiled.search(test_fail) is not None:
        return "test_fail matches pattern"
    return None


class CategorizerService:
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
                # 5s timeout per LLM call
            )
        return self._llm

    async def categorize_rules(self, compacted_text: str) -> list[dict]:
        """
        Classifies rules into A1, A2, B, C buckets.
        Retries up to three total attempts with 2s delay.
        """
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                prompt = f"""
                Analyze the following requirements and categorize them into buckets:
                - A1_SCANNABLE: Machine-enforceable via regex. Provide regex, test_pass, and test_fail.
                - A2_ACTIONABLE: Requires human verification. Provide instructions and a yes/no verification question.
                - B_INFRA_METADATA: Infrastructure config (e.g., encryption=true).
                - C_SEMANTIC_GUIDANCE: General advice.

                For each rule, also determine impact_radius (code_base, org_wide, global_standard) and risk_level (low, medium, high).

                Requirements:
                {compacted_text}

                Return a JSON list of objects with: type, impact_radius, risk_level, source_category, content, remediation, tags, metadata.
                STRICT RULES FOR VALUES:
                - type: MUST BE one of ["A1_SCANNABLE", "A2_ACTIONABLE", "B_INFRA_METADATA", "C_SEMANTIC_GUIDANCE"].
                  DO NOT use "MUST", "SHOULD", "COULD", or any section headers.
                - source_category: MUST BE one of ["government_law", "org_guideline", "org_constitution"].
                  "org_constitution" means internal company policy like MUST/SHOULD/COULD rules.
                """
                # Use asyncio.wait_for for strict timeout if SDK timeout isn't enough
                response = await asyncio.wait_for(self.llm.ainvoke(prompt), timeout=6.0)

                raw_content = response.content
                if not isinstance(raw_content, str):
                    raw_content = str(raw_content)
                if "```json" in raw_content:
                    raw_content = (
                        raw_content.split("```json")[1].split("```")[0].strip()
                    )

                try:
                    rules = json.loads(raw_content)
                except json.JSONDecodeError:
                    logger.warning(
                        "Categorizer received truncated JSON, attempting recovery"
                    )
                    trimmed = raw_content.rstrip()
                    if trimmed.endswith(","):
                        trimmed = trimmed[:-1]
                    if not trimmed.endswith("]"):
                        trimmed = trimmed + "]"
                    rules = json.loads(trimmed)

                SOURCE_CATEGORY_MAP = {
                    "MUST Rules": "org_constitution",
                    "SHOULD Rules": "org_constitution",
                    "COULD Rules": "org_constitution",
                    "Additional Requirements": "org_constitution",
                    "MUST": "org_constitution",
                    "SHOULD": "org_constitution",
                    "COULD": "org_constitution",
                }

                TYPE_MAP = {
                    "MUST": "A1_SCANNABLE",
                    "SHOULD": "A2_ACTIONABLE",
                    "COULD": "C_SEMANTIC_GUIDANCE",
                    "MUST Rules": "A1_SCANNABLE",
                    "SHOULD Rules": "A2_ACTIONABLE",
                    "COULD Rules": "C_SEMANTIC_GUIDANCE",
                }

                for rule in rules:
                    # Fix type enum mismatch
                    raw_type = rule.get("type", "")
                    if raw_type not in [
                        "A1_SCANNABLE",
                        "A2_ACTIONABLE",
                        "B_INFRA_METADATA",
                        "C_SEMANTIC_GUIDANCE",
                    ]:
                        rule["type"] = TYPE_MAP.get(raw_type, "C_SEMANTIC_GUIDANCE")

                    # Fix source_category enum mismatch
                    raw_category = rule.get("source_category", "")
                    rule["source_category"] = SOURCE_CATEGORY_MAP.get(
                        raw_category, "org_guideline"
                    )
                    rem = rule.get("remediation")
                    if isinstance(rem, (dict, list)):
                        rule["remediation"] = json.dumps(rem)

                safe_rules = []
                for rule in rules:
                    if rule.get("type") == "A1_SCANNABLE":
                        rejection = validate_a1_rule(rule)
                        if rejection:
                            logger.warning(
                                "Discarding unsafe generated A1 rule: %s", rejection
                            )
                            continue
                    safe_rules.append(rule)
                rules = safe_rules

                if rules:
                    logger.debug(
                        f"Categorizer processed {len(rules)} rules on attempt {attempt}."
                    )
                return rules

            except Exception as e:
                if attempt < max_attempts:
                    logger.warning(
                        f"Categorizer attempt {attempt} failed: {e!s}. Retrying in 2s..."
                    )
                    await asyncio.sleep(2)
                else:
                    logger.error(
                        f"Categorizer failed after {max_attempts} attempts: {e!s}"
                    )

        raise RuntimeError(
            f"Categorizer failed after {max_attempts} attempts"
        ) from None


categorizer = CategorizerService()
