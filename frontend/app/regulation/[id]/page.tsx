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
} from "lucide-react";
import Link from "next/link";

/* Legacy preview fixture intentionally disabled in the production path.
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
*/

export default function RegulationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [manifest, setManifest] = useState<GovernanceManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    apiClient
      .getRegulation(id)
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Backend unavailable. Regulation cannot be loaded.");
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
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#131313]">
      <header className="sticky top-0 z-10 border-b border-[#343434] bg-[#131313]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/policy"
            aria-label="Back to policy dashboard"
            className="rounded-sm p-1.5 text-[#8e8e8e] transition-colors hover:bg-[#202020] hover:text-[#f1f1f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8eff]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="ops-label text-[#4d8eff]">FerretOPS / Regulation Manifest</p>
            <h1 className="mt-0.5 font-[family-name:var(--font-geist-sans)] text-lg font-bold text-[#f1f1f1]">
              Regulation Rule Detail
            </h1>
            <p className="font-mono text-xs text-[#737373]">
              ID: {id}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-4 text-sm text-[#ffb3ad]"
          >
            Backend unavailable. {error}
          </div>
        )}

        {loading ? (
          <div
            className="space-y-4"
            aria-busy="true"
            aria-label="Loading regulation details"
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-sm border border-[#343434] bg-[#191919]"
              />
            ))}
          </div>
        ) : (
          manifest && (
            <>
              {/* Meta card */}
              <div className="ops-panel p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-sm border border-[#4d8eff]/40 bg-[#4d8eff]/15 p-2.5 text-[#adc6ff]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#f1f1f1]">
                      {manifest.meta.source_name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[#737373]">
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
                    className="space-y-1.5 border-b border-[#343434] px-5 py-3.5 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#f1f1f1]">
                        {r.rule_name}
                      </p>
                      <StatusBadge label={r.logic} variant="info" />
                    </div>
                    <code className="block rounded-sm bg-[#121415] px-2.5 py-1.5 font-mono text-xs text-[#adc6ff] border border-[#2a2a2a]">
                      {r.pattern}
                    </code>
                    <p className="text-xs text-[#8e8e8e]">{r.remediation}</p>
                    <div className="flex flex-wrap gap-2 font-mono text-[10px] text-[#737373]">
                      <span className="rounded-sm bg-[#4edea3]/10 px-1.5 py-0.5 text-[#4edea3] border border-[#4edea3]/30">
                        pass: {r.test_pass}
                      </span>
                      <span className="rounded-sm bg-[#ff5451]/10 px-1.5 py-0.5 text-[#ffb3ad] border border-[#ff5451]/30">
                        fail: {r.test_fail}
                      </span>
                      <span className="self-center">{r.impact_radius.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </RuleSection>

              {/* A2 — Actionable */}
              <RuleSection
                title="Bucket A2 — Actionable Rules"
                subtitle="Requires developer/operator action"
                icon={Wrench}
                color="amber"
                count={manifest.buckets.A2.length}
              >
                {manifest.buckets.A2.map((r) => (
                  <div
                    key={r.id}
                    className="space-y-1.5 border-b border-[#343434] px-5 py-3.5 last:border-0"
                  >
                    <p className="text-sm font-medium text-[#f1f1f1]">
                      {r.rule_name}
                    </p>
                    <p className="text-xs font-medium text-[#f0c674]">
                      ❓ {r.verification_question}
                    </p>
                    <p className="text-xs text-[#c5c5c5]">
                      {r.instructions}
                    </p>
                    <p className="text-xs text-[#8e8e8e]">{r.remediation}</p>
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
                    className="flex items-center justify-between border-b border-[#343434] px-5 py-3.5 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#f1f1f1]">
                        {r.rule_name}
                      </p>
                      <p className="font-mono text-xs text-[#737373]">
                        {r.impact_radius.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <code className="text-xs font-mono text-[#adc6ff]">
                        {r.key}
                      </code>
                      <p className="font-mono text-[10px] text-[#737373]">
                        {JSON.stringify(r.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </RuleSection>

              {/* C — Semantic */}
              <RuleSection
                title="Bucket C — Semantic Guidance"
                subtitle="Human guidance & policies"
                icon={BookOpen}
                color="violet"
                count={manifest.buckets.C.length}
              >
                {manifest.buckets.C.map((r) => (
                  <div
                    key={r.id}
                    className="border-b border-[#343434] px-5 py-3.5 last:border-0"
                  >
                    <p className="text-sm font-medium text-[#f1f1f1]">
                      {r.rule_name}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#c5c5c5]">
                      {r.summary}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-[#737373]">
                      {r.impact_radius.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </RuleSection>

              {/* Raw JSON */}
              <details className="ops-panel overflow-hidden">
                <summary className="cursor-pointer px-5 py-3.5 font-mono text-xs text-[#8e8e8e] transition-colors hover:text-[#adc6ff]">
                  Raw API Response
                </summary>
                <pre className="max-h-96 overflow-auto border-t border-[#343434] bg-[#121415] px-5 py-3 font-mono text-[11px] whitespace-pre-wrap break-all text-[#8e8e8e]">
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
    blue: "text-[#adc6ff]",
    amber: "text-[#f0c674]",
    slate: "text-[#4edea3]",
    violet: "text-[#c58fff]",
  };
  return (
    <div className="ops-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#343434] bg-[#1a1e20] px-5 py-4">
        <Icon size={16} className={iconColors[color] ?? "text-[#737373]"} />
        <div>
          <h3 className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
            {title}
          </h3>
          <p className="text-[10px] text-[#8e8e8e]">{subtitle}</p>
        </div>
        <span className="ml-auto rounded-sm border border-[#343434] bg-[#202020] px-2 py-0.5 font-mono text-xs font-bold text-[#f1f1f1]">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-[#737373]">
          No rules in this bucket
        </p>
      ) : (
        <div className="divide-y divide-[#343434]">{children}</div>
      )}
    </div>
  );
}
