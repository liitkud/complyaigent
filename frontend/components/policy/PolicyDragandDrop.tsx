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

export default function PolicyDragAndDrop({
  onIngestStart,
}: {
  onIngestStart?: (taskId: string) => void;
}) {
  const [policies, setPolicies] = useState<RegulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus | null>(null);
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api("/regulation")
      .then((p: RegulationSummary[]) => setPolicies(p))
      .catch(() => setError("Backend unavailable. Policy repository cannot be loaded."))
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
      setIngestStatus({
        task_id: taskId,
        status: "failed",
        progress_pct: 0,
        current_stage: "Backend unavailable",
        eta_seconds: null,
      });
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
      <div className="ops-panel p-4 sm:p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-sm bg-[#202020]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-6 text-sm text-[#ffb3ad]">{error}</div>;
  }

  return (
    <div className="ops-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#343434] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-[#4d8eff]" />
          <div>
            <h3 className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
              Policy Repository
            </h3>
            <p className="ops-label mt-1 text-[#737373]">
              Active regulations in manifest
            </p>
          </div>
        </div>
          <span className="font-mono text-[10px] text-[#737373]">
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
             ? "border-[#4d8eff] bg-[#4d8eff]/10"
             : "border-[#343434] hover:border-[#4d8eff]/60 hover:bg-[#202020]"
        }`}
      >
        <Upload
          size={24}
           className={`${dragOver ? "text-[#adc6ff]" : "text-[#737373]"}`}
        />
         <p className="text-sm text-[#8e8e8e]">
          {uploading
            ? "Uploading..."
            : ingestStatus &&
                ingestStatus.status !== "complete" &&
                ingestStatus.status !== "failed"
              ? `Processing: ${ingestStatus.current_stage}`
              : "Drag & drop policy files (PDF, Markdown)"}
        </p>
         <p className="font-mono text-[10px] text-[#737373]">or click to browse</p>
      </button>

      {/* Progress Stepper */}
      {ingestStatus &&
        ingestStatus.status !== "complete" &&
        ingestStatus.status !== "failed" && (
           <div className="mx-5 mt-3 space-y-2 rounded-sm border border-[#4d8eff]/40 bg-[#4d8eff]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                 <Loader2 size={14} className="animate-spin" />
                {ingestStatus.current_stage}
              </span>
                 <span className="font-mono text-xs font-medium text-[#adc6ff]">
                {ingestStatus.progress_pct}%
              </span>
            </div>
             <div className="h-1.5 w-full overflow-hidden rounded-sm bg-[#343434]">
              <div
                 className="h-full bg-[#4d8eff] transition-all duration-500"
                style={{ width: `${ingestStatus.progress_pct}%` }}
              />
            </div>
          </div>
        )}

      {/* Ingest result JSON panel */}
      {ingestStatus && ingestStatus.status === "complete" && (
         <div className="mx-5 mt-3 rounded-sm border border-[#4edea3]/40 bg-[#4edea3]/10">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => setJsonExpanded((v) => !v)}
               className="flex items-center gap-1.5 text-xs font-semibold text-[#4edea3]"
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
               aria-label="Dismiss ingestion result"
               className="rounded-sm p-0.5 text-[#4edea3] transition-colors hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          {jsonExpanded && (
             <div className="border-t border-[#4edea3]/40 px-3 py-2 text-xs text-[#4edea3]">
              Policy has been processed and is now active in the repository.
            </div>
          )}
        </div>
      )}

      {/* Ingest failed panel */}
      {ingestStatus && ingestStatus.status === "failed" && (
         <div className="mx-5 mt-3 rounded-sm border border-[#ff5451]/40 bg-[#ff5451]/10">
          <div className="flex items-center justify-between px-3 py-2">
             <span className="flex items-center gap-1.5 text-xs font-semibold text-[#ffb3ad]">
              <X size={14} />
              Ingestion failed at: {ingestStatus.current_stage}
            </span>
            <button
              onClick={() => setIngestStatus(null)}
               aria-label="Dismiss ingestion failure"
               className="rounded-sm p-0.5 text-[#ffb3ad] transition-colors hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Policy list */}
       <div className="divide-y divide-[#343434] p-4 sm:p-5">
        {policies.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
               <div className="rounded-sm border border-[#343434] bg-[#202020] p-2 text-[#8e8e8e]">
                <FileText size={16} />
              </div>
              <div>
                 <p className="text-sm font-medium text-[#c5c5c5]">
                  {p.source_name}
                </p>
                 <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#737373]">
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
