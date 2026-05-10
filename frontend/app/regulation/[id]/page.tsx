"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient, type GovernanceManifest } from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  ArrowLeft,
  Code2,
  Wrench,
  Server,
  BookOpen,
  Shield,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

const mockManifest = (id: string): GovernanceManifest => ({
  meta: {
    source_uuid: id,
    source_name: "BSP Circular 1140 — IT Risk Management",
    source_type: "government_law",
    ingested_at: "2026-05-09T03:00:00Z",
    version: "2.1",
    total_rules: 8,
  },
  buckets: {
    A1: [
      {
        id: "A1-001",
        type: "SCANNABLE",
        logic: "REGEX",
        pattern: "(?i)(AKIA|ASIA)[A-Z0-9]{16}",
        test_pass: 'config = "safe"',
        test_fail: 'key = "AKIAIOSFODNN7EXAMPLE"', // pragma: allowlist secret
        rule_name: "No AWS Access Keys",
        remediation: "Use secrets manager instead of hardcoded keys",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "A1-002",
        type: "SCANNABLE",
        logic: "REGEX",
        pattern: "-----BEGIN (RSA )?PRIVATE KEY-----",
        test_pass: 'pub = "ssh-rsa ..."',
        test_fail: "-----BEGIN RSA PRIVATE KEY-----", // pragma: allowlist secret
        rule_name: "No Private Keys in Code",
        remediation: "Store keys in a vault",
        impact_radius: "global",
        source_category: "government_law",
      },
    ],
    A2: [
      {
        id: "A2-001",
        type: "ACTIONABLE",
        verification_question:
          "Is encryption-at-rest enabled for all data stores?",
        instructions: "Verify AES-256 on all databases and object storage",
        rule_name: "Encryption at Rest",
        remediation: "Enable AES-256 encryption",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "A2-002",
        type: "ACTIONABLE",
        verification_question: "Are all API endpoints authenticated?",
        instructions: "Check JWT/OAuth2 on every public route",
        rule_name: "API Authentication",
        remediation: "Add auth middleware",
        impact_radius: "service_specific",
        source_category: "government_law",
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
    ],
    C: [
      {
        id: "C-001",
        type: "SEMANTIC_GUIDANCE",
        summary:
          "Third-party vendors handling customer data must complete an annual security questionnaire",
        rule_name: "Vendor Risk Assessment",
        impact_radius: "global",
        source_category: "government_law",
      },
      {
        id: "C-002",
        type: "SEMANTIC_GUIDANCE",
        summary:
          "Incident response plans must be tested quarterly with tabletop exercises",
        rule_name: "Quarterly IR Testing",
        impact_radius: "global",
        source_category: "government_law",
      },
    ],
  },
});

export default function RegulationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [manifest, setManifest] = useState<GovernanceManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    apiClient
      .getRegulation(id)
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch(() => {
        if (!cancelled) {
          setManifest(mockManifest(id));
          setUsingMock(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Rule Detail
            </h1>
            <p className="text-xs text-slate-400">
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
                GET /regulation/{id}
              </code>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        {/* {usingMock && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <WifiOff size={18} className="shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Backend unavailable — showing mock regulation
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Could not reach{" "}
                <code className="font-mono">GET /regulation/{"{id}"}</code>.
                Displaying fallback data for UI preview.
              </p>
            </div>
          </div>
        )} */}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : (
          manifest && (
            <>
              {/* Meta card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/30">
                    <Shield size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {manifest.meta.source_name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <StatusBadge
                        label={manifest.meta.source_type.replace(/_/g, " ")}
                        variant="info"
                      />
                      <span>v{manifest.meta.version}</span>
                      <span>•</span>
                      <span>{manifest.meta.total_rules} rules</span>
                      <span>•</span>
                      <span>
                        Ingested{" "}
                        {new Date(
                          manifest.meta.ingested_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* A1 — Scannable */}
              <RuleSection
                title="Bucket A1 — Scannable Rules"
                subtitle="Code-level, regex-enforceable"
                icon={Code2}
                color="blue"
                count={manifest.buckets.A1.length}
              >
                {manifest.buckets.A1.map((r) => (
                  <div
                    key={r.id}
                    className="space-y-1 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {r.rule_name}
                      </p>
                      <StatusBadge label={r.logic} variant="info" />
                    </div>
                    <code className="block rounded bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {r.pattern}
                    </code>
                    <p className="text-xs text-slate-400">{r.remediation}</p>
                    <div className="flex gap-2 text-[10px] text-slate-400">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        pass: {r.test_pass}
                      </span>
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        fail: {r.test_fail}
                      </span>
                      <span>{r.impact_radius.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </RuleSection>

              {/* A2 — Actionable */}
              <RuleSection
                title="Bucket A2 — Actionable Rules"
                subtitle="Requires developer action"
                icon={Wrench}
                color="amber"
                count={manifest.buckets.A2.length}
              >
                {manifest.buckets.A2.map((r) => (
                  <div
                    key={r.id}
                    className="space-y-1 border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-800"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {r.rule_name}
                    </p>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      ❓ {r.verification_question}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.instructions}
                    </p>
                    <p className="text-xs text-slate-400">{r.remediation}</p>
                  </div>
                ))}
              </RuleSection>

              {/* B — Infra */}
              <RuleSection
                title="Bucket B — Infrastructure Rules"
                subtitle="Infrastructure metadata"
                icon={Server}
                color="slate"
                count={manifest.buckets.B.length}
              >
                {manifest.buckets.B.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {r.rule_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {r.impact_radius.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {r.key}
                      </code>
                      <p className="text-[10px] text-slate-400">
                        {JSON.stringify(r.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </RuleSection>

              {/* C — Semantic */}
              <RuleSection
                title="Bucket C — Semantic Guidance"
                subtitle="Human guidance"
                icon={BookOpen}
                color="violet"
                count={manifest.buckets.C.length}
              >
                {manifest.buckets.C.map((r) => (
                  <div
                    key={r.id}
                    className="border-b border-slate-100 px-5 py-3 last:border-0 dark:border-slate-800"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {r.rule_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {r.summary}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {r.impact_radius.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </RuleSection>

              {/* Raw JSON */}
              <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <summary className="cursor-pointer px-5 py-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">
                  Raw API Response
                </summary>
                <pre className="max-h-96 overflow-auto border-t border-slate-100 px-5 py-3 font-mono text-[11px] whitespace-pre-wrap break-all text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  {JSON.stringify(manifest, null, 2)}
                </pre>
              </details>
            </>
          )
        )}
      </main>
    </div>
  );
}

/* ── Section wrapper ──────────────────────────────────── */

function RuleSection({
  title,
  subtitle,
  icon: Icon,
  color,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  count: number;
  children: React.ReactNode;
}) {
  const iconColors: Record<string, string> = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    slate: "text-slate-500",
    violet: "text-violet-500",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <Icon size={16} className={iconColors[color] ?? "text-slate-500"} />
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-slate-400">
          No rules in this bucket
        </p>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
