"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient, type IngestResponse } from "@/services/api";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const res = await apiClient.ingest(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the backend.");
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
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#131313]">
      <header className="sticky top-0 z-10 border-b border-[#343434] bg-[#131313]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div>
          <p className="ops-label text-[#4d8eff]">FerretOPS / Pipeline</p>
          <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-lg font-bold text-[#f1f1f1]">
            Upload &amp; Ingest Policy
          </h1>
          <p className="mt-1 text-xs text-[#8e8e8e]">
            Upload a statutory PDF or markdown constitution to compile into the governance manifest
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Choose policy document file to upload"
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
          aria-label="Upload policy document by dragging and dropping or clicking to browse"
          className={`flex w-full cursor-pointer flex-col items-center gap-4 rounded-sm border-2 border-dashed p-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8eff] disabled:cursor-wait disabled:opacity-60 ${
            dragOver
              ? "border-[#4d8eff] bg-[#4d8eff]/10"
              : "border-[#343434] hover:border-[#4d8eff]/60 hover:bg-[#202020]"
          }`}
        >
          {uploading ? (
            <Loader2 size={40} className="animate-spin text-[#4d8eff]" />
          ) : (
            <Upload
              size={40}
              className={
                dragOver ? "text-[#adc6ff]" : "text-[#737373]"
              }
            />
          )}
          <div>
            <p className="text-sm font-medium text-[#f1f1f1]">
              {uploading
                ? "Uploading document to ingestion pipeline..."
                : "Drag & drop a statutory policy document"}
            </p>
            <p className="mt-1 text-xs text-[#8e8e8e]">
              PDF, Markdown, or plain text — or click to browse files
            </p>
          </div>
        </button>

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-3 rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-4"
          >
            <AlertCircle size={20} className="shrink-0 text-[#ff5451]" />
            <div>
              <p className="text-sm font-medium text-[#ffb3ad]">
                Upload failed
              </p>
              <p className="text-xs text-[#ff5451]">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="ops-panel border-[#4edea3]/40 bg-[#4edea3]/5 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={20}
                className="text-[#4edea3]"
              />
              <div>
                <p className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
                  Ingestion pipeline initialized
                </p>
                <p className="font-mono text-xs text-[#8e8e8e]">
                  Task ID: <code className="text-[#adc6ff]">{result.task_id}</code> —
                  Status: <span className="text-[#4edea3]">{result.status}</span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/ingest/${result.task_id}`}
                className="inline-flex items-center gap-2 rounded-sm bg-[#4edea3] px-4 py-2 text-xs font-bold text-[#08101f] transition-colors hover:bg-white"
              >
                <FileText size={14} />
                Track Ingestion Progress
              </Link>
            </div>
            <pre className="mt-4 max-h-48 overflow-auto rounded-sm border border-[#343434] bg-[#121415] p-3 font-mono text-[11px] text-[#8e8e8e]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
