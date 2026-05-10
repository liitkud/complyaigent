"use client";

<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { api, type ComplianceMetrics, type ValidationResult, type RegulationSummary } from '@/services/api';
import MetricCard from '@/components/ui/MetricCard';
import ViolationsTable from '@/components/violations/ViolationsTable';
import HITLApprovalCard from '@/components/hitl/HITLApprovalCard';
import PolicyDragAndDrop from '@/components/policy/PolicyDragandDrop';
import PipelineActivity from '@/components/pipeline/PipelineActivity';
=======
import { useEffect, useState } from "react";
import {
  type ComplianceMetrics,
  type ValidationResult,
  type RegulationSummary,
} from "@/services/api";
import MetricCard from "@/components/ui/MetricCard";
import ViolationsTable from "@/components/violations/ViolationsTable";
import HITLApprovalCard from "@/components/hitl/HITLApprovalCard";
import PolicyDragAndDrop from "@/components/policy/PolicyDragandDrop";
import PipelineActivity from "@/components/pipeline/PipelineActivity";
>>>>>>> 22a47dd01e2c2de8af3adcb7591bb6ff28320edf
import {
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  FileText,
  Zap,
  RefreshCw,
  WifiOff,
<<<<<<< HEAD
} from 'lucide-react';
=======
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
    avgScanTime: "1.2s", // Not available in API — hardcoded for MVP
  };
}
>>>>>>> 22a47dd01e2c2de8af3adcb7591bb6ff28320edf

function computeMetrics(
  validations: ValidationResult[],
  regulations: RegulationSummary[],
): ComplianceMetrics {
  const total = validations.length;
  const lowCount = validations.filter((v) => v.verdict === 'LOW').length;
  const passRate = total > 0 ? Math.round((lowCount / total) * 1000) / 10 : 0;

  // "Today" filter
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayViolations = validations.filter(
    (v) => v.verdict === 'HIGH' && v.created_at.startsWith(todayStr),
  );
  const pendingApprovals = validations.filter(
    (v) => v.verdict === 'MID',
  );

  return {
    totalScans: total,
    passRate,
    violationsToday: todayViolations.length,
    pendingApprovals: pendingApprovals.length,
    policiesIngested: regulations.length,
    avgScanTime: '1.2s', // Not available in API — hardcoded for MVP
  };
}

export default function Home() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
<<<<<<< HEAD
=======
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>();
>>>>>>> 22a47dd01e2c2de8af3adcb7591bb6ff28320edf

  const load = async () => {
    setRefreshing(true);
    try {
<<<<<<< HEAD
      const [validations, regulations] = await Promise.all([
        api.getValidations(),
        api.getRegulations(),
      ]);
      setMetrics(computeMetrics(validations, regulations));
      setUsingMock(false);
    } catch {
      // If getRegulations also fails, we're fully offline — use mock fallback
      try {
        const validations = await api.getValidations(); // has its own mock
        setMetrics(computeMetrics(validations, []));
      } catch {
        setMetrics({
          totalScans: 1_247,
          passRate: 94.2,
          violationsToday: 12,
          pendingApprovals: 3,
          policiesIngested: 28,
          avgScanTime: '1.2s',
        });
      }
      setUsingMock(true);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setRefreshing(true);
      try {
        const [validations, regulations] = await Promise.all([
          api.getValidations(),
          api.getRegulations(),
        ]);
        if (cancelled) return;
        setMetrics(computeMetrics(validations, regulations));
        setUsingMock(false);
      } catch {
        if (cancelled) return;
        try {
          const validations = await api.getValidations();
          if (cancelled) return;
          setMetrics(computeMetrics(validations, []));
        } catch {
          if (cancelled) return;
          setMetrics({
            totalScans: 1_247,
            passRate: 94.2,
            violationsToday: 12,
            pendingApprovals: 3,
            policiesIngested: 28,
            avgScanTime: '1.2s',
          });
        }
        setUsingMock(true);
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };
    init();
    return () => { cancelled = true; };
=======
      // Use raw fetch to ensure we see the calls in the network tab
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [vRes, rRes] = await Promise.all([
        fetch(`${apiUrl}/validate`),
        fetch(`${apiUrl}/regulation`),
      ]);

      if (!vRes.ok || !rRes.ok) throw new Error("API responded with error");

      const validations = await vRes.json();
      const regulations = await rRes.json();

      setMetrics(computeMetrics(validations, regulations));
      setUsingMock(false);
    } catch (e) {
      console.error("[ComplyAIgent] API unreachable, using mock data:", e);
      // Fallback to hardcoded mock data for the hackathon
      setMetrics({
        totalScans: 1247,
        passRate: 94.2,
        violationsToday: 12,
        pendingApprovals: 3,
        policiesIngested: 28,
        avgScanTime: "1.2s",
      });
      setUsingMock(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
>>>>>>> 22a47dd01e2c2de8af3adcb7591bb6ff28320edf
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Compliance Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time DevSecOps compliance monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            System Online
          </span>
          <button
            onClick={load}
            disabled={refreshing}
            className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="space-y-6 p-6">
<<<<<<< HEAD
        {usingMock && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <WifiOff size={18} className="shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Backend unavailable — showing mock data</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Metrics derived from mock <code className="font-mono">GET /validate</code> + <code className="font-mono">GET /regulation</code> fallback.
              </p>
            </div>
          </div>
        )}
=======
        {/* {usingMock && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <WifiOff size={18} className="shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Backend unavailable — showing mock data
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Metrics derived from mock{" "}
                <code className="font-mono">GET /validate</code> +{" "}
                <code className="font-mono">GET /regulation</code> fallback.
              </p>
            </div>
          </div>
        )} */}
>>>>>>> 22a47dd01e2c2de8af3adcb7591bb6ff28320edf

        {/* KPI Cards */}
        {metrics ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              title="Total Scans"
              value={metrics.totalScans.toLocaleString()}
              icon={ScanSearch}
              variant="default"
              trend={{ value: 12, label: "vs yesterday" }}
            />
            <MetricCard
              title="Pass Rate"
              value={`${metrics.passRate}%`}
              icon={ShieldCheck}
              variant="success"
              trend={{ value: 1.3, label: "vs last week" }}
            />
            <MetricCard
              title="Violations Today"
              value={metrics.violationsToday}
              icon={AlertTriangle}
              variant="danger"
              trend={{ value: -8, label: "vs yesterday" }}
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
            <MetricCard
              title="Avg Scan Time"
              value={metrics.avgScanTime}
              icon={Zap}
              variant="success"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {/* Violations table */}
        <ViolationsTable />

        {/* Two-column: HITL + Pipeline */}
        <div className="grid gap-6 lg:grid-cols-2">
          <HITLApprovalCard />
          <PipelineActivity taskId={activeTaskId} />
        </div>

        {/* Policy Repository */}
        <PolicyDragAndDrop onIngestStart={setActiveTaskId} />
      </main>
    </div>
  );
}
