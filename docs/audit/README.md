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

### 6. Unvalidated LLM-generated A1 regex (ReDoS) — ✅ Fixed (MVP #80)
Categorizer / publish / `/reg` now run `a1_regex_guard`: compile + `test_pass` /
`test_fail` + nested-quantifier / timed smoke. Rejects demote to
`C_SEMANTIC_GUIDANCE`; quarantines stay stored but are not served.

---

## CI note (2026-07-24)

Backend `py_check` is green after pinning `ruff`/`ty` and adding `[tool.ruff]` (PR #73). Prefer project-pinned tools over floating `uv tool install` latest.
