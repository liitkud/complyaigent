"use client";

import { useEffect, useState } from "react";
import { apiClient, type ValidationResult } from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";

const severityMap = {
  HIGH: "danger",
  MID: "warning",
  LOW: "success",
} as const;

export default function ViolationsTable() {
  const [violations, setViolations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setViolations(await apiClient.getValidations());
      } catch (e) {
        console.error("[ViolationsTable] Fetch failed:", e);
        setError("Backend unavailable. Violations cannot be loaded.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div
        className="ops-panel p-4 sm:p-6"
        aria-busy="true"
        aria-label="Loading recent compliance violations"
      >
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-sm bg-[#202020]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-6 text-sm text-[#ffb3ad]"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="ops-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#343434] px-4 py-4 sm:px-5">
        <div>
          <h3 className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
            Recent Violations
          </h3>
          <p className="ops-label mt-1 text-[#737373]">Last 24 hours</p>
        </div>
        <span className="rounded-sm border border-[#ff5451]/40 bg-[#ff5451]/10 px-2 py-1 font-mono text-[10px] text-[#ffb3ad]">
          {violations.length} found
        </span>
      </div>
      <div
        className="overflow-x-auto focus-visible:ring-1 focus-visible:ring-[#4d8eff] focus-visible:outline-none"
        tabIndex={0}
        role="region"
        aria-label="Recent violations data table, horizontally scrollable"
      >
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Recent compliance violations detected in the last 24 hours
          </caption>
          <thead className="border-b border-[#343434] bg-[#202020]">
            <tr>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]"
              >
                Validation ID
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]"
              >
                Description / Reasoning
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]"
              >
                Verdict
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]"
              >
                Logged
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#343434]">
            {violations.map((v) => (
              <tr
                key={v.validation_id}
                className="transition-colors duration-150 hover:bg-[#202020]"
              >
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-[#8e8e8e]">
                  {new Date(v.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-[#c5c5c5]">
                  <code className="text-[10px]">{v.validation_id}</code>
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-xs text-[#8e8e8e]">
                  {v.reasoning}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <StatusBadge
                    label={v.verdict}
                    variant={severityMap[v.verdict]}
                    dot
                  />
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <StatusBadge
                    label={v.activity_logged ? "Logged" : "Local Only"}
                    variant={v.activity_logged ? "success" : "neutral"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
