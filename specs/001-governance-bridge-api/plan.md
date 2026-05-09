# Implementation Plan: Governance Bridge API

**Branch**: `001-governance-bridge-api` | **Date**: 2026-05-10 | **Spec**: [spec.md](file:///home/kaoru/complyaigent/specs/001-governance-bridge-api/spec.md)
**Input**: Feature specification for compliance pipeline ingestion and classification.

## Summary

Build a FastAPI-based compliance pipeline that ingests organizational documents (PDF/Markdown), identifies and deduplicates rules via a three-tier comparator, and classifies them into machine-readable buckets (A1, A2, B, C) using Gemini 3 Flash. Results are served as a JSON manifest with full version lineage and non-revocable activity logs.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, Pydantic v2, LangChain (for Gemini orchestration), SQLAlchemy/SQLModel, PyPDF2/python-markdown
**Storage**: Supabase (PostgreSQL + pgvector)
**Testing**: pytest (MUST: 1 integration test for core ingestion flow)
**Target Platform**: Linux/Docker
**Project Type**: Web Service (API)
**Performance Goals**: Ingestion task ID in <500ms; manifest retrieval in <200ms
**Constraints**: 5 req/30s POST rate limit; 15s CLI HITL timeout for risk validation
**Scale/Scope**: Hackathon MVP; demonstration via "Startup Constitution v1.0"

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **MUST Rules**: No secrets (pre-commit configured), integration tests (planned), feature flags (for staged pipeline stages).
- [ ] **SHOULD Rules** (if phase ≥ startup): N/A (Current Phase: hackathon).
- [ ] **COULD Rules** (if phase ≥ production): N/A (Current Phase: hackathon).

## Project Structure

### Documentation (this feature)

```text
specs/001-governance-bridge-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/             # FastAPI routes (ingest.py, manifest.py, validate.py)
│   ├── models/          # SQLModel/Pydantic schemas
│   ├── services/        # Pipeline logic (extractor, comparator, categorizer)
│   ├── core/            # Config, security, rate-limiting
│   └── worker/          # Background task processing (Celery or simple async)
├── tests/
│   ├── integration/     # End-to-end ingestion tests
│   └── unit/            # Deduplication and regex validation tests
└── main.py              # Application entry point
```

**Structure Decision**: Option 2: Web application layout (backend only for this phase).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
