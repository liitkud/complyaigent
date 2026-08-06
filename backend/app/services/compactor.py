from langchain_openai import ChatOpenAI

from ..core.config import settings
from ..core.logging import logger


class CompactorService:
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

    async def compact_document(self, raw_text: str) -> str:
        """
        Strips preamble and non-normative text.
        Inlines necessary definitions/context from recitals.
        """
        prompt = f"""
        Extract only the normative requirements from the following document.
        Strip preamble, metadata, and non-mandatory text.
        If a requirement refers to a definition in a preamble or recital, inline that context so the requirement is atomic.

        Document:
        {raw_text}

        Output: A list of clean, atomic requirements.
        """
        try:
            response = await self.llm.ainvoke(prompt)
            content = response.content
            if not isinstance(content, str):
                content = str(content)
            return content
        except Exception as e:
            logger.error(f"Compaction failed: {e!s}")
            return raw_text  # Fallback to raw if LLM fails


compactor = CompactorService()
