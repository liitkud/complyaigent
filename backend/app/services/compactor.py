from langchain_google_genai import ChatGoogleGenerativeAI
from ..core.config import settings
from ..core.logging import logger


class CompactorService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL, google_api_key=settings.GEMINI_API_KEY
        )

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
            logger.error(f"Compaction failed: {str(e)}")
            return raw_text  # Fallback to raw if LLM fails


compactor = CompactorService()
