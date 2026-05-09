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

1. **Given** a valid `task_id`, **When** queried via `GET /ingest/{task_id}`, **Then** the system returns current stage, progress percentage, and estimated time remaining.
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
- **FR-004**: System MUST classify every identified rule into one of three buckets:
    - **A (CODE_INSPECTION)**: Machine-enforceable (Regex + Test Pass/Fail).
    - **B (INFRA_METADATA)**: Infrastructure governance (Key/Value pairs).
    - **C (SEMANTIC_GUIDANCE)**: Human-level guidance (Summary text).
- **FR-005**: For Bucket-A rules, system MUST generate `regex`, `test_pass`, and `test_fail` values.
- **FR-006**: System MUST validate all generated regex patterns using `re.compile()` before storage.
- **FR-007**: System MUST serve rules via `GET /reg` with support for filtering by bucket, source, and version.
- **FR-008**: System MUST provide `GET /corp` as a convenience alias for `GET /reg?source_category=org_constitution`.

### Key Entities

- **IngestionTask**: Tracks processing state (`task_id`, `status`, `progress_pct`, `file_hash`).
- **GovernanceRule**: The atomic rule unit (`id`, `type`, `impact_radius`, `source_category`, remediation`, plus type-specific fields like `pattern`, `key`, `summary`).
- **GovernanceManifest**: A collection of rules derived from a source document.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Initial ingestion response (`task_id`) delivered in < 500ms for files up to 10MB.
- **SC-002**: 100% of Bucket-A rules served in `/reg` must have regex patterns that compile and pass their own `test_pass` case.
- **SC-003**: Idempotent upload of a previously processed file returns existing `task_id` in < 200ms.
- **SC-004**: System successfully extracts at least 5 distinct rules from the "Startup Constitution v1.0" sample input.

## Assumptions

- **LLM Availability**: Assumes Gemini 3 Flash is available and responsive for background classification tasks.
- **Storage**: Assumes a PostgreSQL instance is available for persisting rules and task states.
- **PDF Extraction**: Assumes standard text extraction libraries can handle the provided PDF layouts.
- **Auth**: [NEEDS CLARIFICATION: Is authentication required for these endpoints, or is this an internal-only utility?]
