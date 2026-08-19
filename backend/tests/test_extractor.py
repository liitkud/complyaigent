from pathlib import Path

import pytest

from app.services.extractor import EmptyDocumentError, extract_text_from_pdf

IMAGE_ONLY_PDF = Path(__file__).parents[2] / "docs/mvp/fixtures/image-only.pdf"
TEXT_PDF = Path(__file__).parents[2] / "docs/mvp/fixtures/text-policy.pdf"


def test_extract_text_from_pdf_is_stable():
    assert extract_text_from_pdf(str(TEXT_PDF)) == (
        "Sample policy fixture\nRetention: Keep records for seven years."
    )


def test_extract_text_from_image_only_pdf_is_explicitly_unsupported():
    with pytest.raises(EmptyDocumentError, match="no extractable text"):
        extract_text_from_pdf(str(IMAGE_ONLY_PDF))
