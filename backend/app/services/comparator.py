import re
from typing import List, Optional, Tuple
from datasketch import MinHash, MinHashLSH
from langchain_google_genai import ChatGoogleGenerativeAI
from ..core.config import settings


class ComparatorService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL, google_api_key=settings.GEMINI_API_KEY
        )
        self.lsh = MinHashLSH(threshold=0.85, num_perm=128)
        self.anchor_regex_seed = [
            r"Article\s+\d+",
            r"Requirement\s+\d+(\.\d+)*",
            r"CC\d+\.\d+",
            r"Section\s+\d+(\.\d+)*",
        ]

    def extract_anchors(self, text: str) -> List[str]:
        """
        Tier 1: Entity Anchor Extraction.
        """
        anchors = []
        for pattern in self.anchor_regex_seed:
            matches = re.findall(pattern, text, re.IGNORECASE)
            anchors.extend(matches)
        return list(set(anchors))

    def check_minhash(
        self, text: str, existing_minhashes: List[Tuple[str, MinHash]]
    ) -> Optional[str]:
        """
        Tier 2: MinHash LSH deduplication.
        """
        m = MinHash(num_perm=128)
        for word in text.split():
            m.update(word.encode("utf8"))

        # In a real system, we'd query the LSH index
        # For MVP, we'll do a simple comparison if threshold is met
        for task_id, existing_m in existing_minhashes:
            if m.jaccard(existing_m) >= 0.85:
                return task_id
        return None

    async def semantic_dedup(self, new_text: str, existing_text: str) -> str:
        """
        Tier 3: Semantic LLM deduplication fallback.
        Returns: DUPLICATE | UPDATE | DISTINCT
        """
        prompt = f"""
        Are these two governance requirements legally distinct or the same requirement phrased differently?
        
        Requirement A: {new_text}
        Requirement B: {existing_text}
        
        Return exactly one word: DUPLICATE, UPDATE, or DISTINCT.
        """
        response = await self.llm.ainvoke(prompt)
        content = response.content
        if not isinstance(content, str):
            content = str(content)
        result = content.strip().upper()
        return result if result in ["DUPLICATE", "UPDATE", "DISTINCT"] else "DISTINCT"


comparator = ComparatorService()
