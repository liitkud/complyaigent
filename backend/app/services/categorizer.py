from langchain_google_genai import ChatGoogleGenerativeAI
from ..core.config import settings
from ..core.logging import logger
from typing import List, Dict
import json


class CategorizerService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL, google_api_key=settings.GEMINI_API_KEY
        )

    async def categorize_rules(self, compacted_text: str) -> List[Dict]:
        """
        Classifies rules into A1, A2, B, C buckets.
        Generates regex and test cases for A1.
        Generates verification questions for A2.
        """
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
        """
        try:
            response = await self.llm.ainvoke(prompt)
            # Basic JSON extraction (in prod use PydanticOutputParser)
            raw_content = response.content
            if not isinstance(raw_content, str):
                raw_content = str(raw_content)
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            return json.loads(raw_content)
        except Exception as e:
            logger.error(f"Categorization failed: {str(e)}")
            return []


categorizer = CategorizerService()
