"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  api,
  apiFetch,
  type RegulationSummary,
  type IngestResponse,
  type IngestStatus,
} from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Upload,
  FileText,
  Globe,
  Database,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";

const mockData: RegulationSummary[] = [
  {
    id: "p-001",
    source_name: "SOC2 Type II Controls",
    source_type: "org_guideline",
    ingested_at: "2026-05-08T09:00:00Z",
    version: "1.0",
  },
];

export default function PolicyDragAndDrop({
  onIngestStart,
}: {
  onIngestStart?: (taskId: string) => void;
}) {
  const [policies, setPolicies] = useState<RegulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus | null>(null);
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api("/regulation")
      .then((p: RegulationSummary[]) => setPolicies(p))
      .catch(() => setPolicies(mockData))
      .finally(() => setLoading(false));
  }, []);

  const pollStatus = useCallback(async (taskId: string) => {
    try {
      const status: IngestStatus = await api(`/ingest/${taskId}`);
      setIngestStatus(status);
      if (status.status !== "complete" && status.status !== "failed") {
        setTimeout(() => pollStatus(taskId), 2000);
      } else if (status.status === "complete") {
        // Refresh list
        const updated = await api("/regulation");
        setPolicies(updated);
      }
    } catch (err) {
      console.error("Polling failed", err);
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setIngestStatus(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        // Use apiFetch directly for POST as the wrapper is GET only
        const res: IngestResponse = await apiFetch("/ingest", {
          method: "POST",
          body: formData,
        });
        if (onIngestStart) onIngestStart(res.task_id);
        pollStatus(res.task_id);
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    },
    [onIngestStart, pollStatus],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-500" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Policy Repository
            </h3>
            <p className="text-xs text-slate-400">
              Active regulations in manifest
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {policies.length} sources
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.md,.markdown,.txt"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drop zone */}
      <button
        type="button"
        onClick={handleBrowse}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={
          uploading ||
          (ingestStatus !== null &&
            ingestStatus.status !== "complete" &&
            ingestStatus.status !== "failed")
        }
        className={`mx-5 mt-4 flex w-[calc(100%-2.5rem)] cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors disabled:cursor-wait disabled:opacity-60 ${
          dragOver
            ? "border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/5"
        }`}
      >
        <Upload
          size={24}
          className={`${dragOver ? "text-blue-500" : "text-slate-300 dark:text-slate-600"}`}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {uploading
            ? "Uploading..."
            : ingestStatus &&
                ingestStatus.status !== "complete" &&
                ingestStatus.status !== "failed"
              ? `Processing: ${ingestStatus.current_stage}`
              : "Drag & drop policy files (PDF, Markdown)"}
        </p>
        <p className="text-[10px] text-slate-400">or click to browse</p>
      </button>

      {/* Progress Stepper */}
      {ingestStatus &&
        ingestStatus.status !== "complete" &&
        ingestStatus.status !== "failed" && (
          <div className="mx-5 mt-3 space-y-2 rounded-lg border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Loader2 size={14} className="animate-spin" />
                {ingestStatus.current_stage}
              </span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {ingestStatus.progress_pct}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${ingestStatus.progress_pct}%` }}
              />
            </div>
          </div>
        )}

      {/* Ingest result JSON panel */}
      {ingestStatus && ingestStatus.status === "complete" && (
        <div className="mx-5 mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => setJsonExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
            >
              {jsonExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              Ingestion Complete
            </button>
            <button
              onClick={() => setIngestStatus(null)}
              className="rounded p-0.5 text-emerald-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-300"
            >
              <X size={14} />
            </button>
          </div>
          {jsonExpanded && (
            <div className="border-t border-emerald-200 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">
              Policy has been processed and is now active in the repository.
            </div>
          )}
        </div>
      )}

      {/* Ingest failed panel */}
      {ingestStatus && ingestStatus.status === "failed" && (
        <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
              <X size={14} />
              Ingestion failed at: {ingestStatus.current_stage}
            </span>
            <button
              onClick={() => setIngestStatus(null)}
              className="rounded p-0.5 text-red-400 transition-colors hover:text-red-600 dark:hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Policy list */}
      <div className="divide-y divide-slate-100 p-5 dark:divide-slate-800">
        {policies.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {p.source_name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Globe size={11} /> {p.source_type}
                  </span>
                  <span>•</span>
                  <span>v{p.version}</span>
                  <span>•</span>
                  <span>
                    Ingested {new Date(p.ingested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge label="Active" variant="success" dot />
          </div>
        ))}
      </div>
    </div>
  );
}
