# HANDOFF — Production Release Promotion (`dev` → `main`)

**Status:** Planned  
**Branch:** `dev` → `main`  
**Release:** `v0.1.0`  
**Owner / next reader:** Release Maintainer  
**Last updated:** 2026-08-21

## Bottom line

Promote the finalized MVP baseline and post-MVP performance features from `dev` into `main`, trigger the official production container builds on GitHub Container Registry (GHCR), and publish release `v0.1.0`.

## Current state

- `dev` contains:
  - MVP feature suite (`v0.1.0-mvp`): 4-Bucket rule compiler, Presidio PII filtering, ReDoS regex safety, structured logging, HITL dashboard, edge API proxy for Cloudflare.
  - Post-MVP issues closed: Load testing 5s SLA, RAG embedding caching, regulatory change simulator.
  - Subsystem rename to `ferretops-*`.
  - Canary CI (`canary.yml`) path filtering.
- `main` is currently sitting at pre-MVP initial scaffold.

## Hook points (files to touch)

- Git branches: `dev` and `main`.
- `.github/workflows/release.yml` — production container tagging.

## Open follow-ups

- [ ] Checkout `main` and fast-forward merge `dev` (`git checkout main && git merge --ff-only dev`).
- [ ] Push `main` to `origin/main`.
- [ ] Create official production release tag `v0.1.0` (`git tag -s v0.1.0 -m "Release v0.1.0: FerretOPS Production Release"`).
- [ ] Push tag `v0.1.0` to trigger the `Release Pipeline` workflow.
- [ ] Verify GHCR tags: `ghcr.io/liitkud/ferretops-backend:latest`, `ghcr.io/liitkud/ferretops-frontend:latest`, and GitHub Release assets for CLI binaries.

## How to verify

```bash
# Verify test suites on main before tag push:
cd backend && uv run python -m pytest
cd ../frontend && pnpm run build && pnpm test
cd ../cli && go test ./...
```

## Done means

- [ ] `main` matches `dev`.
- [ ] `v0.1.0` release published on GitHub with attached CLI binaries and latest GHCR container images.
