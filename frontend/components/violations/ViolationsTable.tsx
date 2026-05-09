"use client";

import { useEffect, useState } from "react";
import { api, type Violation } from "@/services/api";
import StatusBadge from "@/components/ui/StatusBadge";

const severityMap = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
} as const;

const statusMap = {
  blocked: "danger",
  warned: "warning",
  approved: "success",
  pending: "processing",
} as const;

const scannerIcons: Record<string, string> = {
  Gitleaks: "🔑",
  Presidio: "👤",
  PolicyGate: "🛡️",
};

export default function ViolationsTable() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getViolations().then((v) => {
      setViolations(v);
      setLoading(false);
    });
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
                Developer
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Repository
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Scanner
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Description
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Severity
              </th>
              <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {violations.map((v) => (
              <tr
                key={v.id}
                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
              >
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(v.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700 dark:text-slate-300">
                  {v.developer}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {v.repo}
                  </code>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs">
                  {v.scanner}
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {v.description}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <StatusBadge
                    label={v.severity}
                    variant={severityMap[v.severity]}
                    dot
                  />
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <StatusBadge label={v.status} variant={statusMap[v.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
