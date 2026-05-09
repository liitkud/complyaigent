# Feature Specification: Governance Bridge API

**Feature Branch**: `001-governance-bridge-api`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: "Governance Bridge API for compliance pipeline ingestion and classification."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingesting Governance Documents (Priority: P1)

As a compliance officer, I want to upload organizational documents (PDFs, markdown) so that the rules within them can be automatically extracted and classified into machine-readable buckets.

**Why this priority**: This is the core entry point for the entire pipeline. Without ingestion, no classification or serving can occur.

**Independent Test**: Can be tested by POSTing a sample markdown file to `/ingest` and receiving a `task_id` and a processing status.

**Acceptance Scenarios**:

1. **Given** a valid PDF or Markdown file, **When** uploaded to `/ingest`, **Then** a `task_id` is returned and a background processing task is started.
2. **Given** a file that has already been processed (matching SHA-256 hash), **When** uploaded to `/ingest`, **Then** the existing `task_id` is returned immediately without starting a new task.

---

### User Story 2 - Monitoring Extraction Progress (Priority: P2)

As a developer or system integrator, I want to monitor the status and progress of an ingestion task so that I can determine when the Governance Manifest is ready for consumption.

**Why this priority**: Essential for handling the asynchronous nature of LLM processing and providing feedback to users/systems.

**Independent Test**: Can be tested by polling `GET /ingest/{task_id}` and verifying the state transitions from `extracting` to `complete`.

**Acceptance Scenarios**:

1. **Given** a valid `task_id`, **When** queried via `GET /ingest/{task_id}`, **Then** the system returns current status (`comparing|compacting|categorizing|complete`), current stage (e.g., "Running Comparator (LSH similarity check)"), progress percentage, and estimated time remaining.
2. **Given** a completed task, **When** queried, **Then** the response includes a link to the generated manifest.

---

### User Story 3 - Consuming Governance Manifest (Priority: P1)

As a security engineer or CI/CD pipeline, I want to retrieve a machine-readable manifest of rules (A/B/C buckets) so that I can automatically enforce code and infrastructure standards.

**Why this priority**: This is the primary value delivery of the system—serving the actionable rules to downstream tools.

**Independent Test**: Can be tested by calling `GET /reg` and verifying the returned JSON structure contains rules categorized into Buckets A, B, and C.

**Acceptance Scenarios**:

1. **Given** processed documents, **When** calling `GET /reg`, **Then** a JSON manifest is returned grouped by rule type (A: Code, B: Infra, C: Semantic).
2. **Given** the "Startup Constitution v1.0" as input, **When** queried, **Then** the manifest contains at least 3 Bucket-A rules (with regex) and 1 Bucket-B rule (with metadata).

---

### Edge Cases

- **Invalid File Formats**: How does the system handle non-PDF/Markdown files? (Default: Reject with 400 Bad Request)
- **Malformed Regex**: What happens if the LLM generates a regex that doesn't compile? (Requirement: System MUST validate with `re.compile()` and discard failures).
- **LLM Hallucinations**: How are non-rule text sections handled? (Requirement: Filter out non-governance text).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support ingestion of PDF and Markdown files via `POST /ingest`.
- **FR-002**: System MUST calculate SHA-256 hash of the file body for idempotency checks.
- **FR-003**: System MUST trigger an asynchronous background worker for file processing.
- **FR-009**: System MUST implement an internal retry loop (max 3 attempts) for transient processing failures before marking a task as `failed`.
- **FR-004**: System MUST classify every identified rule into one of three buckets:
    - **A (CODE_INSPECTION)**: Machine-enforceable (Regex + Test Pass/Fail).
    - **B (INFRA_METADATA)**: Infrastructure governance (Key/Value pairs).
    - **C (SEMANTIC_GUIDANCE)**: Human-level guidance (Summary text).
- **FR-005**: For Bucket-A rules, system MUST generate `regex`, `test_pass`, and `test_fail` values.
- **FR-006**: System MUST validate all generated regex patterns using `re.compile()` before storage.
- **FR-007**: System MUST serve rules via `GET /reg` and `GET /regulation/{id}` (JSON format).
- **FR-014**: System MUST implement hash-based versioning: new content hash creates a new `task_id` linked to the `previous_version_id` if rule anchors match.
- **FR-008**: System MUST provide `GET /corp` as a convenience alias for `GET /reg?source_category=org_constitution`.
- **FR-010**: System MUST enforce rate limits: 5 requests per 30 seconds for all POST endpoints, and 30 requests per second for all GET endpoints.
- **FR-011**: System MUST maintain non-revocable activity logs for all ingestion and query actions, persisted indefinitely.
- **FR-012**: System MUST provide an asynchronous risk validation pipeline (`POST /validate` to submit, `GET /validate/{id}` to poll) for CLI "Mid-risk" detections.
- **FR-013**: CLI MUST implement "fail-closed" logic: if the backend is unreachable for risk validation, the commit must be blocked with a clear error message.

## Internal Pipeline: Comparator & Categorizer

The `/ingest` endpoint triggers a multi-stage background pipeline to process the document before the manifest is finalized.

### 1. Text Extraction
Extract raw text from PDF/Markdown files and strip non-printable characters to ensure a clean input for processing.

### 2. Comparator (Deduplication)
A three-tier check is performed to prevent redundant processing and maintain version lineage:
- **Tier 1 — Entity Anchor Extraction**: Uses a hybrid approach (regex seed list + dynamic LLM discovery) to identify structured identifiers (e.g., Article 5, CC6.1). Matches flag the document as a potential new version of an existing regulation.
- **Tier 2 — MinHash LSH (Deferred)**: Near-duplicate detection using MinHash with an 85-95% similarity threshold.
- **Tier 3 — Semantic LLM**: For similarity confidence between 85-95%, the LLM determines if the content is a `DUPLICATE`, `UPDATE`, or `DISTINCT` requirement.

**Outcomes**:
- `DUPLICATE`: Discard and return existing `task_id`.
- `UPDATE`: Proceed and link via `previous_version_id`.
- `DISTINCT`: Proceed as a new document.

### 3. Compactor
Strips preamble, metadata, and non-normative text (e.g., recitals in GDPR). The LLM MUST inline any necessary definitions or context from the recitals into the core requirement text to ensure it remains atomic.

### 4. Categorizer LLM
Classifies every compacted rule into one of four buckets:
- **A1 (SCANNABLE)**: Machine-scannable. Generates regex + test_pass/test_fail pairs.
- **A2 (ACTIONABLE)**: Requires developer action. Generates a structured checklist (instructions + verification question) for human confirmation.
- **B (INFRA_METADATA)**: Infrastructure governance (Key/Value pairs).
- **C (SEMANTIC_GUIDANCE)**: High-level guidance summary for future AI consumption.

### 5. Embedding (Roadmap)
Chunking and storing embeddings for semantic retrieval (Post-hackathon).

### 6. Store Manifest
Assembles the final Governance Manifest JSON and stores it in PostgreSQL linked to the `task_id`.

### Key Entities

- **IngestionTask**: Tracks processing state (`task_id`, `status`, `progress_pct`, `source_hash`, `previous_version_id`, `version_chain`).
- **GovernanceRule**: The atomic rule unit (`id`, `type`, `impact_radius` [code_base, org_wide, global_standard], `risk_level` [high, medium, low], `source_category`, `remediation`, `tags`, `related_rules`, plus type-specific fields like `pattern`, `key`, `summary`).
- **GovernanceManifest**: A collection of rules derived from a source document, linked via content hash.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Initial ingestion response (`task_id`) delivered in < 500ms; `eta_seconds` in progress response MUST be calculated based on per-stage averages.
- **SC-002**: 100% of Bucket-A rules served in `/reg` must have regex patterns that compile and pass their own `test_pass` case.
- **SC-003**: Idempotent upload of a previously processed file returns existing `task_id` in < 200ms.
- **SC-004**: System successfully extracts and categorizes at least 4 distinct rules from the "Startup Constitution v1.0" sample input, covering all mandatory buckets: A1 (regex), A2 (verification), B (infra metadata), and C (semantic guidance).

## Clarifications

### Session 2026-05-10
- Q: Is authentication required for these endpoints, or is this an internal-only utility? → A: Unauthenticated (Internal trust only for Hackathon; Auth deferred to MVP/Prod).
- Q: How should the system report background worker failures via `GET /ingest/{task_id}`? → A: Explicit `failed` status with a `reason` field, preceded by an internal backend retry loop.
- Q: What are the allowed values and meanings for `impact_radius`? → A: Scoped tiers (`code_base`, `org_wide`, `global_standard`) with an optional `risk_level` (high/medium/low).
- Q: Should the API implement rate limiting on endpoints? → A: Yes. POST (5 per 30s), GET (30 per 1s). Concurrency management deferred to post-Hackathon phase.
- Q: What is the data retention policy for tasks and manifests? → A: Indefinite retention for all entities (Manifests, Rules, Activity Logs) to ensure data freshness tracking.

### Session 2026-05-10-B (Refinement)
- Q: Should the API serve the manifest in YAML or JSON? → A: JSON Only (Conversion to YAML offloaded to the CLI).
- Q: How should the CLI handle Bucket A rule matches? → A: Tiered enforcement: Low (Allow), Mid (Backend/LLM validation + 15s CLI HITL), High (Strict Block).
- Q: Should the risk validation be synchronous or asynchronous? → A: Asynchronous (POST /validate -> GET /validate/{id}) with status polling; Backend accepts offending code + metadata and returns LLM reasoning.
- Q: How should the CLI behave if it cannot reach the backend for "Mid-risk" validation? → A: Fail-closed (Block commit until verified).
- Q: How should document updates and versioning be handled? → A: Hash-based lineage tracking. Same hash returns existing task; new hash creates new task linked via `previous_version_id` if anchors match. `/regulation/{id}` returns latest by default.

### Session 2026-05-10-C (Pipeline & A2)
- Q: What should the generated "verification check" for A2 rules look like? → A: Structured Checklist + Question (Instructions + Yes/No prompt).
- Q: How should the Compactor handle rules relying on preamble/recital context? → A: Inline Context (LLM inlines necessary definitions into the requirement text).
- Q: Should Entity Anchors be statically or dynamically defined? → A: Dynamic + Seed (Hybrid approach using a seed list for known anchors and LLM discovery for document-specific ones).
- Q: How should `eta_seconds` be calculated for the asynchronous pipeline? → A: Per-Stage Average (Rule count multiplied by historical stage duration).
- Q: Should overlapping requirements from different sources be merged? → A: Link via Tagging (Separate rules, shared goal tags/related rules).

## Assumptions

- **LLM Availability**: Assumes Gemini 3 Flash is available and responsive for background classification tasks.
- **Storage**: Assumes Supabase (PostgreSQL with pgvector) is available for persisting rules, logs, and task states.
- **Data Models**: Use Pydantic for all data validation and model definitions.
- **Retention**: Data is persisted indefinitely to support future version history and freshness checks.
- **MinHash Deduplication**: Documented in pipeline but deferred to post-hackathon; MVP uses Tier 1 (Anchors) and Tier 3 (LLM) only.
- **Embedding Pipeline**: Documented in pipeline but deferred to post-hackathon.
- **PDF Extraction**: Assumes standard text extraction libraries can handle the provided PDF layouts.
- **Auth**: Unauthenticated for Hackathon phase; assumes deployment within a trusted network.
