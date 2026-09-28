# Data Model: Governance Bridge API

## Entities

### 1. IngestionTask
Tracks the lifecycle of a document processing job.
- `id`: UUID (Primary Key)
- `status`: Enum (`comparing`, `compacting`, `categorizing`, `complete`, `failed`)
- `progress_pct`: Integer (0-100)
- `current_stage`: String (e.g., "Running Comparator")
- `eta_seconds`: Integer
- `source_hash`: String (SHA-256)
- `previous_version_id`: UUID (Self-reference)
- `version_chain`: JSONB (List of Task IDs)
- `created_at`: DateTime
- `updated_at`: DateTime

### 2. GovernanceRule
The atomic rule unit extracted and classified by the pipeline.
- `id`: UUID (Primary Key)
- `task_id`: UUID (Foreign Key -> IngestionTask)
- `type`: Enum (`A1_SCANNABLE`, `A2_ACTIONABLE`, `B_INFRA_METADATA`, `C_SEMANTIC_GUIDANCE`)
- `impact_radius`: Enum (`code_base`, `org_wide`, `global_standard`)
- `risk_level`: Enum (`low`, `medium`, `high`)
- `source_category`: Enum (`government_law`, `org_guideline`, `org_constitution`)
- `content`: Text (Compacted mandate)
- `remediation`: Text
- `tags`: JSONB (List of strings)
- `related_rules`: JSONB (List of UUIDs)
- `rule_metadata`: JSONB (Type-specific: `regex`, `test_pass`, `test_fail`, `instructions`, `verification_question`)

### 3. ActivityLog
Non-revocable audit trail.
- `id`: UUID (Primary Key)
- `timestamp`: DateTime
- `action`: String
- `user_id`: String (Optional for hackathon)
- `details`: JSONB
- `task_id`: UUID (Optional reference)

## Relationships
- `IngestionTask` (1) --- (N) `GovernanceRule`
- `IngestionTask` (1) --- (1) `IngestionTask` (Lineage)
