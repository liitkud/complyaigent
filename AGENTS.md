# Agent notes — FerretOPS

## Read first
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases, current state, and non-goals
- [docs/mvp/README.md](docs/mvp/README.md) — MVP definition of done + workstreams
- [docs/handover/README.md](docs/handover/README.md) — architecture + current priorities
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — local setup and test workflows
- [docs/constitution.md](docs/constitution.md) — canonical project constitution and core principles
- Epic: https://github.com/liitkud/complyaigent/issues/74

## Feature plans & handoffs
- Per-feature docs: [`docs/handoffs/`](docs/handoffs/) — dated handoffs on `docs/<topic>-handoffs` or `feat|mvp/<issue>-*` branches using [`docs/handoffs/_TEMPLATE.md`](docs/handoffs/_TEMPLATE.md)
- Project-wide overview only: [`docs/handover/`](docs/handover/README.md)
- Feature specifications / SDDs: [`docs/specs/`](docs/specs/)
- Skill (optional): `feature-plan` from central skill catalogs (no repo-local duplicate copies required)

## Defaults
- Branch from `dev`; small PRs mapped to tracked issues
- Backend: `cd backend && uv sync && uv run …`
- Frontend: `cd frontend && pnpm install && pnpm dev`
- CLI: `cd cli && make build && make install`
- Do not reintroduce floating unpinned `ruff`/`ty` in CI without lockfile pins
- Prefer project-scoped changes; no drive-by refactors outside the issue
