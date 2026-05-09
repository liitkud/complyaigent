# Tasks: Governance Bridge API

**Input**: Design documents from `specs/001-governance-bridge-api/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend/ project structure per implementation plan
- [ ] T002 Initialize Python project with FastAPI and Pydantic v2 dependencies in backend/requirements.txt
- [ ] T003 [P] Configure linting (flake8) and formatting (black) in backend/pyproject.toml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T004 Setup SQLModel base classes and Supabase connection in backend/app/core/db.py
- [ ] T005 [P] Implement core configuration management (env vars) in backend/app/core/config.py
- [ ] T006 [P] Configure error handling and logging in backend/app/core/logging.py
- [ ] T007 [P] Implement rate-limiting middleware in backend/app/core/rate_limit.py
- [ ] T008 Setup background task worker orchestration in backend/app/worker/tasks.py
- [ ] T009 [P] [MUST] Configure pre-push hook for secrets scanning (.pre-commit-config.yaml)
- [ ] T010 [P] [MUST] Setup integration testing framework (scripts/integration-test.sh)

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Ingesting Governance Documents (Priority: P1) 🎯 MVP

**Goal**: Support ingestion of PDF/Markdown and trigger the background processing pipeline.

**Independent Test**: POST a sample file to `/ingest` and verify receipt of a `task_id` and initial processing status.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create IngestionTask model in backend/app/models/task.py
- [ ] T012 [P] [US1] Create GovernanceRule model in backend/app/models/rule.py
- [ ] T013 [US1] Implement SHA-256 hashing utility in backend/app/core/hashing.py
- [ ] T014 [US1] Implement Text Extraction service (PyMuPDF) in backend/app/services/extractor.py
- [ ] T015 [US1] Implement Ingest endpoint (POST /ingest) in backend/app/api/ingest.py
- [ ] T016 [US1] Implement Background Pipeline orchestration (Comparator, Compactor) in backend/app/services/pipeline.py
- [ ] T017 [US1] Implement Categorizer service (Gemini 3 Flash via LangChain) in backend/app/services/categorizer.py
- [ ] T018 [US1] Add integration test for Story 1 (ingest -> check status) in backend/tests/integration/test_story1.py

**Checkpoint**: User Story 1 functional - files can be ingested and rules extracted.

---

## Phase 4: User Story 2 - Monitoring Extraction Progress (Priority: P2)

**Goal**: Provide real-time status and ETA for ingestion tasks.

**Independent Test**: Poll `GET /ingest/{task_id}` during a large upload and verify stage transitions and ETA updates.

### Implementation for User Story 2

- [ ] T019 [US2] Implement Status endpoint (GET /ingest/{task_id}) in backend/app/api/ingest.py
- [ ] T020 [US2] Implement Progress/ETA calculation logic in backend/app/services/pipeline.py
- [ ] T021 [US2] Add integration test for Story 2 (poll status -> complete) in backend/tests/integration/test_story2.py

---

## Phase 5: User Story 3 - Consuming Governance Manifest (Priority: P1) 🎯 MVP

**Goal**: Serve the final machine-readable manifest with version lineage.

**Independent Test**: Call `GET /reg` and verify JSON contains A1, A2, B, and C rules from the constitution.

### Implementation for User Story 3

- [ ] T022 [US3] Implement Manifest retrieval endpoint (GET /reg, GET /regulation/{id}) in backend/app/api/manifest.py
- [ ] T023 [US3] Implement Alias endpoint (GET /corp) in backend/app/api/manifest.py
- [ ] T024 [US3] Implement Version Lineage linking logic in backend/app/services/pipeline.py
- [ ] T025 [US3] Add integration test for Story 3 (fetch manifest -> verify buckets) in backend/tests/integration/test_story3.py

---

## Phase 6: User Story 4 - Risk Validation & CLI Integration (Priority: P2)

**Goal**: Support tiered risk enforcement and non-revocable activity logging.

**Independent Test**: Submit "Mid-risk" code to `/validate` and receive LLM-generated reasoning.

### Implementation for User Story 4

- [ ] T026 [P] [US4] Implement Risk Validation endpoints (POST /validate, GET /validate/{id}) in backend/app/api/validate.py
- [ ] T027 [US4] Implement LangChain reasoning service for risk validation in backend/app/services/validator.py
- [ ] T028 [US4] Implement Non-revocable Activity Logging in backend/app/services/logger.py
- [ ] T029 [US4] Add integration test for Story 4 (validate code -> get reasoning) in backend/tests/integration/test_story4.py

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final stabilization and documentation.

- [ ] T030 Documentation updates (quickstart.md) in specs/001-governance-bridge-api/quickstart.md
- [ ] T031 Final code cleanup and performance tuning
- [ ] T032 Run full integration test suite via scripts/integration-test.sh

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories.
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all user stories.

### Parallel Opportunities

- T003, T005, T006, T007 (Infrastructure setup)
- T009, T010 (Constitutional gates)
- T011, T012 (Model definitions)
- T026 (Endpoint skeleton)

---

## Implementation Strategy

### MVP First (User Story 1 & 3)

1. Complete Setup + Foundational.
2. Complete User Story 1 (Ingestion).
3. Complete User Story 3 (Retrieval).
4. **STOP and VALIDATE**: Test core flow from upload to manifest retrieval.

### Incremental Delivery

1. Foundation ready.
2. Add Ingestion (US1) → Test.
3. Add Monitoring (US2) → Test.
4. Add Retrieval (US3) → Test.
5. Add Risk Validation (US4) → Test.
