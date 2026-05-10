"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api, type IngestStatus } from "@/services/api";
import { Loader2, CheckCircle2, ArrowLeft, WifiOff } from "lucide-react";
import Link from "next/link";

const stageOrder = [
  "extracting",
  "comparing",
  "compacting",
  "categorizing",
  "complete",
] as const;

const stageLabels: Record<string, string> = {
  extracting: "Extracting text from document",
  comparing: "Comparing against existing rules",
  compacting: "Compacting & deduplicating",
  categorizing: "Categorizing into rule buckets",
  complete: "Ingestion complete",
};

// Mock: simulate progressing through stages
const mockStages: IngestStatus[] = [
  {
    task_id: "",
    status: "extracting",
    progress_pct: 15,
    current_stage: "Extracting text from document",
    eta_seconds: 10,
  },
  {
    task_id: "",
    status: "comparing",
    progress_pct: 40,
    current_stage: "Comparing against existing rules",
    eta_seconds: 8,
  },
  {
    task_id: "",
    status: "compacting",
    progress_pct: 65,
    current_stage: "Compacting & deduplicating",
    eta_seconds: 5,
  },
  {
    task_id: "",
    status: "categorizing",
    progress_pct: 85,
    current_stage: "Categorizing into rule buckets",
    eta_seconds: 3,
  },
  {
    task_id: "",
    status: "complete",
    progress_pct: 100,
    current_stage: "Ingestion complete",
    eta_seconds: null,
  },
];

export default function IngestStatusPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockIdxRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let useMock = false;

    const poll = async () => {
      if (useMock) {
        // Advance through mock stages
        if (cancelled) return;
        const stage = mockStages[mockIdxRef.current];
        setStatus({ ...stage, task_id: id });
        if (stage.status === "complete" && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        mockIdxRef.current = Math.min(
          mockIdxRef.current + 1,
          mockStages.length - 1,
        );
        return;
      }
      try {
        const s = await api.getIngestStatus(id);
        if (cancelled) return;
        setStatus(s);
        if (s.status === "complete" && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch {
        if (cancelled) return;
        // Switch to mock mode on first failure
        useMock = true;
        setUsingMock(true);
        const stage = mockStages[0];
        setStatus({ ...stage, task_id: id });
        mockIdxRef.current = 1;
      }
    };
    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  const currentIdx = status ? stageOrder.indexOf(status.status) : -1;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Processing Status
            </h1>
            <p className="text-xs text-slate-400">
              Polling{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
                GET /ingest/{id}
              </code>{" "}
              every 2s
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-6">
        {usingMock && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <WifiOff size={18} className="shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Backend unavailable — simulating progress
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Could not reach{" "}
                <code className="font-mono">GET /ingest/{"{id}"}</code>.
                Displaying mock pipeline stages for UI preview.
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {/* Progress bar */}
        {status && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {status.current_stage}
              </p>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {status.progress_pct}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500 transition-all duration-500"
                style={{ width: `${status.progress_pct}%` }}
              />
            </div>
            {status.eta_seconds !== null && status.status !== "complete" && (
              <p className="mt-2 text-xs text-slate-400">
                ~{status.eta_seconds}s remaining
              </p>
            )}
          </div>
        )}

        {/* Stepper */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Pipeline Stages
          </h3>
          <div className="space-y-0">
            {stageOrder.map((stage, i) => {
              const isDone = currentIdx > i;
              const isCurrent = currentIdx === i;
              return (
                <div key={stage} className="flex items-start gap-3">
                  {/* Vertical line + icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                          : isCurrent
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2
                          size={14}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      ) : isCurrent ? (
                        <Loader2
                          size={14}
                          className="animate-spin text-blue-600 dark:text-blue-400"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          {i + 1}
                        </span>
                      )}
                    </div>
                    {i < stageOrder.length - 1 && (
                      <div
                        className={`h-8 w-0.5 ${isDone ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-slate-700"}`}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pt-1">
                    <p
                      className={`text-sm font-medium ${
                        isDone
                          ? "text-emerald-700 dark:text-emerald-400"
                          : isCurrent
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-slate-400"
                      }`}
                    >
                      {stageLabels[stage]}
                    </p>
                    {isCurrent && status?.status !== "complete" && (
                      <p className="text-xs text-slate-400">In progress…</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete CTA */}
        {status?.status === "complete" && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800 dark:bg-emerald-900/10">
            <CheckCircle2
              size={24}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Ingestion complete!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Rules are now available on the dashboard.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              View Dashboard
            </Link>
          </div>
        )}

        {/* Raw JSON */}
        {status && (
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <summary className="cursor-pointer px-5 py-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">
              Raw API Response
            </summary>
            <pre className="border-t border-slate-100 px-5 py-3 font-mono text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-400">
              {JSON.stringify(status, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}
