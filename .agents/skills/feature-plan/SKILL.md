---
name: feature-plan
description: >-
  Plan and track a ComplyAIgent feature with a sensible git branch and a
  docs/handoffs dated handoff markdown. Use when starting a feature, MVP
  sub-issue, feature plan, handoff doc, or docs/*-handoffs branch — not for
  one-line typo PRs.
disable-model-invocation: false
---

# Feature plan (branch + handoff)

## Goal

Every non-trivial feature gets:

1. A **sensible branch name**
2. A **dated handoff** under `docs/handoffs/` (from the template)
3. A link to the **GitHub issue** (prefer MVP epic children under #74)

Do **not** invent a parallel docs tree. Do **not** copy skills or process from other repos; follow this repo only.

## When to invoke

- User asks to plan / start a feature, MVP workstream, or handoff
- Opening work on issues #75–#81 (or new enhancement issues)
- Creating `docs/<topic>-handoffs` or `feat|mvp/<issue>-<slug>` branches

## Branch names

| Kind | Pattern | Example |
|------|---------|---------|
| Docs / planning stream | `docs/<topic>-handoffs` | `docs/mvp-handoffs` |
| Implementation | `feat/<issue>-<slug>` or `mvp/<issue>-<slug>` | `mvp/75-policy-versioning` |
| Tiny chore | `chore/<slug>` | optional handoff |

Base branch: **`dev`**.

## Handoff file

Path: `docs/handoffs/YYYY-MM-DD-<slug>.md`  
Start from: [`docs/handoffs/_TEMPLATE.md`](../../../docs/handoffs/_TEMPLATE.md)

Required sections (keep headings even if short):

- Status / Branch / Issue(s) / Last updated
- Bottom line
- Current state
- What shipped (table)
- Hook points (files)
- Open follow-ups
- How to verify (commands)
- Done means (checkboxes)

Update the index table in [`docs/handoffs/README.md`](../../../docs/handoffs/README.md).

## Workflow

1. `git fetch && git checkout dev && git pull`
2. Create branch with the naming table above
3. Copy template → new dated handoff; fill Bottom line + Current state + Done means from the issue
4. Link issue in the handoff; comment on the issue with the handoff path + branch
5. Implement in small PRs; each mergeable chunk updates **What shipped** and **Open follow-ups**
6. Before marking the issue done: fill **How to verify**, tick **Done means**, set Status to Done
7. Open PR into `dev` (docs-only PRs are fine for `docs/*-handoffs`)

## Anti-patterns

- Single mega `docs/handover/README.md` dump for a feature (that file is project-wide only)
- Feature branch with no handoff
- Handoff that only restates the issue title
- Closing an MVP issue without verify commands

## Related docs

- Epic: https://github.com/liitkud/complyaigent/issues/74
- `docs/mvp/README.md` · `docs/ROADMAP.md` · `docs/handover/README.md`

