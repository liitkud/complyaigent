# HANDOFF — Codebase Docs & Spec Consolidation

**Status:** Done
**Branch:** `chore/codebase-docs-consolidation`
**Issue(s):** Docs hygiene & repo-local scaffolding cleanup
**Owner / next reader:** All engineers / maintainers
**Last updated:** 2026-09-28

## Bottom line

Consolidate all active specifications, architectural decisions, and governance artifacts under canonical `docs/` paths, make `docs/constitution.md` a real canonical file, decommission obsolete repo-local `.specify` spec-kit and duplicated `.agents`/`.cursor` feature-plan skills, reconcile `docs/ROADMAP.md` and onboarding/handover documentation with the finalized MVP and active post-MVP status, and eliminate hardcoded machine-specific paths.

## Current state

- Canonical project constitution now resides at `docs/constitution.md` as a real regular file (replacing the symlink to `.specify/memory/constitution.md`).
- Governance Bridge API specification and SDD artifacts consolidated under `docs/specs/001-governance-bridge-api/` with normalized relative links.
- Repo-local `.specify/` tooling and duplicated `.agents/skills/feature-plan` / `.cursor/skills/feature-plan` scaffolding decommissioned.
- `AGENTS.md`, `README.md`, `docs/handover/README.md`, `docs/mvp/README.md`, `docs/audit/README.md`, `docs/ONBOARDING.md`, and `docs/ROADMAP.md` updated with truthful links and current status.
- `docs/ROADMAP.md` reflects completed MVP baseline (`v0.1.0-mvp`) and accurately positions post-MVP items (simulator, cache, load test) and active/planned workstreams (COPR release, PR #88 reconciliation, webhooks/clustering, and production release promotion).

## What shipped

| PR / commit | Delivers |
|-------------|----------|
| `chore/codebase-docs-consolidation` | Canonical `docs/constitution.md`, SDD migration to `docs/specs/`, spec-kit decommissioning, roadmap & onboarding reconciliation |

## Hook points (files to touch)

- `docs/constitution.md` — canonical project constitution and core principles.
- `docs/specs/` — feature specifications and SDD artifacts.
- `docs/ROADMAP.md` — project milestones, status snapshot, and phase tracking.
- `docs/handoffs/` — per-feature handoff documentation.
- `AGENTS.md` — contributor and agent guidance pointing to `docs/`.

## Open follow-ups

- [ ] Rebase and merge contributor PR #88 (`chore/regintel-init-connection`).
- [ ] Complete COPR release packaging secrets configuration.
- [ ] Implement webhooks & vector clustering on `feat/webhooks-and-vector-clustering`.
- [ ] Promote `dev` to `main` for `v0.1.0` release.

## How to verify

```bash
# Verify no broken symlinks in docs:
test -f docs/constitution.md && ! test -L docs/constitution.md

# Verify specs exist under docs/specs:
ls -la docs/specs/001-governance-bridge-api/

# Verify no legacy .specify, .agents, or .cursor directories remain:
! test -d .specify && ! test -d .agents && ! test -d .cursor
```

## Done means

- [x] Canonical `docs/constitution.md` created as a regular file and referenced everywhere.
- [x] SDD and spec artifacts consolidated under `docs/specs/`.
- [x] Obsolete `.specify/`, `.agents/`, and `.cursor/` scaffolding removed.
- [x] `docs/ROADMAP.md` reconciled with code and handoffs without fictitious claims.
- [x] `AGENTS.md`, `README.md`, `docs/handover/`, `docs/mvp/`, and `docs/ONBOARDING.md` links made truthful.
- [x] Dated handoff record created and added to `docs/handoffs/README.md`.

## Follow-up: tool-agnostic contributor documentation

Removed the remaining root and frontend agent instruction files. Shared project
guidance now lives in `docs/CONTRIBUTING.md`, linked from the README. Living
documentation and the handoff template no longer require an agent, skill, or
host-specific runner. The constitution uses contributor-neutral wording, and
the secrets hook no longer excludes the removed spec-kit directory.

Validation covers documentation links, absence of tracked agent scaffolding,
whitespace, and the repository hooks for changed files. Application code and
visual branding are outside this follow-up. The branch is being submitted as a
PR against `dev`; merging and branch deletion are left to review.
