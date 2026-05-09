'use client';

import { useEffect, useState } from 'react';
import { api, type HITLRequest } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function HITLApprovalCard() {
  const [requests, setRequests] = useState<HITLRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    api.getHITLRequests().then((r) => {
      setRequests(r);
      setLoading(false);
    });
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActioning(id);
    if (action === "approve") await api.approveHITL(id);
    else await api.rejectHITL(id);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: action === "approve" ? "approved" : "rejected" }
          : r,
      ),
    );
    setActioning(null);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              HITL Pending Approvals
            </h3>
            <p className="text-xs text-slate-400">
              LangGraph interrupt — awaiting manager decision
            </p>
          </div>
        </div>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pending.length} pending
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {requests.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={14}
                    className={
                      r.risk === "high" ? "text-red-500" : "text-amber-500"
                    }
                  />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {r.description}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    by <strong>{r.developer}</strong>
                  </span>
                  <span>•</span>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                    {r.repo}
                  </code>
                  <span>•</span>
                  <StatusBadge
                    label={r.risk}
                    variant={r.risk === "high" ? "danger" : "warning"}
                    dot
                  />
                </div>
                <ul className="mt-2 space-y-1">
                  {r.findings.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
                    >
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAction(r.id, "approve")}
                      disabled={actioning === r.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(r.id, "reject")}
                      disabled={actioning === r.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                ) : (
                  <StatusBadge
                    label={r.status === "approved" ? "Approved" : "Rejected"}
                    variant={r.status === "approved" ? "success" : "danger"}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">
            No pending approvals
          </div>
        )}
      </div>
    </div>
  );
}
