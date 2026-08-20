"use client";

import { useEffect, useState } from "react";
import {
  apiClient,
  type ComplianceMetrics,
  type ValidationResult,
  type RegulationSummary,
} from "@/services/api";
import MetricCard from "@/components/ui/MetricCard";
import ViolationsTable from "@/components/violations/ViolationsTable";
import HITLApprovalCard from "@/components/hitl/HITLApprovalCard";
import PolicyDragAndDrop from "@/components/policy/PolicyDragandDrop";
import PipelineActivity from "@/components/pipeline/PipelineActivity";
import {
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  FileText,
  RefreshCw,
  WifiOff,
} from "lucide-react";

function computeMetrics(
  validations: ValidationResult[],
  regulations: RegulationSummary[],
): ComplianceMetrics {
  const total = validations.length;
  const lowCount = validations.filter((v) => v.verdict === "LOW").length;
  const passRate = total > 0 ? Math.round((lowCount / total) * 1000) / 10 : 0;

  // "Today" filter
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayViolations = validations.filter(
    (v) => v.verdict === "HIGH" && v.created_at.startsWith(todayStr),
  );
  const pendingApprovals = validations.filter((v) => v.verdict === "MID");

  return {
    totalScans: total,
    passRate,
    violationsToday: todayViolations.length,
    pendingApprovals: pendingApprovals.length,
    policiesIngested: regulations.length,
    avgScanTime: "n/a",
  };
}

export default function Home() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>();

  const load = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [validations, regulations] = await Promise.all([
        apiClient.getValidations(),
        apiClient.getRegulations(),
      ]);

      setMetrics(computeMetrics(validations, regulations));
    } catch (e) {
      console.error("[FerretOPS] API unavailable:", e);
      setMetrics(null);
      setError("Backend unavailable. Dashboard data cannot be loaded.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#131313]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#343434] bg-[#131313]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div>
          <p className="ops-label text-[#4d8eff]">FerretOPS / Command Console</p>
          <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-lg font-bold text-[#f1f1f1]">
            Compliance Dashboard
          </h1>
          <p className="mt-1 text-xs text-[#8e8e8e]">
            Policy enforcement, verdicts, and operator action in one workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
            {!error && <span className="flex items-center gap-1.5 rounded-sm border border-[#4edea3]/40 bg-[#4edea3]/10 px-2 py-1 font-mono text-[10px] text-[#4edea3]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />
             System Online
           </span>}
          <button
            onClick={load}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            className="rounded-sm border border-[#343434] p-2 text-[#8e8e8e] transition-colors hover:border-[#4d8eff]/60 hover:bg-[#202020] hover:text-[#adc6ff] disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        {error && <div role="alert" className="flex items-center gap-3 rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-4">
          <WifiOff size={18} className="shrink-0 text-[#ff5451]" />
          <p className="text-sm text-[#ffb3ad]">{error}</p>
        </div>}

        {/* KPI Cards */}
        {metrics ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
            <MetricCard
              title="Total Scans"
              value={metrics.totalScans.toLocaleString()}
              icon={ScanSearch}
              variant="default"
            />
            <MetricCard
              title="Pass Rate"
              value={`${metrics.passRate}%`}
              icon={ShieldCheck}
              variant="success"
            />
            <MetricCard
              title="Violations Today"
              value={metrics.violationsToday}
              icon={AlertTriangle}
              variant="danger"
            />
            <MetricCard
              title="Pending Approvals"
              value={metrics.pendingApprovals}
              icon={UserCheck}
              variant="warning"
            />
            <MetricCard
              title="Policies Ingested"
              value={metrics.policiesIngested}
              icon={FileText}
              variant="default"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                 className="h-28 animate-pulse rounded-sm border border-[#343434] bg-[#191919]"
              />
            ))}
          </div>
        )}

        {/* Violations table */}
        <ViolationsTable />

        {/* Two-column: HITL + Pipeline */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <HITLApprovalCard />
          <PipelineActivity taskId={activeTaskId} />
        </div>

        {/* Policy Repository */}
        <PolicyDragAndDrop onIngestStart={setActiveTaskId} />
      </main>
    </div>
  );
}
