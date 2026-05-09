'use client';

import { useEffect, useState } from 'react';
import { api, type PipelineEvent } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { Workflow } from 'lucide-react';

const statusVariant = (s: string) =>
  s === 'success' ? 'success' : s === 'running' ? 'processing' : s === 'failed' ? 'danger' : 'warning';

export default function PipelineActivity() {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPipelineEvents().then((e) => {
      setEvents(e);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <Workflow size={16} className="text-violet-500" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pipeline Activity</h3>
          <p className="text-xs text-slate-400">Real-time event stream</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-3 px-5 py-3">
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{
              background: e.status === 'success' ? '#10b981' : e.status === 'running' ? '#8b5cf6' : e.status === 'failed' ? '#ef4444' : '#f59e0b',
              boxShadow: e.status === 'running' ? '0 0 6px rgba(139,92,246,0.5)' : undefined,
            }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{e.stage}</span>
                <StatusBadge label={e.status} variant={statusVariant(e.status)} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{e.message}</p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">
              {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
