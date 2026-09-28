# Contributing to FerretOPS

## Read first
- [docs/ROADMAP.md](ROADMAP.md) — phases, current state, and non-goals
- [docs/mvp/README.md](mvp/README.md) — MVP definition of done + workstreams
- [docs/handover/README.md](handover/README.md) — architecture + current priorities
- [docs/ONBOARDING.md](ONBOARDING.md) — local setup and test workflows
- [docs/constitution.md](constitution.md) — canonical project constitution and core principles
- Epic: https://github.com/liitkud/complyaigent/issues/74

## Feature plans & handoffs
- Per-feature docs: [`docs/handoffs/`](handoffs/) — dated handoffs on `docs/<topic>-handoffs` or `feat|mvp/<issue>-*` branches using [`docs/handoffs/_TEMPLATE.md`](handoffs/_TEMPLATE.md)
- Project-wide overview only: [`docs/handover/`](handover/README.md)
- Feature specifications / SDDs: [`docs/specs/`](specs/)

## Defaults
- Branch from `dev`; small PRs mapped to tracked issues
- Backend: `cd backend && uv sync && uv run …`
- Frontend: `cd frontend && pnpm install && pnpm dev`
- CLI: `cd cli && make build && make install`
- Do not reintroduce floating unpinned `ruff`/`ty` in CI without lockfile pins
- Prefer project-scoped changes; no drive-by refactors outside the issue

## Frontend reference

Use the documentation shipped with the installed Next.js version in
`frontend/node_modules/next/dist/docs/` when checking APIs and migration guidance.

## Documentation layout

Keep project specifications, architecture, and contributor guidance under `docs/`.
Reusable skills and assistant-specific configuration belong in personal or shared
tool configuration outside this repository. No particular assistant or editor is
required to contribute.
