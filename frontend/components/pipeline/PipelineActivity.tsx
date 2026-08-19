"use client";

import { useEffect, useState } from "react";
import { apiClient, type IngestStatus } from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { Workflow } from "lucide-react";

export default function PipelineActivity({ taskId }: { taskId?: string }) {
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    const poll = async () => {
      try {
        const s: IngestStatus = await apiClient.getIngestStatus(taskId);
        setStatus(s);
        if (s.status !== "complete" && s.status !== "failed") {
          setTimeout(poll, 3000);
        }
      } catch (e) {
        console.error("[PipelineActivity] Fetch failed:", e);
        setError("Backend unavailable. Ingestion status cannot be loaded.");
      } finally {
        setLoading(false);
      }
    };

    poll();
  }, [taskId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300">{error}</div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <Workflow size={16} className="text-violet-500" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Pipeline Activity
          </h3>
          <p className="text-xs text-slate-400">Real-time event stream</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {status ? (
          <div className="flex items-start gap-3 px-5 py-3">
            <div
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{
                background:
                  status.status === "complete"
                    ? "#10b981"
                    : status.status === "failed"
                      ? "#ef4444"
                      : "#8b5cf6",
                boxShadow:
                  status.status !== "complete" && status.status !== "failed"
                    ? "0 0 6px rgba(139,92,246,0.5)"
                    : undefined,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {status.current_stage}
                </span>
                <StatusBadge
                  label={status.status}
                  variant={
                    status.status === "complete"
                      ? "success"
                      : status.status === "failed"
                        ? "danger"
                        : "processing"
                  }
                />
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${status.progress_pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Task ID: {status.task_id} • {status.progress_pct}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-slate-50 p-3 dark:bg-slate-800/50">
              <Workflow
                size={24}
                className="text-slate-300 dark:text-slate-600"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              System Idle
            </p>
            <p className="text-xs text-slate-400">
              No active ingestion pipeline
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
