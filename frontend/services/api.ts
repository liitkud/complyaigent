// ── Backend API Types (from spec) ──────────────────────

// GET /health
export interface HealthResponse {
  status: "healthy";
}

// POST /ingest → response
export interface IngestResponse {
  task_id: string;
  status: "processing" | "complete";
}

// GET /ingest/{task_id}
export interface IngestStatus {
  task_id: string;
  status:
    | "extracting"
    | "comparing"
    | "compacting"
    | "categorizing"
    | "complete"
    | "failed";
  progress_pct: number;
  current_stage: string;
  eta_seconds: number | null;
}

// GET /regulation
export interface RegulationSummary {
  id: string;
  source_name: string;
  source_type: "government_law" | "org_guideline" | "org_constitution";
  ingested_at: string;
  version: string;
}

// Rule types
export interface ScannableRule {
  id: string;
  type: "SCANNABLE";
  logic: "REGEX" | "FUZZY_MATCH";
  pattern: string;
  test_pass: string;
  test_fail: string;
  rule_name: string;
  remediation: string;
  impact_radius: "global" | "service_specific" | "network_transport";
  source_category: string;
}

export interface ActionableRule {
  id: string;
  type: "ACTIONABLE";
  verification_question: string;
  instructions: string;
  rule_name: string;
  remediation: string;
  impact_radius: "global" | "service_specific" | "network_transport";
  source_category: string;
}

export interface InfraRule {
  id: string;
  type: "INFRA_METADATA";
  key: string;
  value: unknown;
  rule_name: string;
  impact_radius: "global" | "service_specific" | "network_transport";
  source_category: string;
}

export interface SemanticRule {
  id: string;
  type: "SEMANTIC_GUIDANCE";
  summary: string;
  rule_name: string;
  impact_radius: "global" | "service_specific" | "network_transport";
  source_category: string;
}

// GET /regulation/{id} or GET /reg
export interface GovernanceManifest {
  meta: {
    source_uuid: string;
    source_name: string;
    source_type: string;
    ingested_at: string;
    version: string;
    total_rules: number;
  };
  buckets: {
    A1: ScannableRule[];
    A2: ActionableRule[];
    B: InfraRule[];
    C: SemanticRule[];
  };
}

// POST /validate → request
export interface ValidateRequest {
  code_snippet: string;
  rule_id: string;
  context?: string;
}

// POST /validate → response
export interface ValidateResponse {
  validation_id: string;
  status: "pending" | "processing";
}

// GET /validate/{id}
export interface ValidationResult {
  validation_id: string;
  verdict: "LOW" | "MID" | "HIGH";
  reasoning: string;
  activity_logged: boolean;
  created_at: string;
  status: "pending" | "approved" | "rejected" | "complete";
}

// ── Legacy UI Types (used by existing components) ──────

export interface ComplianceMetrics {
  totalScans: number;
  passRate: number;
  violationsToday: number;
  pendingApprovals: number;
  policiesIngested: number;
  avgScanTime: string;
}

export interface Violation {
  id: string;
  timestamp: string;
  developer: string;
  repo: string;
  type: "secret" | "pii" | "policy";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  status: "blocked" | "warned" | "approved" | "pending";
  scanner: "Gitleaks" | "Presidio" | "PolicyGate";
}

export interface HITLRequest {
  id: string;
  timestamp: string;
  developer: string;
  repo: string;
  risk: "high" | "medium";
  description: string;
  findings: string[];
  status: "pending" | "approved" | "rejected";
}

export interface PolicyControl {
  id: string;
  title: string;
  description: string;
  framework: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface LegacyIngestResponse {
  id: string;
  name: string;
  framework: string;
  controlsExtracted: number;
  controls: PolicyControl[];
  status: "active" | "processing" | "failed";
  ingestedAt: string;
}

export interface Policy {
  id: string;
  name: string;
  source: "upload" | "scraper";
  framework: string;
  controlsExtracted: number;
  status: "active" | "processing" | "failed";
  ingestedAt: string;
}

export interface PipelineEvent {
  id: string;
  timestamp: string;
  stage: string;
  status: "success" | "running" | "failed" | "waiting";
  message: string;
}

export interface SystemHealth {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  uptime: string;
}

// ── API Wrapper ─────────────────────────────────────────
const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : "https://aigent.kuyacarlo.dev";

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  console.log(`${API_BASE}${path}`);
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};

// Legacy compatibility for the user's specific snippet request
export const api = async (path: string) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
};

// ── Helpers ────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── API Client ─────────────────────────────────────────

export const apiClient = {
  // ── Real backend endpoints ───────────────────────────

  /** GET /health */
  healthCheck: () => apiFetch<HealthResponse>("/health"),

  /** POST /ingest — upload PDF/markdown file */
  ingest: (file: File): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<IngestResponse>("/ingest", {
      method: "POST",
      body: formData,
    });
  },

  /** GET /ingest/{task_id} — poll ingestion progress */
  getIngestStatus: (taskId: string) =>
    apiFetch<IngestStatus>(`/ingest/${encodeURIComponent(taskId)}`),

  /** GET /regulation — list all ingested regulations */
  getRegulations: () => apiFetch<RegulationSummary[]>("/regulation"),

  /** GET /regulation/{id} — full manifest for one regulation */
  getRegulation: (id: string) =>
    apiFetch<GovernanceManifest>(`/regulation/${encodeURIComponent(id)}`),

  /** GET /reg — all active rules grouped by bucket */
  getRules: () => apiFetch<GovernanceManifest>("/reg"),

  /** GET /corp — org_constitution rules only */
  getCorpRules: () => apiFetch<GovernanceManifest>("/corp"),

  /** POST /validate — submit code for risk validation */
  validate: (req: ValidateRequest) =>
    apiFetch<ValidateResponse>("/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }),

  /** GET /validate/{id} — get validation result */
  getValidation: (id: string) =>
    apiFetch<ValidationResult>(`/validate/${encodeURIComponent(id)}`),

  /** GET /validate — list all validation results (with mock fallback) */
  getValidations: async (): Promise<ValidationResult[]> => {
    try {
      return await apiFetch<ValidationResult[]>("/validate");
    } catch {
      // Mock fallback — realistic scan history for dashboard
      await delay(300);
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      return [
        {
          validation_id: "val-001",
          verdict: "HIGH",
          reasoning: "AWS Access Key (AKIA...) detected in config.yaml",
          activity_logged: true,
          created_at: `${today}T14:32:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-002",
          verdict: "HIGH",
          reasoning: "Private RSA key committed to repository",
          activity_logged: true,
          created_at: `${today}T12:10:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-003",
          verdict: "MID",
          reasoning: "Encryption-at-rest not enforced for new data store",
          activity_logged: true,
          created_at: `${today}T11:55:00Z`,
          status: "pending",
        },
        {
          validation_id: "val-004",
          verdict: "HIGH",
          reasoning: "Email addresses found in debug log output",
          activity_logged: true,
          created_at: `${today}T13:45:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-005",
          verdict: "LOW",
          reasoning: "Code follows secure patterns — no violations detected",
          activity_logged: true,
          created_at: `${today}T10:00:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-006",
          verdict: "LOW",
          reasoning: "API authentication correctly enforced on all routes",
          activity_logged: true,
          created_at: `${today}T09:30:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-007",
          verdict: "MID",
          reasoning:
            "Philippine national IDs found in test fixtures — PII risk",
          activity_logged: true,
          created_at: `${today}T10:30:00Z`,
          status: "pending",
        },
        {
          validation_id: "val-008",
          verdict: "LOW",
          reasoning:
            "No hardcoded credentials — environment variables used correctly",
          activity_logged: true,
          created_at: `${today}T08:15:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-009",
          verdict: "HIGH",
          reasoning: "Database connection string contains plaintext password",
          activity_logged: true,
          created_at: `${today}T14:00:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-010",
          verdict: "LOW",
          reasoning:
            "TLS 1.2 minimum enforced — transport encryption compliant",
          activity_logged: true,
          created_at: `${today}T07:45:00Z`,
          status: "complete",
        },
        {
          validation_id: "val-011",
          verdict: "MID",
          reasoning: "New S3 bucket created without encryption policy tag",
          activity_logged: true,
          created_at: `${today}T13:50:00Z`,
          status: "pending",
        },
        {
          validation_id: "val-012",
          verdict: "LOW",
          reasoning: "Audit logging correctly configured for all admin actions",
          activity_logged: true,
          created_at: `${today}T06:30:00Z`,
          status: "complete",
        },
      ];
    }
  },

  // ── Mock / legacy endpoints (used by existing UI) ────

  getStatus: async (): Promise<{ status: string }> => {
    try {
      const h = await apiFetch<HealthResponse>("/health");
      return { status: h.status };
    } catch {
      await delay(300);
      return { status: "ok" };
    }
  },

  getMetrics: async (): Promise<ComplianceMetrics> => {
    await delay(200);
    return {
      totalScans: 1_247,
      passRate: 94.2,
      violationsToday: 12,
      pendingApprovals: 3,
      policiesIngested: 28,
      avgScanTime: "1.2s",
    };
  },

  getViolations: async (): Promise<Violation[]> => {
    await delay(300);
    return [
      {
        id: "v-001",
        timestamp: "2026-05-09T14:32:00Z",
        developer: "karlo.santos",
        repo: "payments-api",
        type: "secret",
        severity: "critical",
        description: "AWS Access Key exposed in config.yaml",
        status: "blocked",
        scanner: "Gitleaks",
      },
      {
        id: "v-002",
        timestamp: "2026-05-09T13:45:00Z",
        developer: "alfeo.nana",
        repo: "user-service",
        type: "pii",
        severity: "high",
        description: "Email addresses found in debug logs",
        status: "blocked",
        scanner: "Presidio",
      },
      {
        id: "v-003",
        timestamp: "2026-05-09T12:10:00Z",
        developer: "jepoy.cruz",
        repo: "auth-gateway",
        type: "secret",
        severity: "critical",
        description: "Private RSA key committed to repo",
        status: "blocked",
        scanner: "Gitleaks",
      },
      {
        id: "v-004",
        timestamp: "2026-05-09T11:55:00Z",
        developer: "ellah.reyes",
        repo: "ml-pipeline",
        type: "policy",
        severity: "medium",
        description: "Encryption-at-rest not enforced for data store",
        status: "pending",
        scanner: "PolicyGate",
      },
      {
        id: "v-005",
        timestamp: "2026-05-09T10:30:00Z",
        developer: "glenn.tolentino",
        repo: "frontend-app",
        type: "pii",
        severity: "high",
        description: "Philippine national IDs in test fixtures",
        status: "warned",
        scanner: "Presidio",
      },
      {
        id: "v-006",
        timestamp: "2026-05-09T09:15:00Z",
        developer: "leofer.garcia",
        repo: "docs-site",
        type: "secret",
        severity: "low",
        description: "Expired API token in example code",
        status: "approved",
        scanner: "Gitleaks",
      },
    ];
  },

  getHITLRequests: async (): Promise<HITLRequest[]> => {
    await delay(250);
    return [
      {
        id: "hitl-001",
        timestamp: "2026-05-09T14:35:00Z",
        developer: "karlo.santos",
        repo: "payments-api",
        risk: "high",
        description:
          "Push contains potential AWS credentials in environment config",
        findings: [
          "AWS_ACCESS_KEY_ID pattern detected",
          "Key appears in 2 files",
          "No .gitignore entry for config.yaml",
        ],
        status: "pending",
      },
      {
        id: "hitl-002",
        timestamp: "2026-05-09T13:50:00Z",
        developer: "ellah.reyes",
        repo: "ml-pipeline",
        risk: "medium",
        description: "New data store created without encryption policy mapping",
        findings: ["No encryption-at-rest tag", "Policy CP-7 requires AES-256"],
        status: "pending",
      },
      {
        id: "hitl-003",
        timestamp: "2026-05-09T12:20:00Z",
        developer: "jepoy.cruz",
        repo: "auth-gateway",
        risk: "high",
        description: "RSA private key detected in committed files",
        findings: [
          "PEM header detected",
          "File: keys/private.pem",
          "Key size: 2048-bit",
        ],
        status: "pending",
      },
    ];
  },

  getPolicies: async (): Promise<Policy[]> => {
    await delay(200);
    return [
      {
        id: "p-001",
        name: "SOC2 Type II Controls",
        source: "upload",
        framework: "SOC2",
        controlsExtracted: 64,
        status: "active",
        ingestedAt: "2026-05-08T09:00:00Z",
      },
      {
        id: "p-002",
        name: "GDPR Data Processing",
        source: "upload",
        framework: "GDPR",
        controlsExtracted: 42,
        status: "active",
        ingestedAt: "2026-05-07T14:30:00Z",
      },
      {
        id: "p-003",
        name: "BSP Circular 1140",
        source: "scraper",
        framework: "BSP",
        controlsExtracted: 31,
        status: "active",
        ingestedAt: "2026-05-09T03:00:00Z",
      },
      {
        id: "p-004",
        name: "ISO 27001 Annex A",
        source: "upload",
        framework: "ISO27001",
        controlsExtracted: 93,
        status: "active",
        ingestedAt: "2026-05-06T11:00:00Z",
      },
      {
        id: "p-005",
        name: "NPC Circular 2023-06",
        source: "scraper",
        framework: "NPC",
        controlsExtracted: 0,
        status: "processing",
        ingestedAt: "2026-05-09T14:00:00Z",
      },
    ];
  },

  getPipelineEvents: async (): Promise<PipelineEvent[]> => {
    await delay(150);
    return [
      {
        id: "pe-001",
        timestamp: "2026-05-09T14:35:12Z",
        stage: "PolicyGate Scan",
        status: "running",
        message: "Scanning payments-api push (3 files changed)",
      },
      {
        id: "pe-002",
        timestamp: "2026-05-09T14:34:50Z",
        stage: "Gitleaks",
        status: "success",
        message: "Secret scan complete — 1 finding",
      },
      {
        id: "pe-003",
        timestamp: "2026-05-09T14:34:45Z",
        stage: "Presidio",
        status: "success",
        message: "PII scan complete — 0 findings",
      },
      {
        id: "pe-004",
        timestamp: "2026-05-09T14:34:30Z",
        stage: "HITL Interrupt",
        status: "waiting",
        message: "Awaiting manager approval for hitl-001",
      },
      {
        id: "pe-005",
        timestamp: "2026-05-09T14:00:00Z",
        stage: "RegIntel Ingest",
        status: "running",
        message: "Processing NPC Circular 2023-06 (RAG chunking)",
      },
      {
        id: "pe-006",
        timestamp: "2026-05-09T13:55:00Z",
        stage: "LLM Normalization",
        status: "success",
        message: "Extracted 31 controls from BSP Circular 1140",
      },
    ];
  },

  getSystemHealth: async (): Promise<SystemHealth[]> => {
    await delay(100);
    return [
      {
        service: "FastAPI Backend",
        status: "healthy",
        latency: "12ms",
        uptime: "99.9%",
      },
      {
        service: "PostgreSQL",
        status: "healthy",
        latency: "3ms",
        uptime: "99.99%",
      },
      {
        service: "vLLM (Llama-3.1-70B)",
        status: "healthy",
        latency: "890ms",
        uptime: "98.5%",
      },
      {
        service: "Loki Logging",
        status: "healthy",
        latency: "8ms",
        uptime: "99.95%",
      },
      {
        service: "Grafana",
        status: "healthy",
        latency: "15ms",
        uptime: "99.9%",
      },
      {
        service: "Regulatory Scraper",
        status: "degraded",
        latency: "2.1s",
        uptime: "95.2%",
      },
    ];
  },

  approveHITL: (id: string): Promise<{ success: boolean }> =>
    apiFetch<{ success: boolean }>(`/validate/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    }),

  rejectHITL: (id: string): Promise<{ success: boolean }> =>
    apiFetch<{ success: boolean }>(`/validate/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    }),

  /** @deprecated Use api.ingest() instead — kept for PolicyDragandDrop compatibility */
  ingestPolicy: async (file: File): Promise<LegacyIngestResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/ingest`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) return res.json();
    } catch {
      // Backend unavailable — fall through to mock
    }
    // Mock fallback when backend is not running
    await delay(1500);
    return {
      id: `p-${Date.now()}`,
      name: file.name,
      framework: "Custom",
      controlsExtracted: 5,
      controls: [
        {
          id: "ctrl-1",
          title: "Access Control",
          description:
            "Enforce role-based access control (RBAC) for all production systems",
          framework: "SOC2",
          severity: "critical",
        },
        {
          id: "ctrl-2",
          title: "Data Encryption",
          description: "All data at rest must use AES-256 encryption",
          framework: "SOC2",
          severity: "high",
        },
        {
          id: "ctrl-3",
          title: "Audit Logging",
          description:
            "Maintain immutable audit logs for all privileged actions",
          framework: "SOC2",
          severity: "high",
        },
        {
          id: "ctrl-4",
          title: "Incident Response",
          description: "Incident response plan must be tested quarterly",
          framework: "SOC2",
          severity: "medium",
        },
        {
          id: "ctrl-5",
          title: "Vendor Assessment",
          description:
            "Third-party vendors must complete security questionnaire annually",
          framework: "SOC2",
          severity: "medium",
        },
      ],
      status: "active",
      ingestedAt: new Date().toISOString(),
    };
  },
};
