"use client";

import { apiClient, type ValidationResult } from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function HITLApprovalCard() {
  const [requests, setRequests] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getValidations();
        setRequests(
          data.filter((r) => r.verdict === "MID" && r.status === "pending"),
        );
      } catch (e) {
        console.error("[HITLApprovalCard] Fetch failed:", e);
        setError("Backend unavailable. Pending approvals cannot be loaded.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActioning(id);
    try {
      if (action === "approve") {
        await apiClient.approveHITL(id);
      } else {
        await apiClient.rejectHITL(id);
      }
      setRequests((prev) => prev.filter((r) => r.validation_id !== id));
    } catch (err) {
      console.error("HITL action failed", err);
      alert(`Failed to ${action}: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="ops-panel p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-sm bg-[#202020]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-6 text-sm text-[#ffb3ad]">{error}</div>;
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="ops-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#343434] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#adc6ff]" />
          <div>
            <h3 className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
              HITL Pending Approvals
            </h3>
            <p className="ops-label mt-1 text-[#737373]">
              LangGraph interrupt — awaiting manager decision
            </p>
          </div>
        </div>
        {pending.length > 0 && (
          <span className="rounded-sm border border-[#adc6ff]/40 bg-[#adc6ff]/10 px-2 py-1 font-mono text-[10px] text-[#adc6ff]">
            {pending.length} pending
          </span>
        )}
      </div>
      <div className="divide-y divide-[#343434]">
        {requests.map((r) => (
          <div key={r.validation_id} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#adc6ff]" />
                  <span className="text-sm font-medium text-[#f1f1f1]">
                    {r.reasoning}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#737373]">
                  <span>
                    ID: <strong>{r.validation_id}</strong>
                  </span>
                  <span>•</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <StatusBadge
                    label="Awaiting Approval"
                    variant="warning"
                    dot
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleAction(r.validation_id, "approve")}
                  disabled={actioning === r.validation_id}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[#4edea3]/60 bg-[#4edea3]/10 px-3 py-1.5 text-xs font-medium text-[#4edea3] transition-colors hover:bg-[#4edea3]/20 disabled:opacity-50"
                >
                  <CheckCircle size={13} /> Approve
                </button>
                <button
                  onClick={() => handleAction(r.validation_id, "reject")}
                  disabled={actioning === r.validation_id}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[#ff5451]/60 bg-[#ff5451]/10 px-3 py-1.5 text-xs font-medium text-[#ffb3ad] transition-colors hover:bg-[#ff5451]/20 disabled:opacity-50"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="p-8 text-center text-sm text-[#737373]">
            No pending approvals
          </div>
        )}
      </div>
    </div>
  );
}
