from langchain_openai import ChatOpenAI
from ..core.config import settings
from ..core.logging import logger
import json


class ValidatorService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=settings.CHAT_MODEL,
                openai_api_key=settings.LLM_API_KEY,
                base_url=settings.LLM_ENDPOINT,
            )
        return self._llm

    async def validate_risk(self, code: str, rule_context: str) -> dict:
        """
        Validates offending code against a governance rule.
        Returns decision and reasoning.
        """
        prompt = f"""
        As a compliance agent, evaluate the following code against this governance rule:
        
        Rule: {rule_context}
        Code: {code}
        
        Provide a safety verdict and reasoning.
        Verdict LOW: Safe to merge.
        Verdict MID: Needs human review (ambiguous or minor policy concern).
        Verdict HIGH: Critical violation, must block.

        Return JSON: {{"verdict": "LOW|MID|HIGH", "reasoning": "...", "remediation": "..."}}
        """
        try:
            response = await self.llm.ainvoke(prompt)
            raw_content = response.content
            if not isinstance(raw_content, str):
                raw_content = str(raw_content)
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            return json.loads(raw_content)
        except Exception as e:
            logger.error(f"Risk validation failed: {str(e)}")
            return {
                "verdict": "HIGH",
                "reasoning": f"Validation system error: {str(e)}",
                "remediation": "Review manually.",
            }


validator = ValidatorService()
