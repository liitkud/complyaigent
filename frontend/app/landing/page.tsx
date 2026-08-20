import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  FileCheck2,
  FileText,
  GitBranch,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Terminal,
  Upload,
  UserRoundCheck,
} from "lucide-react";

const guardrails = [
  "Scannable rules run before code leaves the repository.",
  "Uncertain diffs move to a human-readable review queue.",
  "Every verdict keeps its policy source and decision path.",
];

export default function LandingPage() {
  return (
    <div className="min-w-0 flex-1 overflow-hidden bg-[#111313]">
      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(77,142,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(77,142,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
        />

        <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-[#343434]/70 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8e8e8e]">
            <CircleDot size={13} className="text-[#4edea3]" />
            <span className="font-mono tracking-[0.18em]">LOCAL.RUNTIME</span>
          </div>
          <nav
            aria-label="Landing page"
            className="flex items-center gap-4 sm:gap-7"
          >
            <Link
              className="hidden text-sm text-[#8e8e8e] transition-colors hover:text-white sm:block"
              href="/dashboard"
            >
              How it works
            </Link>
            <Link
              className="text-sm text-[#adc6ff] transition-colors hover:text-white"
              href="/dashboard"
            >
              Open console <ArrowRight size={14} className="ml-1 inline" />
            </Link>
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:px-12 lg:pb-28">
          <section
            aria-labelledby="hero-title"
            className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20"
          >
            <div>
              <p className="ops-label mb-5 flex items-center gap-2 text-[#4edea3]">
                <span className="h-px w-8 bg-[#4edea3]" /> Policy enforcement
                for the real world
              </p>
              <h1
                id="hero-title"
                className="max-w-3xl font-[family-name:var(--font-geist-sans)] text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#f1f1f1] sm:text-6xl lg:text-7xl"
              >
                Turn policy into a{" "}
                <span className="text-[#adc6ff]">guardrail.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#a3a6a5] sm:text-lg">
                FerretOPS translates governance documents into checks your team
                can act on before risk reaches production. One control plane for
                compliance operators and the people shipping code.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/policy"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#adc6ff] px-5 py-3 text-sm font-semibold text-[#10151f] transition-colors hover:bg-white"
                >
                  <Upload size={16} /> Ingest a policy <ArrowRight size={15} />
                </Link>
                <Link
                  href="/validate"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#4b5255] px-5 py-3 text-sm font-semibold text-[#e7e7e7] transition-colors hover:border-[#adc6ff] hover:bg-[#1d2428]"
                >
                  <Terminal size={16} /> Try a validation
                </Link>
              </div>
              <p className="mt-5 font-mono text-[11px] text-[#687071]">
                / ingest -&gt; compile -&gt; validate -&gt; decide
              </p>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-8 -z-10 bg-[#4d8eff]/10 blur-3xl"
              />
              <div className="overflow-hidden rounded-sm border border-[#3a4548] bg-[#161b1d] shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-[#30383a] px-4 py-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8d9697]">
                    <Terminal size={14} className="text-[#4edea3]" /> ferretops
                    / policy-gate
                  </div>
                  <span className="font-mono text-[10px] text-[#687071]">
                    guardrails.yml
                  </span>
                </div>
                <div className="space-y-4 p-5 font-mono text-xs leading-6 sm:p-7 sm:text-sm">
                  <p>
                    <span className="text-[#596466]">01</span>{" "}
                    <span className="text-[#4edea3]">policy</span>
                    <span className="text-[#a3a6a5]">: </span>
                    <span className="text-[#f0c674]">
                      &quot;SOC 2 / engineering baseline&quot;
                    </span>
                  </p>
                  <p>
                    <span className="text-[#596466]">02</span>{" "}
                    <span className="text-[#4edea3]">rule</span>
                    <span className="text-[#a3a6a5]">: </span>
                    <span className="text-[#adc6ff]">
                      no_credentials_in_source
                    </span>
                  </p>
                  <p>
                    <span className="text-[#596466]">03</span>{" "}
                    <span className="text-[#4edea3]">scope</span>
                    <span className="text-[#a3a6a5]">: </span>
                    <span className="text-[#f0c674]">pull_request</span>
                  </p>
                  <div className="my-5 border-t border-dashed border-[#394244]" />
                  <p className="flex items-center gap-2 text-[#4edea3]">
                    <Check size={15} /> local scan complete
                  </p>
                  <p className="flex items-center gap-2 text-[#adc6ff]">
                    <ChevronRight size={15} /> verdict ready for review
                  </p>
                  <p className="pt-2 text-[#596466]">
                    {"// evidence stays attached to the decision"}
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 flex items-center gap-2 border border-[#3a4548] bg-[#1c2325] px-3 py-2 font-mono text-[10px] text-[#a3a6a5] shadow-lg sm:-left-7">
                <LockKeyhole size={13} className="text-[#4edea3]" /> audit-ready
                by default
              </div>
            </div>
          </section>

          <section
            aria-labelledby="flow-title"
            className="mt-28 border-t border-[#343434] pt-10 sm:mt-36"
          >
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="ops-label text-[#687071]">The operating loop</p>
                <h2
                  id="flow-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-[#f1f1f1] sm:text-3xl"
                >
                  From source text to shipped confidence.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-[#7f8788]">
                Make the right path the easiest path for every change.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-sm border border-[#343434] bg-[#343434] md:grid-cols-3">
              {[
                [
                  FileText,
                  "01 / INGEST",
                  "Bring the source of truth",
                  "Upload a policy or regulation. FerretOPS keeps the origin visible as it becomes executable guidance.",
                ],
                [
                  ScanSearch,
                  "02 / COMPILE",
                  "Shape the control",
                  "Separate deterministic scans from checks that need context, with a clear remediation path for both.",
                ],
                [
                  ShieldCheck,
                  "03 / ENFORCE",
                  "Decide with evidence",
                  "Validate a change locally, route uncertain cases to review, and preserve the verdict trail.",
                ],
              ].map(([Icon, label, title, copy]) => {
                const StepIcon = Icon as typeof FileText;
                return (
                  <article
                    key={label as string}
                    className="bg-[#171b1d] p-6 sm:p-8"
                  >
                    <StepIcon size={20} className="text-[#adc6ff]" />
                    <p className="ops-label mt-8 text-[#687071]">
                      {label as string}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[#f1f1f1]">
                      {title as string}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#8d9697]">
                      {copy as string}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="audiences-title"
            className="mt-20 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"
          >
            <div>
              <p className="ops-label text-[#f0c674]">
                One system / two vantage points
              </p>
              <h2
                id="audiences-title"
                className="mt-3 max-w-md text-3xl font-semibold tracking-tight text-[#f1f1f1]"
              >
                Governance that respects the people doing the work.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-sm border border-[#343434] bg-[#171b1d] p-6">
                <UserRoundCheck size={19} className="text-[#f0c674]" />
                <h3 className="mt-7 font-semibold text-[#f1f1f1]">
                  For operators
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#8d9697]">
                  Turn policy language into reviewable controls. See why a
                  verdict happened, then approve or reject with context.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#adc6ff] hover:text-white"
                >
                  Open dashboard <ArrowRight size={14} />
                </Link>
              </article>
              <article className="rounded-sm border border-[#343434] bg-[#171b1d] p-6">
                <Code2 size={19} className="text-[#4edea3]" />
                <h3 className="mt-7 font-semibold text-[#f1f1f1]">
                  For developers
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#8d9697]">
                  Get fast local feedback before push. When a rule needs
                  judgment, send the smallest useful context upstream.
                </p>
                <Link
                  href="/validate"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#adc6ff] hover:text-white"
                >
                  Run a check <ArrowRight size={14} />
                </Link>
              </article>
            </div>
          </section>

          <section
            aria-label="FerretOPS principles"
            className="mt-20 grid gap-3 border-y border-[#343434] py-6 text-sm text-[#8d9697] sm:grid-cols-3 sm:gap-6"
          >
            {guardrails.map((item) => (
              <p key={item} className="flex gap-3">
                <Check size={16} className="mt-0.5 shrink-0 text-[#4edea3]" />
                {item}
              </p>
            ))}
          </section>

          <footer className="flex flex-col gap-5 pt-8 text-xs text-[#687071] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono">FERRETOPS / COMPLIANCE OPERATIONS</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
              <Link href="/dashboard" className="hover:text-[#adc6ff]">
                Dashboard
              </Link>
              <Link href="/policy" className="hover:text-[#adc6ff]">
                Policy Dashboard
              </Link>
              <Link href="/validate" className="hover:text-[#adc6ff]">
                Validate code
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 hover:text-[#adc6ff]"
              >
                <GitBranch size={13} /> Explore console
              </Link>
              <FileCheck2
                size={14}
                className="hidden text-[#4edea3] sm:block"
                aria-label="Policy controls"
              />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
