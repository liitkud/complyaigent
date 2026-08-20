# Changelog

All notable changes to the FerretOPS (ComplyAIgent) project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.1.0-mvp] - 2026-08-20

### Continuous Compliance Gate MVP Release

#### Added
- **Core Governance Pipeline**:
  - Asynchronous PDF and Markdown policy ingestion with SHA-256 idempotency and MinHash entity anchor deduplication.
  - Multi-stage compiler classifying rules into the 4-Bucket taxonomy:
    - **Bucket A1**: Deterministic code inspection regex with smoke-tested pass/fail fixtures.
    - **Bucket A2**: Actionable human review verification gates.
    - **Bucket B**: Infrastructure configuration metadata governance.
    - **Bucket C**: High-level semantic guidance and architectural constitution directives.
  - Live governance manifest endpoints (`GET /reg`, `GET /corp`, `GET /regulation`, `GET /regulation/{id}`).
- **Pre-Push CLI Gate (`pg`)**:
  - Local pre-push hook integration evaluating A1 regex rules in <50ms with zero network latency.
  - Presidio PII shielding preventing accidental exposure of sensitive emails, credit card numbers, phone numbers, and national IDs.
  - Gitleaks entropy and secret scanning integration.
  - Fail-closed verification preventing commits from reaching remote origin if compliance checks fail or review is rejected.
- **Observability & Audit Logging**:
  - Non-repudiable structured verdict logging on every scan decision.
  - Pluggable Loki sink support for real-time compliance telemetry.
- **Performance & Backend Optimizations**:
  - High-throughput in-memory TTL caching for heavy manifest serialization (`backend/app/core/cache.py`).
  - SQLite WAL mode and SQLAlchemy connection pool tuning (`DB_POOL_SIZE = 20`, `PRAGMA busy_timeout = 30000`).
- **Frontend & Cloudflare Edge Deployment**:
  - Fullscreen Landing Page on `/` showcasing the continuous compliance loop, 4-bucket taxonomy, terminal demo, and FAQ.
  - Operations Command Console on `/dashboard` with KPI cards, violations table, live Human-in-the-Loop review card, and pipeline activity monitor.
  - Dedicated Policy Dashboard on `/policy` with manifest inspector and bucket browser.
  - Edge API proxy catch-all route (`frontend/app/api/[...path]/route.ts`) with schema-compliant fallback for offline/edge operation on Cloudflare Workers.
  - Comprehensive OpenGraph/SEO metadata, ARIA accessibility attributes, and keyboard-navigable tables.

#### Fixed
- Resolved Next.js 404 routing on same-origin `/api/...` calls in Cloudflare Workers.
- Fixed sidebar bleed on landing page to ensure true fullscreen display.
- Guarded against ReDoS vulnerabilities by verifying compiled regexes before manifest publication.
- Resolved database locking under concurrent integration tests.
