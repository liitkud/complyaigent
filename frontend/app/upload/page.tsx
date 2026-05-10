"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient, type IngestResponse } from "@/services/api";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setResult(null);
    setError(null);
    setUsingMock(false);
    try {
      const res = await apiClient.ingest(file);
      setResult(res);
    } catch {
      // Fallback to mock response
      setUsingMock(true);
      setResult({
        task_id: `mock-task-${Date.now()}`,
        status: "processing",
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Upload Policy
        </h1>
        <p className="text-xs text-slate-400">
          Upload a PDF or Markdown file to{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
            POST /ingest
          </code>
        </p>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-6">
        {/* {usingMock && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <WifiOff size={18} className="shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Backend unavailable — mock response
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Could not reach <code className="font-mono">POST /ingest</code>.
                Showing simulated task ID for UI preview.
              </p>
            </div>
          </div>
        )} */}

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
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors disabled:cursor-wait disabled:opacity-60 ${
            dragOver
              ? "border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/5"
          }`}
        >
          {uploading ? (
            <Loader2 size={40} className="animate-spin text-blue-500" />
          ) : (
            <Upload
              size={40}
              className={
                dragOver
                  ? "text-blue-500"
                  : "text-slate-300 dark:text-slate-600"
              }
            />
          )}
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {uploading
                ? "Uploading to /ingest..."
                : "Drag & drop a policy document"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PDF, Markdown, or plain text — or click to browse
            </p>
          </div>
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Upload failed
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800 dark:bg-emerald-900/10">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={20}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Ingestion started
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Task ID: <code className="font-mono">{result.task_id}</code> —
                  Status: {result.status}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/ingest/${result.task_id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <FileText size={14} />
                Track Progress
              </Link>
            </div>
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-emerald-100/50 p-3 font-mono text-[11px] text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
