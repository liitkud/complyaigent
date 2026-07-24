"""MVP sample policy pack (#81) — fixtures must exist for E2E."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURES = REPO_ROOT / "docs" / "mvp" / "fixtures"


def test_fixtures_dir_exists():
    assert FIXTURES.is_dir(), f"missing fixtures dir: {FIXTURES}"


def test_at_least_one_markdown_policy():
    files = sorted(FIXTURES.glob("*.md"))
    assert files, "expected ≥1 docs/mvp/fixtures/*.md policy"


def test_fixture_has_title_and_controls():
    files = sorted(FIXTURES.glob("*.md"))
    assert files
    text = files[0].read_text(encoding="utf-8")
    assert text.lstrip().startswith("#"), "fixture needs an H1 title"
    assert "## Controls" in text or "## controls" in text.lower()
