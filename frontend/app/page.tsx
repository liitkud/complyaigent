'use client';

import { useEffect, useState } from 'react';
import { api, type ComplianceMetrics } from '@/services/api';
import MetricCard from '@/components/ui/MetricCard';
import ViolationsTable from '@/components/violations/ViolationsTable';
import HITLApprovalCard from '@/components/hitl/HITLApprovalCard';
import PolicyDragAndDrop from '@/components/policy/PolicyDragandDrop';
import PipelineActivity from '@/components/pipeline/PipelineActivity';
import {
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  FileText,
  Zap,
  RefreshCw,
} from 'lucide-react';

export default function Home() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const m = await api.getMetrics();
    setMetrics(m);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Compliance Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time DevSecOps compliance monitoring</p>
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
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="space-y-6 p-6">
        {/* KPI Cards */}
        {metrics ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard title="Total Scans" value={metrics.totalScans.toLocaleString()} icon={ScanSearch} variant="default" trend={{ value: 12, label: 'vs yesterday' }} />
            <MetricCard title="Pass Rate" value={`${metrics.passRate}%`} icon={ShieldCheck} variant="success" trend={{ value: 1.3, label: 'vs last week' }} />
            <MetricCard title="Violations Today" value={metrics.violationsToday} icon={AlertTriangle} variant="danger" trend={{ value: -8, label: 'vs yesterday' }} />
            <MetricCard title="Pending Approvals" value={metrics.pendingApprovals} icon={UserCheck} variant="warning" />
            <MetricCard title="Policies Ingested" value={metrics.policiesIngested} icon={FileText} variant="default" />
            <MetricCard title="Avg Scan Time" value={metrics.avgScanTime} icon={Zap} variant="success" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {/* Violations table */}
        <ViolationsTable />

        {/* Two-column: HITL + Pipeline */}
        <div className="grid gap-6 lg:grid-cols-2">
          <HITLApprovalCard />
          <PipelineActivity />
        </div>

        {/* Policy Repository */}
        <PolicyDragAndDrop />
      </main>
    </div>
  );
}
