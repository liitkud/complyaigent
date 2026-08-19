"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  apiClient,
  type ValidateResponse,
  type ValidationResult,
  type ScannableRule,
  type ActionableRule,
  type InfraRule,
  type SemanticRule,
} from "@/services/api";
import { ShieldCheck, Loader2, Send } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

const verdictVariant: Record<string, "success" | "warning" | "danger"> = {
  LOW: "success",
  MID: "warning",
  HIGH: "danger",
};

export default function ValidatePage() {
  const [codeSnippet, setCodeSnippet] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ValidateResponse | null>(
    null,
  );
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [availableRules, setAvailableRules] = useState<
    (ScannableRule | ActionableRule | InfraRule | SemanticRule)[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRules, setLoadingRules] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiClient
      .getRules()
      .then((res) => {
        const all = [
          ...res.buckets.A1,
          ...res.buckets.A2,
          ...res.buckets.B,
          ...res.buckets.C,
        ];
        setAvailableRules(all);
      })
      .catch(() => setError("Backend unavailable. Governance rules cannot be loaded."))
      .finally(() => setLoadingRules(false));
  }, []);

  const clearPoll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pollResult = useCallback((validationId: string) => {
    intervalRef.current = setInterval(async () => {
      try {
        const r = await apiClient.getValidation(validationId);
        setResult(r);
        clearPoll();
      } catch (err) {
        clearPoll();
        setError(err instanceof Error ? err.message : "Backend unavailable. Validation result cannot be loaded.");
      }
    }, 2000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeSnippet.trim() || !ruleId.trim()) return;

    setSubmitting(true);
    setResult(null);
    setSubmitResult(null);
    setError(null);
    clearPoll();

    try {
      const res = await apiClient.validate({
        code_snippet: codeSnippet,
        rule_id: ruleId,
        context: context || undefined,
      });
      setSubmitResult(res);
      pollResult(res.validation_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend unavailable. Validation was not submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Risk Validator
        </h1>
        <p className="text-xs text-slate-400">
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
            POST /validate
          </code>{" "}
          then poll{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">
            GET /validate/{"{id}"}
          </code>
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rule_id"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Select Governance Rule
              </label>
              <select
                id="rule_id"
                value={ruleId}
                onChange={(e) => setRuleId(e.target.value)}
                disabled={loadingRules}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
              >
                <option value="">-- Choose a rule --</option>
                {availableRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.rule_name} ({r.id.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="code_snippet"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Code Snippet
              </label>
              <textarea
                id="code_snippet"
                rows={8}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste the code you want to validate…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
              />
            </div>
            <div>
              <label
                htmlFor="context"
                className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Context <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="context"
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. repo name, file path"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !codeSnippet.trim() || !ruleId.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Validate
            </button>
          </div>
        </form>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300">{error}</div>}

        {/* Pending status */}
        {submitResult && !result && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/10">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Validation in progress
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                ID:{" "}
                <code className="font-mono">{submitResult.validation_id}</code>{" "}
                — polling every 2s…
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={24}
                  className={
                    result.verdict === "LOW"
                      ? "text-emerald-500"
                      : result.verdict === "MID"
                        ? "text-amber-500"
                        : "text-red-500"
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Validation Result
                  </p>
                  <p className="text-xs text-slate-400">
                    ID:{" "}
                    <code className="font-mono">{result.validation_id}</code>
                  </p>
                </div>
              </div>
              <StatusBadge
                label={result.verdict}
                variant={verdictVariant[result.verdict] ?? "neutral"}
                dot
              />
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Reasoning
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {result.reasoning}
                </p>
              </div>
              <div className="flex gap-6 text-xs text-slate-400">
                <span>
                  Activity logged: {result.activity_logged ? "✓ Yes" : "✗ No"}
                </span>
                <span>
                  Created: {new Date(result.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">
                Raw Response
              </summary>
              <pre className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}
