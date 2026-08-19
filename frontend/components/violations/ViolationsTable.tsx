"use client";

import { useEffect, useState } from "react";
import { type ValidationResult } from "@/services/api";
import { getApiBase } from "@/services/api-base.mjs";
import StatusBadge from "@/components/ui/StatusBadge";

const mockData: ValidationResult[] = [
  {
    validation_id: "val-001",
    verdict: "HIGH",
    reasoning: "AWS Access Key (AKIA...) detected in config.yaml",
    activity_logged: true,
    created_at: new Date().toISOString(),
    status: "complete",
  },
];

const severityMap = {
  HIGH: "danger",
  MID: "warning",
  LOW: "success",
} as const;

export default function ViolationsTable() {
  const [violations, setViolations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = getApiBase({
          configuredUrl: process.env.NEXT_PUBLIC_API_URL,
          isBrowser: true,
          hostname: window.location.hostname,
        });
        const res = await fetch(`${apiUrl}/validate`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setViolations(data);
      } catch (e) {
        console.error("[ViolationsTable] Fetch failed, using mock:", e);
        setViolations(mockData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Recent Violations
          </h3>
          <p className="text-xs text-slate-400">Last 24 hours</p>
        </div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {violations.length} found
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
            <tr>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Time
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Validation ID
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Description / Reasoning
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Verdict
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Logged
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {violations.map((v) => (
              <tr
                key={v.validation_id}
                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
              >
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(v.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                  <code className="text-[10px]">{v.validation_id}</code>
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
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
