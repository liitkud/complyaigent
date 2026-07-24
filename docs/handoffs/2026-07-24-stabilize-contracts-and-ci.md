# HANDOFF — Stabilize contracts & CI

**Status:** Done  
**Branch:** `dev` (merged)  
**Issue(s):** #61 #62 #63 #64 #73 #84  
**Last updated:** 2026-07-24

## Bottom line

Unblocked the repo after hackathon handoff: CLI↔API validate contract, lazy LLM clients, test schemas, Makefile typo, pinned ruff/ty CI, file-mode cleanup. Do **not** reopen these as MVP blockers.

## What shipped

| PR | Delivers |
|----|----------|
| #61 | CLI Makefile `go fmt ./...` |
| #62 | Integration test `/validate` payload schema |
| #63 | Lazy-load ChatOpenAI clients |
| #64 | CLI polls `GET /validate/{id}` after 202 |
| #73 | Pin ruff/ty + ruff config; CI green |
| #83 | MVP roadmap + project handover docs |
| #84 | Normalize file modes; drop stale `requirements.txt`; refresh `AGENTS.md` |

## Current state

- `dev` Code Check (py_check) green
- LLM clients lazy; missing keys should not crash import
- Secrets baseline: `backend/.secrets.baseline` (root symlink)

## Open follow-ups

- [ ] Still open from audit: A1 regex ReDoS gate → MVP #80
- [ ] Constitution symlink content quality (file exists; keep accurate)

## How to verify

```bash
cd backend && uv run ruff check . && uv run ruff format . --check && uv run ty check
cd ../cli && go test ./...
```

## Done means

- [x] Contract + CI fixes merged to `dev`
- [x] Documented so MVP work does not rediscover them
