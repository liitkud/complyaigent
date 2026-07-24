# HANDOFF — A1 regex validation / ReDoS guard (#80)

**Status:** Planned  
**Branch:** `docs/open-issue-handoffs`  
**Issue(s):** #80  
**Last updated:** 2026-07-24

## Bottom line
Before storing or serving LLM-generated A1 regex rules, run pass/fail (or equivalent) probes and reject catastrophic/invalid patterns so the CLI cannot hang.

## Current state
- A1 rules produced in categorizer / rule publish path without a dedicated ReDoS gate (see audit §6).
- Still open from stabilize handoff follow-ups.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (pending) | |

## Hook points (files to touch)
- `backend/app/services/categorizer.py`
- Rule publish / persist path before CLI consume
- `docs/audit/README.md` §6 for prior findings

## Open follow-ups
- [ ] test_pass / test_fail (or timeout harness) for candidate regex
- [ ] Reject path does not persist/serve bad patterns
- [ ] Tests for reject path

## How to verify
```bash
cd backend && uv run pytest tests/ -k regex -v
```

## Done means
- [ ] Unsafe/invalid regex not served to CLI
- [ ] Tests for reject path
