# Quickstart: Governance Bridge API

## 1. Environment Setup

```bash
# Clone the repository (if not done)
# Create a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlmodel langchain-google-genai pymupdf slowapi tenacity
```

## 2. Configuration

Set the following environment variables:
- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_KEY`: Your Supabase service role key.
- `DATABASE_URL`: Your Supabase PostgreSQL connection string.

## 3. Running the Server

```bash
uvicorn backend.main:app --reload
```

## 4. Test Ingestion

```bash
curl -X POST -F "file=@constitution.md" http://localhost:8000/ingest
```

Poll for status:
```bash
curl http://localhost:8000/ingest/{task_id}
```
