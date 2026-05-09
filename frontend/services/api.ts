// ── Types ──────────────────────────────────────────────

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

export interface IngestResponse {
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

// ── Mock Data ──────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  getStatus: async (): Promise<{ status: string }> => {
    await delay(300);

    return { status: "ok" };
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
        id: "v-005",
        timestamp: "2026-05-09T10:30:00Z",
        developer: "glenn",
        repo: "frontend-app",
        type: "pii",
        severity: "high",
        description: "Philippine national IDs in test fixtures",
        status: "warned",
        scanner: "Presidio",
      },
    ];
  },

  getHITLRequests: async (): Promise<HITLRequest[]> => {
    await delay(250);

    return [
      {
        id: "hitl-001",
        timestamp: "2026-05-09T14:35:00Z",
        developer: "glenn",
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

  approveHITL: async (id: string): Promise<{ success: boolean }> => {
    await delay(500);

    return { success: true };
  },

  rejectHITL: async (id: string): Promise<{ success: boolean }> => {
    await delay(500);

    return { success: true };
  },

  ingestPolicy: async (file: File): Promise<IngestResponse> => {
    const formData = new FormData();

    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/ingest`, {
        method: "POST",

        body: formData,
      });

      if (res.ok) return res.json();
    } catch {
      // Backend unavailable — fall through to mock
    }

    // Mock response when backend is not running

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
