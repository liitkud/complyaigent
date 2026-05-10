import fitz  # PyMuPDF
from ..core.logging import logger


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract raw text from PDF using PyMuPDF.
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"PDF extraction failed: {str(e)}")
        raise


def extract_text_from_markdown(file_path: str) -> str:
    """
    Read text from Markdown file.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def clean_text(text: str) -> str:
    """
    Strip non-printable characters and normalize whitespace.
    """
    # Simple normalization for now
    return " ".join(text.split())
