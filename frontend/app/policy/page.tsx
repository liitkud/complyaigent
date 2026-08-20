"use client";

import { useEffect, useState } from "react";
import {
  apiClient,
  type GovernanceManifest,
  type RegulationSummary,
} from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Code2,
  Wrench,
  Server,
  BookOpen,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
/* Legacy preview fixtures are intentionally disabled in the production path.

const mockManifest: GovernanceManifest = {
  meta: {
    source_uuid: "mock-uuid-001",
    source_name: "All Active Regulations",
    source_type: "aggregated",
    ingested_at: "2026-05-09T14:00:00Z",
    version: "1.0",
    total_rules: 12,
  },
  buckets: {
    A1: [
      {
        id: "A1-001",
        type: "SCANNABLE",
        logic: "REGEX",
        pattern: "(?i)(AKIA|ASIA)[A-Z0-9]{16}",
        test_pass: 'config_key = "safe_value"',
        test_fail: 'aws_key = "AKIAIOSFODNN7EXAMPLE"', // pragma: allowlist secret
        rule_name: "No AWS Access Keys",
        remediation:
          "Remove hardcoded keys; use environment variables or secrets manager",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "A1-002",
        type: "SCANNABLE",
        logic: "REGEX",
        pattern: "-----BEGIN (RSA |EC )?PRIVATE KEY-----",
        test_pass: 'public_key = "ssh-rsa AAAA..."',
        test_fail: "-----BEGIN RSA PRIVATE KEY-----", // pragma: allowlist secret
        rule_name: "No Private Keys in Code",
        remediation:
          "Store private keys in a vault; never commit to repository",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "A1-003",
        type: "SCANNABLE",
        logic: "FUZZY_MATCH",
        pattern: "password\\s*=\\s*[\"'][^\"']+[\"']",
        test_pass: 'password = os.environ["DB_PASS"]',
        test_fail: 'password = "admin123"', // pragma: allowlist secret
        rule_name: "No Hardcoded Passwords",
        remediation:
          "Use environment variables or a secrets manager for credentials",
        impact_radius: "service_specific",
        source_category: "org_guideline",
      },
    ],
    A2: [
      {
        id: "A2-001",
        type: "ACTIONABLE",
        verification_question:
          "Is encryption-at-rest enabled for all data stores?",
        instructions:
          "Verify that all databases, S3 buckets, and file stores use AES-256 encryption",
        rule_name: "Encryption at Rest",
        remediation: "Enable AES-256 encryption on all data stores",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "A2-002",
        type: "ACTIONABLE",
        verification_question: "Are all API endpoints authenticated?",
        instructions:
          "Review each public endpoint to ensure JWT or OAuth2 is enforced",
        rule_name: "API Authentication Required",
        remediation: "Add authentication middleware to all API routes",
        impact_radius: "service_specific",
        source_category: "org_guideline",
      },
      {
        id: "A2-003",
        type: "ACTIONABLE",
        verification_question: "Is MFA enabled for all privileged accounts?",
        instructions: "Check IAM settings for admin, deploy, and root accounts",
        rule_name: "MFA for Privileged Access",
        remediation: "Enable TOTP or hardware key MFA on all admin accounts",
        impact_radius: "global",
        source_category: "org_constitution",
      },
    ],
    B: [
      {
        id: "B-001",
        type: "INFRA_METADATA",
        key: "tls_min_version",
        value: "1.2",
        rule_name: "Minimum TLS 1.2",
        impact_radius: "network_transport",
        source_category: "government_law",
      },
      {
        id: "B-002",
        type: "INFRA_METADATA",
        key: "log_retention_days",
        value: 90,
        rule_name: "Log Retention 90 Days",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "B-003",
        type: "INFRA_METADATA",
        key: "backup_frequency",
        value: "daily",
        rule_name: "Daily Backups",
        impact_radius: "service_specific",
        source_category: "org_guideline",
      },
    ],
    C: [
      {
        id: "C-001",
        type: "SEMANTIC_GUIDANCE",
        summary:
          "All third-party vendors handling customer data must complete an annual security questionnaire and provide SOC2 attestation",
        rule_name: "Vendor Risk Assessment",
        impact_radius: "global",
        source_category: "org_constitution",
      },
      {
        id: "C-002",
        type: "SEMANTIC_GUIDANCE",
        summary:
          "Incident response plans must be tested quarterly with tabletop exercises involving cross-functional teams",
        rule_name: "Quarterly IR Testing",
        impact_radius: "global",
        source_category: "org_guideline",
      },
      {
        id: "C-003",
        type: "SEMANTIC_GUIDANCE",
        summary:
          "Employee security awareness training must be completed annually, covering phishing, data handling, and access control best practices",
        rule_name: "Security Awareness Training",
        impact_radius: "global",
        source_category: "org_constitution",
      },
    ],
  },
};

const mockRegulations: RegulationSummary[] = [
  {
    id: "reg-001",
    source_name: "BSP Circular 1140 — IT Risk Management",
    source_type: "government_law",
    ingested_at: "2026-05-09T03:00:00Z",
    version: "2.1",
  },
  {
    id: "reg-002",
    source_name: "NPC Circular 2023-06 — Data Privacy Act IRR",
    source_type: "government_law",
    ingested_at: "2026-05-08T14:00:00Z",
    version: "1.0",
  },
  {
    id: "reg-003",
    source_name: "SOC2 Type II Controls — Internal",
    source_type: "org_guideline",
    ingested_at: "2026-05-07T09:00:00Z",
    version: "3.2",
  },
  {
    id: "reg-004",
    source_name: "Company Security Constitution",
    source_type: "org_constitution",
    ingested_at: "2026-05-06T11:00:00Z",
    version: "1.5",
  },
  {
    id: "reg-005",
    source_name: "ISO 27001 Annex A Mapping",
    source_type: "org_guideline",
    ingested_at: "2026-05-05T08:30:00Z",
    version: "2.0",
  },
];
*/

export default function DashboardPage() {
  const [manifest, setManifest] = useState<GovernanceManifest | null>(null);
  const [regulations, setRegulations] = useState<RegulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [m, r] = await Promise.all([
        apiClient.getRules(),
        apiClient.getRegulations(),
      ]);
      setManifest(m);
      setRegulations(r);
    } catch (err) {
      setManifest(null);
      setRegulations([]);
      setError(err instanceof Error ? err.message : "Backend unavailable. Policy data cannot be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setRefreshing(true);
      try {
        const [m, r] = await Promise.all([
          apiClient.getRules(),
          apiClient.getRegulations(),
        ]);
        if (cancelled) return;
        setManifest(m);
        setRegulations(r);
       } catch (err) {
         if (cancelled) return;
         setManifest(null);
         setRegulations([]);
         setError(err instanceof Error ? err.message : "Backend unavailable. Policy data cannot be loaded.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const buckets = manifest?.buckets;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Policy Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
              GET /reg
            </code>{" "}
            bucket panels +{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
              GET /regulation
            </code>{" "}
            recent list
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </header>

      <main className="space-y-6 p-6">
         {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : (
          buckets && (
            <>
              {/* Meta summary */}
              {manifest?.meta && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {manifest.meta.total_rules} total rules
                    </span>
                    <StatusBadge
                      label={`A1: ${buckets.A1.length}`}
                      variant="info"
                    />
                    <StatusBadge
                      label={`A2: ${buckets.A2.length}`}
                      variant="warning"
                    />
                    <StatusBadge
                      label={`B: ${buckets.B.length}`}
                      variant="neutral"
                    />
                    <StatusBadge
                      label={`C: ${buckets.C.length}`}
                      variant="processing"
                    />
                  </div>
                </div>
              )}

              {/* Bucket panels */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {/* A1 — Scannable / Code Rules */}
                <BucketPanel
                  title="Code Rules (A1)"
                  subtitle="Regex-enforceable"
                  icon={Code2}
                  color="blue"
                  items={buckets.A1.map((r) => ({
                    id: r.id,
                    name: r.rule_name,
                    detail: r.logic,
                    impact: r.impact_radius,
                  }))}
                />
                {/* A2 — Actionable */}
                <BucketPanel
                  title="Actionable Rules (A2)"
                  subtitle="Requires dev action"
                  icon={Wrench}
                  color="amber"
                  items={buckets.A2.map((r) => ({
                    id: r.id,
                    name: r.rule_name,
                    detail: "ACTION",
                    impact: r.impact_radius,
                  }))}
                />
                {/* B — Infra */}
                <BucketPanel
                  title="Infra Rules (B)"
                  subtitle="Infrastructure metadata"
                  icon={Server}
                  color="slate"
                  items={buckets.B.map((r) => ({
                    id: r.id,
                    name: r.rule_name,
                    detail: r.key,
                    impact: r.impact_radius,
                  }))}
                />
                {/* C — Semantic */}
                <BucketPanel
                  title="Semantic Rules (C)"
                  subtitle="Human guidance"
                  icon={BookOpen}
                  color="violet"
                  items={buckets.C.map((r) => ({
                    id: r.id,
                    name: r.rule_name,
                    detail: "GUIDANCE",
                    impact: r.impact_radius,
                  }))}
                />
              </div>
            </>
          )
        )}

        {/* Recent regulations */}
        {regulations.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <FileText size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Regulations
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {regulations.map((reg) => (
                <Link
                  key={reg.id}
                  href={`/regulation/${reg.id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {reg.source_name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <StatusBadge
                        label={reg.source_type.replace(/_/g, " ")}
                        variant={
                          reg.source_type === "government_law"
                            ? "danger"
                            : reg.source_type === "org_constitution"
                              ? "info"
                              : "neutral"
                        }
                      />
                      <span>v{reg.version}</span>
                      <span>•</span>
                      <span>
                        {new Date(reg.ingested_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-300 dark:text-slate-600"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Bucket Panel ─────────────────────────────────────── */

interface BucketItem {
  id: string;
  name: string;
  detail: string;
  impact: string;
}

const colorMap: Record<
  string,
  { border: string; bg: string; icon: string; badge: string }
> = {
  blue: {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-500",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  slate: {
    border: "border-slate-200 dark:border-slate-700",
    bg: "bg-slate-50 dark:bg-slate-800/50",
    icon: "text-slate-500",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  },
  violet: {
    border: "border-violet-200 dark:border-violet-800",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    icon: "text-violet-500",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  },
};

function BucketPanel({
  title,
  subtitle,
  icon: Icon,
  color,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  items: BucketItem[];
}) {
  const c = colorMap[color] ?? colorMap.slate;
  return (
    <div
      className={`rounded-xl border ${c.border} bg-white shadow-sm dark:bg-slate-900`}
    >
      <div className={`flex items-center gap-2 rounded-t-xl px-4 py-3 ${c.bg}`}>
        <Icon size={16} className={c.icon} />
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h4>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${c.badge}`}
        >
          {items.length}
        </span>
      </div>
      <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">
            No rules
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="px-4 py-2.5">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {item.name}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                <span className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-slate-800">
                  {item.detail}
                </span>
                <span>{item.impact.replace(/_/g, " ")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
