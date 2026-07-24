# ComplyAIgent Audit Log

Original audit: **2026-07-19** (`dev`).  
Status update: **2026-07-24**.

This file is a **historical + status** record. Open work lives in the [MVP plan](../mvp/README.md).

---

## Findings

### 1. API contract mismatch: CLI `/validate` — ✅ Fixed
CLI now accepts HTTP 202 and polls `GET /validate/{id}` (PR #64).

### 2. Integration test payload mismatch — ✅ Fixed
Tests use `code_snippet` / `rule_id` (PR #62).

### 3. Makefile `go fmt ....` typo — ✅ Fixed
Corrected to `go fmt ./...` (PR #61).

### 4. Import-time LangChain / missing credentials — ✅ Fixed
LLM clients lazy-loaded (PR #63).

### 5. Broken `docs/constitution.md` symlink — ⚠️ Open
Symlink to `.specify/memory/constitution.md` may still be empty/missing. Fix under docs hygiene / MVP docs sync.

### 6. Unvalidated LLM-generated A1 regex (ReDoS) — ⚠️ Open (MVP P1)
Categorizer still stores/serves regex without `test_pass` / `test_fail` execution or ReDoS checks. Tracked under MVP A1 regex validation.

---

## CI note (2026-07-24)

Backend `py_check` is green after pinning `ruff`/`ty` and adding `[tool.ruff]` (PR #73). Prefer project-pinned tools over floating `uv tool install` latest.
