# Agent notes — ComplyAIgent

## Read first
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases and non-goals
- [docs/mvp/README.md](docs/mvp/README.md) — MVP definition of done + workstreams
- [docs/handover/README.md](docs/handover/README.md) — architecture + current priorities
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — local setup
- Epic: https://github.com/liitkud/complyaigent/issues/74

## Defaults
- Branch from `dev`; small PRs mapped to MVP sub-issues (#75–#81)
- Backend: `cd backend && uv sync && uv run …`
- Do not reintroduce floating unpinned `ruff`/`ty` in CI without lockfile pins
- Prefer project-scoped changes; no drive-by refactors outside the issue

## Speckit
Feature plans live under `specs/` and `.specify/`. Constitution: `docs/constitution.md` → `.specify/memory/constitution.md`.
