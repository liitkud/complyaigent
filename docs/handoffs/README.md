# Feature handoffs

Per-feature (or per-workstream) handover docs — **not** the project-wide overview in [`docs/handover/`](../handover/README.md).

Pattern inspired by Millia’s `docs/handoffs/` + feature branches: each meaningful slice of work gets a dated handoff on a sensible branch, so the next agent/human can pick up without re-deriving context.

## Branch naming

| Kind | Branch | What lands |
|------|--------|------------|
| Docs / planning stream | `docs/<topic>-handoffs` | One or more files under `docs/handoffs/` |
| Feature implementation | `feat/<issue>-<slug>` or `mvp/<issue>-<slug>` | Code **plus** an updated handoff for that issue |
| Quick spike | `chore/<slug>` | Optional short `docs/handoffs/YYYY-MM-DD-<slug>.md` |

Examples: `docs/mvp-handoffs`, `feat/75-policy-versioning`, `mvp/79-presidio-pii`.

## File naming

```
docs/handoffs/YYYY-MM-DD-<slug>.md
```

Use the template: [`_TEMPLATE.md`](_TEMPLATE.md).

## When to write

- Starting a feature plan (MVP sub-issue or new epic slice) → create the handoff **before** large code moves
- After a mergeable chunk ships → update “What shipped” / “Open follow-ups”
- Closing an issue → handoff should say Done / residual debt

## Skill

Agents: use project skill **`feature-plan`** (`.agents/skills/feature-plan/` and `.cursor/skills/feature-plan/`).

## Index

| Date | Handoff | Branch / issue | Status |
|------|---------|----------------|--------|
| 2026-07-24 | [stabilize-contracts-and-ci](2026-07-24-stabilize-contracts-and-ci.md) | `dev` / #61–#64, #73, #84 | Done |
| 2026-07-24 | [mvp-continuous-compliance-gate](2026-07-24-mvp-continuous-compliance-gate.md) | `docs/mvp-handoffs` / #74 | In progress |
| 2026-07-24 | [verdict-loki-push](2026-07-24-verdict-loki-push.md) | `docs/open-issue-handoffs` / #77 (#20) | Planned |
| 2026-07-24 | [e2e-live-hitl](2026-07-24-e2e-live-hitl.md) | `docs/open-issue-handoffs` / #78 | Planned |
| 2026-07-24 | [presidio-pii](2026-07-24-presidio-pii.md) | `docs/open-issue-handoffs` / #79 (#17) | Planned |
| 2026-07-24 | [a1-regex-guard](2026-07-24-a1-regex-guard.md) | `docs/open-issue-handoffs` / #80 | Planned |
| 2026-07-24 | [legacy-presidio-17](2026-07-24-legacy-presidio-17.md) | `docs/open-issue-handoffs` / #17 → #79 | Planned |
| 2026-07-24 | [legacy-loki-20](2026-07-24-legacy-loki-20.md) | `docs/open-issue-handoffs` / #20 → #77 | Planned |
| 2026-07-24 | [deferred-regulatory-simulator](2026-07-24-deferred-regulatory-simulator.md) | `docs/open-issue-handoffs` / #13 | Deferred |
| 2026-07-24 | [deferred-rag-finetune](2026-07-24-deferred-rag-finetune.md) | `docs/open-issue-handoffs` / #14 | Deferred |
| 2026-07-24 | [deferred-load-test](2026-07-24-deferred-load-test.md) | `docs/open-issue-handoffs` / #22 | Deferred |
