# Agent notes — ComplyAIgent

## Read first
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases and non-goals
- [docs/mvp/README.md](docs/mvp/README.md) — MVP definition of done + workstreams
- [docs/handover/README.md](docs/handover/README.md) — architecture + current priorities
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — local setup
- Epic: https://github.com/liitkud/complyaigent/issues/74

## Feature plans & handoffs
- Skill: `feature-plan` (`.agents/skills/feature-plan/`, `.cursor/skills/feature-plan/`)
- Per-feature docs: [`docs/handoffs/`](docs/handoffs/) — dated handoffs on `docs/<topic>-handoffs` or `feat|mvp/<issue>-*` branches
- Project-wide overview only: [`docs/handover/`](docs/handover/README.md)

## Defaults
- Branch from `dev`; small PRs mapped to MVP sub-issues (#75–#81)
- Backend: `cd backend && uv sync && uv run …`
- Do not reintroduce floating unpinned `ruff`/`ty` in CI without lockfile pins
- Prefer project-scoped changes; no drive-by refactors outside the issue

## MVP foundation (issues #75–#81)
- Sample policy fixtures: [`docs/mvp/fixtures/`](docs/mvp/fixtures/) — Markdown with H1 + `## Controls`; covered by `backend/tests/test_mvp_fixtures.py`
- Verdict events: `backend/app/services/verdict_log.py` — validate returns `verdict_event` with required keys (`action`, `verdict`, `repo`, `timestamp`, `policy_id`/`policyId`, `validation_id`, `rule_id`)
- Policies API: `GET /policies`, `GET /policies/{id}`; `POST /ingest` returns `policy_id` and versions by content hash
- Backend tests: `cd backend && uv run pytest` (pyproject sets `pythonpath = ["."]`)
- Prefer TDD on MVP slices; update the matching `docs/handoffs/YYYY-MM-DD-*.md` when status changes

## Speckit
Feature plans live under `specs/` and `.specify/`. Constitution: `docs/constitution.md` → `.specify/memory/constitution.md`.
