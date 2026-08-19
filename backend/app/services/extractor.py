import fitz  # PyMuPDF

from ..core.logging import logger


class EmptyDocumentError(ValueError):
    """Raised when a supported document contains no extractable text."""


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract raw text from PDF using PyMuPDF.
    """
    try:
        with fitz.open(file_path) as doc:
            text = "\n".join(page.get_text("text", sort=True) for page in doc)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e!s}")
        raise

    if not text.strip():
        raise EmptyDocumentError(
            "PDF contains no extractable text; image-only PDFs are not supported"
        )
    return text


def extract_text_from_markdown(file_path: str) -> str:
    """
    Read text from Markdown file.
    """
    with open(file_path, encoding="utf-8") as f:
        return f.read()


def clean_text(text: str) -> str:
    """
    Strip non-printable characters and normalize whitespace.
    """
    # Simple normalization for now
    return " ".join(text.split())
