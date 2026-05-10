# Research: Governance Bridge API

## Unknowns & Decisions

### 1. PDF Extraction Library
- **Decision**: Use `PyMuPDF` (fitz).
- **Rationale**: Superior accuracy in multi-column layouts and preamble stripping compared to `PyPDF2`.
- **Alternatives Considered**: `pdfplumber` (slower), `PyPDF2` (less accurate on complex layouts).

### 2. Async Orchestration
- **Decision**: `FastAPI` BackgroundTasks with a state-tracking table.
- **Rationale**: Lightweight and built-in; sufficient for the hackathon phase without the overhead of Celery/Redis.
- **Alternatives Considered**: Celery (too heavy for MVP), Arq (unnecessary dependency).

### 3. LLM Orchestration
- **Decision**: LangChain (LCEL) with Gemini 3 Flash.
- **Rationale**: Provides structured output parsing (Pydantic) and easy chaining for the Comparator -> Categorizer flow.
- **Alternatives Considered**: Raw Google AI SDK (harder to manage complex prompts and parsing).

### 4. Deduplication Logic
- **Decision**: Use Tier 1 (Anchors) and Tier 3 (LLM) for MVP; defer Tier 2 (MinHash).
- **Rationale**: Simplifies initial build while providing high-quality deduplication via LLM "Grey Zone" analysis.

## Best Practices

- **Retry Logic**: Use `tenacity` library for robust exponential backoff on LLM calls.
- **Rate Limiting**: Use `slowapi` for FastAPI-native rate limit enforcement.
- **Data Models**: Use Pydantic v2 `BaseModel` for all pipeline stages to ensure strict type safety.
