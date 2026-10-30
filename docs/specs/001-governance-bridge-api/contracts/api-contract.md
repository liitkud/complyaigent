# API Contract: Governance Bridge API

## Endpoints

### 1. Ingestion
`POST /ingest`
- **Description**: Upload a PDF or Markdown file for processing.
- **Content-Type**: `multipart/form-data`
- **Request Body**:
    - `file`: File (Binary)
- **Response** (202 Accepted):
    ```json
    {
      "task_id": "uuid",
      "status": "comparing",
      "progress_pct": 0
    }
    ```

### 2. Monitor Progress
`GET /ingest/{task_id}`
- **Description**: Poll for ingestion task status.
- **Response** (200 OK):
    ```json
    {
      "task_id": "uuid",
      "status": "comparing|compacting|categorizing|complete|failed",
      "progress_pct": 45,
      "current_stage": "Running Comparator",
      "eta_seconds": 12,
      "manifest_url": "/regulation/{id}" // Only if complete
    }
    ```

### 3. Retrieve Manifest
`GET /regulation/{id}`
- **Description**: Fetch the full governance manifest.
- **Query Params**:
    - `version=all`: Returns full version chain.
- **Response** (200 OK):
    ```json
    {
      "manifest_id": "uuid",
      "source_hash": "sha256",
      "rules": [
        {
          "id": "uuid",
          "type": "A1_SCANNABLE",
          "content": "...",
          "metadata": { "regex": "...", "test_pass": "..." }
        }
      ]
    }
    ```

### 4. Risk Validation
`POST /validate`
- **Description**: Submit offending code for LLM verification.
- **Request Body**:
    ```json
    {
      "code": "...",
      "metadata": { "rule_id": "uuid", "entropy": 0.8 }
    }
    ```
- **Response** (202 Accepted):
    ```json
    { "task_id": "uuid", "status": "processing" }
    ```

`GET /validate/{task_id}`
- **Response** (200 OK):
    ```json
    {
      "status": "complete",
      "decision": "safe|unsafe",
      "reasoning": "...",
      "remediation": "..."
    }
    ```
