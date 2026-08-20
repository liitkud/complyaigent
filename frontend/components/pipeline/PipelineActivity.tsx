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
      <div
        className="ops-panel p-4 sm:p-6"
        aria-busy="true"
        aria-label="Loading pipeline activity"
      >
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-sm bg-[#202020]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-6 text-sm text-[#ffb3ad]"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="ops-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#343434] px-4 py-4 sm:px-5">
        <Workflow size={16} className="text-[#4d8eff]" />
        <div>
          <h3 className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
            Pipeline Activity
          </h3>
          <p className="ops-label mt-1 text-[#737373]">Real-time event stream</p>
        </div>
      </div>
      <div className="divide-y divide-[#343434]">
        {status ? (
          <div className="flex items-start gap-3 px-5 py-3">
            <div
              aria-hidden="true"
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
                <span className="text-sm font-medium text-[#c5c5c5]">
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
              <div
                role="progressbar"
                aria-valuenow={status.progress_pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Pipeline progress: ${status.current_stage}`}
                className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-[#343434]"
              >
                <div
                  className="h-full bg-[#4d8eff] transition-all duration-500 ease-out"
                  style={{ width: `${status.progress_pct}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-[#737373]">
                Task ID: {status.task_id} • {status.progress_pct}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-sm border border-[#343434] bg-[#202020] p-3">
              <Workflow
                size={24}
                className="text-[#737373]"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-[#8e8e8e]">
              System Idle
            </p>
            <p className="text-xs text-[#737373]">
              No active ingestion pipeline
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
