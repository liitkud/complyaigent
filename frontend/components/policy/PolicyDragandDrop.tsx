'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api, type Policy, type IngestResponse } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { Upload, FileText, Globe, Database, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function PolicyDragAndDrop() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getPolicies().then((p) => {
      setPolicies(p);
      setLoading(false);
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setIngestResult(null);
    const result = await api.ingestPolicy(file);
    setIngestResult(result);
    setPolicies((prev) => [
      {
        id: result.id,
        name: result.name,
        source: 'upload',
        framework: result.framework,
        controlsExtracted: result.controlsExtracted,
        status: result.status,
        ingestedAt: result.ingestedAt,
      },
      ...prev,
    ]);
    setUploading(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const sourceIcon = (source: string) => (source === 'upload' ? <Upload size={13} /> : <Globe size={13} />);
  const statusVariant = (s: string) => (s === 'active' ? 'success' : s === 'processing' ? 'processing' : 'danger');

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded bg-slate-100 dark:bg-slate-800" />
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Policy Repository</h3>
            <p className="text-xs text-slate-400">RegIntel ingestion via <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono dark:bg-slate-800">/ingest</code></p>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {policies.reduce((a, p) => a + p.controlsExtracted, 0)} controls extracted
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
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`mx-5 mt-4 flex w-[calc(100%-2.5rem)] cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors disabled:cursor-wait disabled:opacity-60 ${
          dragOver
            ? 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10'
            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/5'
        }`}
      >
        <Upload size={24} className={`${dragOver ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {uploading ? 'Calling /ingest...' : 'Drag & drop policy files (PDF, Markdown)'}
        </p>
        <p className="text-[10px] text-slate-400">or click to browse</p>
      </button>

      {/* Ingest result JSON panel */}
      {ingestResult && (
        <div className="mx-5 mt-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => setJsonExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
            >
              {jsonExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              /ingest response — {ingestResult.controlsExtracted} controls extracted
            </button>
            <button
              onClick={() => setIngestResult(null)}
              className="rounded p-0.5 text-emerald-400 transition-colors hover:text-emerald-600 dark:hover:text-emerald-300"
            >
              <X size={14} />
            </button>
          </div>
          {jsonExpanded && (
            <pre className="max-h-64 overflow-auto border-t border-emerald-200 px-3 py-2 font-mono text-[11px] leading-relaxed text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">
              {JSON.stringify(ingestResult, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Policy list */}
      <div className="divide-y divide-slate-100 p-5 dark:divide-slate-800">
        {policies.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">{sourceIcon(p.source)} {p.source}</span>
                  <span>•</span>
                  <span>{p.framework}</span>
                  <span>•</span>
                  <span>{p.controlsExtracted} controls</span>
                </div>
              </div>
            </div>
            <StatusBadge label={p.status} variant={statusVariant(p.status)} dot />
          </div>
        ))}
      </div>
    </div>
  );
}
