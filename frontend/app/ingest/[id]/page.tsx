"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { apiClient, type IngestStatus } from "@/services/api";
import { Loader2, CheckCircle2, ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";

const stageOrder = [
  "extracting",
  "comparing",
  "compacting",
  "categorizing",
  "complete",
  "failed",
] as const;

const stageLabels: Record<string, string> = {
  extracting: "Extracting text from document",
  comparing: "Comparing against existing rules",
  compacting: "Compacting & deduplicating",
  categorizing: "Categorizing into rule buckets",
  complete: "Ingestion complete",
  failed: "Ingestion failed",
};

export default function IngestStatusPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const s = await apiClient.getIngestStatus(id);
        if (cancelled) return;
        setStatus(s);
        if (
          (s.status === "complete" || s.status === "failed") &&
          intervalRef.current
        ) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Backend unavailable. Ingestion status cannot be loaded.");
        if (intervalRef.current) clearInterval(intervalRef.current);
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
  const isFailed = status?.status === "failed";

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#131313]">
      <header className="sticky top-0 z-10 border-b border-[#343434] bg-[#131313]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            aria-label="Back to policy upload"
            className="rounded-sm p-1.5 text-[#8e8e8e] transition-colors hover:bg-[#202020] hover:text-[#f1f1f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8eff]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="ops-label text-[#4d8eff]">FerretOPS / Pipeline Status</p>
            <h1 className="mt-0.5 font-[family-name:var(--font-geist-sans)] text-lg font-bold text-[#f1f1f1]">
              Document Ingestion Progress
            </h1>
            <p className="font-mono text-xs text-[#737373]">
              Task ID: {id}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-4 text-sm text-[#ffb3ad]"
          >
            {error}
          </div>
        )}

        {/* Progress bar */}
        {status && (
          <div
            role="progressbar"
            aria-valuenow={status.progress_pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Ingestion pipeline progress: ${status.current_stage}`}
            className="ops-panel p-6 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
                {status.current_stage}
              </p>
              <span className="font-mono text-sm font-bold text-[#4d8eff]">
                {status.progress_pct}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-[#202020]">
              <div
                className="h-full rounded-sm bg-[#4d8eff] transition-all duration-500 ease-out"
                style={{ width: `${status.progress_pct}%` }}
              />
            </div>
            {status.eta_seconds !== null && status.status !== "complete" && (
              <p className="mt-2 font-mono text-xs text-[#737373]">
                ~{status.eta_seconds}s remaining estimated
              </p>
            )}
          </div>
        )}

        {/* Stepper */}
        <div className="ops-panel p-6 shadow-sm">
          <h3 className="mb-4 font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
            Pipeline Stages &amp; Extraction Nodes
          </h3>
          <div className="space-y-0">
            {stageOrder.map((stage, i) => {
              if (stage === "failed") return null;
              const isDone = currentIdx > i && !isFailed;
              const isCurrent = currentIdx === i && !isFailed;
              const isFailedHere =
                isFailed && stageLabels[stage] === status?.current_stage;
              return (
                <div key={stage} className="flex items-start gap-3">
                  {/* Vertical line + icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        isFailedHere
                          ? "border-[#ff5451] bg-[#ff5451]/20 text-[#ffb3ad]"
                          : isDone
                            ? "border-[#4edea3] bg-[#4edea3]/20 text-[#4edea3]"
                            : isCurrent
                              ? "border-[#4d8eff] bg-[#4d8eff]/20 text-[#adc6ff]"
                              : "border-[#343434] bg-[#202020] text-[#737373]"
                      }`}
                    >
                      {isFailedHere ? (
                        <XCircle size={14} />
                      ) : isDone ? (
                        <CheckCircle2 size={14} />
                      ) : isCurrent ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span className="font-mono text-[10px] font-bold">
                          {i + 1}
                        </span>
                      )}
                    </div>
                    {i < stageOrder.length - 2 && (
                      <div
                        className={`h-8 w-0.5 ${
                          isDone ? "bg-[#4edea3]/60" : "bg-[#343434]"
                        }`}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pt-1">
                    <p
                      className={`text-sm font-medium ${
                        isFailedHere
                          ? "text-[#ffb3ad]"
                          : isDone
                            ? "text-[#4edea3]"
                            : isCurrent
                              ? "text-[#adc6ff]"
                              : "text-[#737373]"
                      }`}
                    >
                      {stageLabels[stage]}
                    </p>
                    {isCurrent && status?.status !== "complete" && (
                      <p className="text-xs text-[#8e8e8e]">In progress…</p>
                    )}
                    {isFailedHere && (
                      <p className="text-xs text-[#ff5451]">Failed at this stage</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete CTA */}
        {status?.status === "complete" && (
          <div className="ops-panel border-[#4edea3]/40 bg-[#4edea3]/5 p-5 flex items-center gap-4">
            <CheckCircle2
              size={24}
              className="text-[#4edea3] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
                Ingestion complete!
              </p>
              <p className="text-xs text-[#8e8e8e]">
                Rules extracted and compiled into active governance manifest.
              </p>
            </div>
            <Link
              href="/policy"
              className="rounded-sm bg-[#4edea3] px-4 py-2 text-xs font-bold text-[#08101f] transition-colors hover:bg-white shrink-0"
            >
              View In Manifest
            </Link>
          </div>
        )}

        {/* Failed CTA */}
        {isFailed && (
          <div className="ops-panel border-[#ff5451]/40 bg-[#ff5451]/5 p-5 flex items-center gap-4">
            <XCircle
              size={24}
              className="text-[#ff5451] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#ffb3ad]">
                Ingestion failed
              </p>
              <p className="truncate text-xs text-[#ff5451]">
                Last stage: {status?.current_stage ?? "unknown"}
              </p>
            </div>
            <Link
              href="/upload"
              className="rounded-sm bg-[#ff5451] px-4 py-2 text-xs font-bold text-[#08101f] transition-colors hover:bg-white shrink-0"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Raw JSON */}
        {status && (
          <details className="ops-panel overflow-hidden">
            <summary className="cursor-pointer px-5 py-3.5 font-mono text-xs text-[#8e8e8e] transition-colors hover:text-[#adc6ff]">
              Raw Status JSON
            </summary>
            <pre className="max-h-96 overflow-auto border-t border-[#343434] bg-[#121415] px-5 py-3 font-mono text-[11px] whitespace-pre-wrap break-all text-[#8e8e8e]">
              {JSON.stringify(status, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}
