# Feature handoffs

Per-feature (or per-workstream) handover docs — **not** the project-wide overview in [`docs/handover/`](../handover/README.md).

Each meaningful slice of work gets a dated handoff on a feature branch, so the next contributor can pick up without re-deriving context.

## Branch naming

| Kind | Branch | What lands |
|------|--------|------------|
| Docs / planning stream | `docs/<topic>-handoffs` | One or more files under `docs/handoffs/` |
| Feature implementation | `feat/<issue>-<slug>` or `mvp/<issue>-<slug>` | Code **plus** an updated handoff for that issue |
| Quick spike / chore | `chore/<slug>` | Optional short `docs/handoffs/YYYY-MM-DD-<slug>.md` |

Examples: `docs/mvp-handoffs`, `feat/75-policy-versioning`, `chore/codebase-docs-consolidation`.

## File naming

```
docs/handoffs/YYYY-MM-DD-<slug>.md
```

Use the template: [`_TEMPLATE.md`](_TEMPLATE.md).

## When to write

- Starting a feature plan (MVP sub-issue or new epic slice) → create the handoff **before** large code moves
- After a mergeable chunk ships → update “What shipped” / “Open follow-ups”
- Closing an issue → handoff should say Done / residual debt

## Index

| Date | Handoff | Branch / issue | Status |
|------|---------|----------------|--------|
| 2026-07-24 | [stabilize-contracts-and-ci](2026-07-24-stabilize-contracts-and-ci.md) | `dev` / #61–#64, #73, #84 | Done |
| 2026-07-24 | [mvp-continuous-compliance-gate](2026-07-24-mvp-continuous-compliance-gate.md) | `dev` / #74–#81 (`v0.1.0-mvp`) | Done |
| 2026-08-21 | [pr88-regintel-connection-refactor](2026-08-21-pr88-regintel-connection-refactor.md) | `chore/regintel-init-connection` / PR #88 | Planned |
| 2026-08-21 | [copr-release-automation](2026-08-21-copr-release-automation.md) | `dev` / Fedora COPR | In progress |
| 2026-08-21 | [prod-promotion-and-release](2026-08-21-prod-promotion-and-release.md) | `dev` → `main` / `v0.1.0` | Planned |
| 2026-08-21 | [webhooks-and-vector-clustering](2026-08-21-webhooks-and-vector-clustering.md) | `feat/webhooks-and-vector-clustering` | Planned |
| 2026-09-28 | [codebase-docs-consolidation](2026-09-28-codebase-docs-consolidation.md) | `chore/codebase-docs-consolidation` | Done |
