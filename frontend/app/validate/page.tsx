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
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#131313]">
      <header className="sticky top-0 z-10 border-b border-[#343434] bg-[#131313]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div>
          <p className="ops-label text-[#4edea3]">FerretOPS / Sandbox</p>
          <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-lg font-bold text-[#f1f1f1]">
            Risk &amp; Code Validator
          </h1>
          <p className="mt-1 text-xs text-[#8e8e8e]">
            Simulate pre-push rule evaluation against active governance manifests
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="ops-panel p-5 sm:p-6"
          aria-label="Code validation form"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rule_id"
                className="ops-label mb-1.5 block text-[#8e8e8e]"
              >
                Select Governance Rule <span className="text-[#ff5451]">*</span>
              </label>
              <select
                id="rule_id"
                value={ruleId}
                onChange={(e) => setRuleId(e.target.value)}
                disabled={loadingRules}
                required
                aria-required="true"
                className="w-full rounded-sm border border-[#343434] bg-[#1b1e20] px-3 py-2 text-sm text-[#f1f1f1] transition-colors focus:border-[#4d8eff] focus:outline-none focus:ring-1 focus:ring-[#4d8eff] disabled:opacity-50"
              >
                <option value="">-- Choose an active rule --</option>
                {availableRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.rule_name} ({r.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="code_snippet"
                className="ops-label mb-1.5 block text-[#8e8e8e]"
              >
                Code Snippet <span className="text-[#ff5451]">*</span>
              </label>
              <textarea
                id="code_snippet"
                rows={8}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste code or diff to evaluate against the rule (e.g. AWS access key, config setting, API middleware)…"
                required
                aria-required="true"
                className="w-full rounded-sm border border-[#343434] bg-[#141718] px-3 py-2 font-mono text-xs text-[#f1f1f1] placeholder-[#737373] transition-colors focus:border-[#4d8eff] focus:outline-none focus:ring-1 focus:ring-[#4d8eff]"
              />
            </div>
            <div>
              <label
                htmlFor="context"
                className="ops-label mb-1.5 block text-[#8e8e8e]"
              >
                Context <span className="text-[#737373]">(optional)</span>
              </label>
              <input
                id="context"
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. repo: backend-api, file: config/database.py"
                className="w-full rounded-sm border border-[#343434] bg-[#1b1e20] px-3 py-2 text-xs text-[#f1f1f1] placeholder-[#737373] transition-colors focus:border-[#4d8eff] focus:outline-none focus:ring-1 focus:ring-[#4d8eff]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !codeSnippet.trim() || !ruleId.trim()}
              aria-busy={submitting}
              className="inline-flex items-center gap-2 rounded-sm bg-[#4d8eff] px-5 py-2.5 text-xs font-bold text-[#08101f] transition-colors hover:bg-[#adc6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d8eff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Run Validation
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-sm border border-[#ff5451]/50 bg-[#ff5451]/10 p-4 text-sm text-[#ffb3ad]"
          >
            {error}
          </div>
        )}

        {/* Pending status */}
        {submitResult && !result && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-sm border border-[#4d8eff]/40 bg-[#4d8eff]/10 p-5"
          >
            <Loader2 size={20} className="animate-spin text-[#4d8eff]" />
            <div>
              <p className="text-sm font-semibold text-[#adc6ff]">
                Validation in progress
              </p>
              <p className="font-mono text-xs text-[#8e8e8e]">
                Task ID:{" "}
                <code className="text-[#adc6ff]">{submitResult.validation_id}</code>{" "}
                — polling result…
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="ops-panel p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={24}
                  className={
                    result.verdict === "LOW"
                      ? "text-[#4edea3]"
                      : result.verdict === "MID"
                        ? "text-[#f0c674]"
                        : "text-[#ff5451]"
                  }
                />
                <div>
                  <p className="font-[family-name:var(--font-geist-sans)] text-sm font-semibold text-[#f1f1f1]">
                    Validation Verdict
                  </p>
                  <p className="font-mono text-xs text-[#8e8e8e]">
                    ID:{" "}
                    <code className="text-[#adc6ff]">{result.validation_id}</code>
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
                <p className="ops-label text-[#8e8e8e]">
                  Evaluation Reasoning
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#c5c5c5]">
                  {result.reasoning}
                </p>
              </div>
              <div className="flex flex-wrap gap-6 font-mono text-xs text-[#737373]">
                <span>
                  Audit Sinks Logged: {result.activity_logged ? "✓ Yes (Loki)" : "✗ No (Local)"}
                </span>
                <span>
                  Timestamp: {new Date(result.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-mono text-[11px] text-[#8e8e8e] transition-colors hover:text-[#adc6ff] focus-visible:outline-none">
                Raw Verdict JSON
              </summary>
              <pre className="mt-2 rounded-sm border border-[#343434] bg-[#121415] p-3 font-mono text-[11px] text-[#8e8e8e]">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}
