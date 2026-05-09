<!--
Version change: [INITIAL] → 1.0.0
List of modified principles:
- Initial adoption of "The Startup Constitution"
Added sections:
- Phase Enforcement
- Core Principles (MUST, SHOULD, COULD)
- Git & Attribution
- Success Criteria
- Agent Instructions
Templates requiring updates:
- .specify/templates/plan-template.md (✅ updated)
- .specify/templates/tasks-template.md (✅ updated)
Follow-up TODOs:
- None
-->

# Complyaigent Constitution

*For building fast, staying safe, and growing without rewriting everything.*

## Phase Enforcement

Read `PROJECT_PHASE` from environment or `.phase`:

| Phase | Enforced rules |
|-------|----------------|
| `hackathon` | MUST only      |
| `startup` | MUST + SHOULD  |
| `production` | MUST + SHOULD + COULD |

Default: `hackathon`.

## Core Principles

### I. MUST Rules (block commit/push)

**1. No secrets in commits**
* **Pre‑push hook** (`.pre-commit-config.yaml`) scans for:
  * AWS keys, GitHub tokens, Slack tokens, private keys (`-----BEGIN`), database URLs with passwords, generic API keys.
* On match → ask human `override? (y/n)`. If no → exit 1.
* Runtime ≤5 seconds.

**2. One integration test per core user journey (max 3)**
* File: `./scripts/integration-test.sh` or `make integration-test`
* Starts real service (no mocking of core dependencies)
* Uses dummy/stub data
* Returns exit code 0 on success, non‑zero on failure
* Runs in <10 seconds total

**3. Unfinished code on `main` requires a feature flag**
* Flag = env var, config file, or `if` statement.
* Example: `if os.getenv("FEATURE_X") == "true":`
* No unfinished code without flag.

### II. SHOULD Rules (warn but allow)

**4. Data purpose annotation**
* Any variable storing user data (email, name, ID, location) → comment: `# purpose: why`
* Agent adds automatically.

**5. Log scrub warning**
* Before push: `grep -l "password\|token\|secret" *.log` → print warning if found.

**6. Error Visibility & Resilience**
* Errors MUST NOT go unnoticed; they should be logged and reported to the requesting system.
* Systems MUST implement internal retry loops for transient failures (e.g., LLM timeouts).

**7. README (one paragraph)**
* What the project does (1 sentence)
* How to run integration test (1 command)
* How to set up pre‑push hook (1 command)

### III. COULD Rules (optional, after MVP)

**7. Containerisation (Docker/Podman)**
* `Dockerfile` + `compose.yaml` (or `docker-compose.yaml`)
* If DNS fails → create user‑defined network manually, document it.
* Container build not required before push.

**8. Third‑party wrappers**
* Wrap SDKs (Stripe, SendGrid, etc.) behind project interface for easier replacement.

## Git & Attribution

* Force push allowed (`--force-with-lease`)
* Any author name accepted
* No immutability requirement (you may rebase, squash, amend)
* `main` is the working branch

## Success Criteria (by phase)

### Hackathon
- [ ] Secrets scanner blocks a fake key
- [ ] Integration test passes
- [ ] README exists
- [ ] Core feature works without crash

### Startup
- [ ] All MUST + SHOULD rules satisfied
- [ ] At least one integration test per user journey
- [ ] Feature flags used for in‑progress work
- [ ] No PII in logs (warning removed)

### Production
- [ ] All COULD rules satisfied
- [ ] Containerised and deployable from one command
- [ ] Data deletion path exists (if collecting user data)

## Governance

### Agent Instructions
1. Read `PROJECT_PHASE`.
2. Implement **MUST** rules first (secrets scanner, integration test, flag support).
3. Build the actual feature.
4. Add **SHOULD** rules if phase ≥ `startup`.
5. Add **COULD** rules only if time remains and MVP is stable.

*This constitution is the minimal set of constraints to prevent disaster while shipping fast. Upgrade to a full enterprise constitution when you have customers who pay.*

### Amendment Procedure
Amendments to this constitution require a version bump and an update to the Sync Impact Report. The `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
- MAJOR: Backward incompatible governance/principle removals or redefinitions.
- MINOR: New principle/section added or materially expanded guidance.
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-05-10 | **Last Amended**: 2026-05-10
