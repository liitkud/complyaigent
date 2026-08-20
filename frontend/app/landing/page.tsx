import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  FileText,
  LockKeyhole,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Upload,
  UserCheck,
} from "lucide-react";

const metrics = [
  { value: "< 50ms", label: "Local A1 Evaluation", desc: "Instant pre-push feedback before code leaves the machine" },
  { value: "4-Bucket", label: "Rule Compiler", desc: "A1 regex, A2 actionable, B infra metadata, C semantic guidance" },
  { value: "Fail-Closed", label: "Security Posture", desc: "Zero unverified code slips to remote origin by default" },
  { value: "100%", label: "Verifiable Audit Trail", desc: "Non-repudiable structured verdict logs streamed to Loki" },
];

const buckets = [
  {
    id: "Bucket A1",
    tag: "SCANNABLE",
    title: "Deterministic Code Inspection",
    color: "border-[#4d8eff]/40 bg-[#4d8eff]/5 text-[#adc6ff]",
    badgeColor: "bg-[#4d8eff]/20 text-[#adc6ff] border-[#4d8eff]/40",
    desc: "Compiled regular expressions with automated pass/fail test fixtures. Evaluates instantaneously inside the local CLI pre-push hook.",
    examples: ["AWS / Cloud credentials & private keys", "PII patterns (emails, credit cards, government IDs)", "Hardcoded plaintext secrets and connection strings"],
    icon: Code2,
  },
  {
    id: "Bucket A2",
    tag: "ACTIONABLE",
    title: "Contextual Review Gates",
    color: "border-[#f0c674]/40 bg-[#f0c674]/5 text-[#f0c674]",
    badgeColor: "bg-[#f0c674]/20 text-[#f0c674] border-[#f0c674]/40",
    desc: "Targeted verification questions dispatched to human compliance operators when code requires architectural or security context.",
    examples: ["Encryption-at-rest configuration on new S3 / DB resources", "Mandatory OAuth2 / JWT authorization on public endpoints", "Data retention policies for customer telemetry"],
    icon: UserCheck,
  },
  {
    id: "Bucket B",
    tag: "INFRA_METADATA",
    title: "Infrastructure Declarations",
    color: "border-[#4edea3]/40 bg-[#4edea3]/5 text-[#4edea3]",
    badgeColor: "bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40",
    desc: "Explicit key/value configuration governance applied to CloudFormation, Terraform, Docker, and Kubernetes manifests.",
    examples: ["Minimum TLS Version: TLSv1.3", "VPC Flow Logging enabled on all ingress gateways", "Multi-region replication on primary transactional stores"],
    icon: Server,
  },
  {
    id: "Bucket C",
    tag: "SEMANTIC_GUIDANCE",
    title: "Organizational Directives",
    color: "border-[#c58fff]/40 bg-[#c58fff]/5 text-[#c58fff]",
    badgeColor: "bg-[#c58fff]/20 text-[#c58fff] border-[#c58fff]/40",
    desc: "High-level constitutional guidelines and architectural principles designed for human engineering review and automated PR summarizers.",
    examples: ["Sanitize all internal stack traces in public error payloads", "Maintain separation of duties between billing and identity pipelines", "Require dual sign-off on breaking API contracts"],
    icon: FileText,
  },
];

const frameworks = [
  { name: "SOC 2 Type II", focus: "Security, Availability & Confidentiality" },
  { name: "ISO / IEC 27001", focus: "Information Security Management System" },
  { name: "Data Privacy Act (RA 10173 / GDPR)", focus: "PII Shielding & Consent Protection" },
  { name: "HIPAA Security Rule", focus: "ePHI Transmission & At-Rest Controls" },
  { name: "Corporate Engineering Constitutions", focus: "Internal Architecture Guardrails" },
];

const faqs = [
  {
    q: "How does FerretOPS prevent developer slowdown?",
    a: "Bucket A1 rules execute locally in under 50 milliseconds directly in the `pg` pre-push hook. Developers only interact with review gates when ambiguous changes genuinely require compliance operator approval.",
  },
  {
    q: "What happens if the backend is unreachable during a push?",
    a: "FerretOPS follows a strict 'fail-closed' security philosophy. If the compliance API cannot be reached for mid-risk verdict verification, the push is prevented with clear diagnostic instructions.",
  },
  {
    q: "How are generated regular expressions protected against ReDoS?",
    a: "Every LLM-extracted rule is compiled and verified with regex safety checks (smoke tested against pass/fail fixture payloads) before being published to the governance manifest.",
  },
  {
    q: "How does policy versioning work when laws change?",
    a: "Documents are ingested with SHA-256 idempotency and MinHash entity anchor deduplication. Updates are automatically linked to previous version lineages with a clear diff trail.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto min-h-screen bg-[#111313] text-[#e7e7e7]">
      <div className="relative isolate">
        {/* Background Grid Accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(77,142,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(77,142,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />

        {/* Top Navbar */}
        <header className="sticky top-0 z-30 border-b border-[#343434]/80 bg-[#111313]/90 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#4d8eff] bg-[#4d8eff]/15 font-mono text-sm font-bold text-[#adc6ff] shadow-sm shadow-[#4d8eff]/20">
                F
              </div>
              <div>
                <span className="font-mono text-sm font-bold tracking-wide text-[#f1f1f1]">
                  FerretOPS
                </span>
                <span className="ml-2 hidden rounded border border-[#4edea3]/40 bg-[#4edea3]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#4edea3] sm:inline">
                  v1.0 MVP
                </span>
              </div>
            </Link>

            <nav
              aria-label="Landing navigation"
              className="flex items-center gap-5 text-xs font-medium sm:gap-7 sm:text-sm"
            >
              <Link
                className="hidden text-[#8e8e8e] transition-colors hover:text-white md:block"
                href="#how-it-works"
              >
                How it works
              </Link>
              <Link
                className="hidden text-[#8e8e8e] transition-colors hover:text-white md:block"
                href="#buckets"
              >
                Rule Buckets
              </Link>
              <Link
                className="hidden text-[#8e8e8e] transition-colors hover:text-white lg:block"
                href="#cli"
              >
                Pre-Push CLI
              </Link>
              <Link
                className="text-[#8e8e8e] transition-colors hover:text-white"
                href="/policy"
              >
                Policies
              </Link>
              <Link
                className="text-[#8e8e8e] transition-colors hover:text-white"
                href="/validate"
              >
                Validate
              </Link>
              <Link
                className="inline-flex items-center gap-1.5 rounded-sm border border-[#4d8eff]/60 bg-[#4d8eff]/10 px-3.5 py-1.5 text-xs font-semibold text-[#adc6ff] transition-colors hover:border-[#adc6ff] hover:bg-[#4d8eff]/20 hover:text-white"
                href="/dashboard"
              >
                Open Console <ArrowRight size={13} />
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className="mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-32">
          <section
            aria-labelledby="hero-title"
            className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4edea3]/30 bg-[#4edea3]/10 px-3 py-1 text-xs text-[#4edea3]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />
                Continuous Compliance Gate & Policy Extraction Engine
              </div>

              <h1
                id="hero-title"
                className="mt-6 max-w-3xl font-[family-name:var(--font-geist-sans)] text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[#f1f1f1] sm:text-5xl lg:text-6xl"
              >
                Turn statutory policy into a{" "}
                <span className="bg-gradient-to-r from-[#adc6ff] via-[#70a1ff] to-[#4edea3] bg-clip-text text-transparent">
                  compile-time guardrail.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#a3a6a5] sm:text-lg">
                FerretOPS bridges organizational governance and production code.
                Upload statutory PDFs or constitutions, automatically compile them into
                deterministic regex filters and review gates, and enforce compliance
                directly on every developer <code className="rounded bg-[#202020] px-1.5 py-0.5 font-mono text-xs text-[#adc6ff]">git push</code>.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/policy"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#adc6ff] px-6 py-3 text-sm font-semibold text-[#10151f] shadow-md shadow-[#adc6ff]/10 transition-colors hover:bg-white"
                >
                  <Upload size={16} /> Ingest a Policy <ArrowRight size={15} />
                </Link>
                <Link
                  href="/validate"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#4b5255] px-6 py-3 text-sm font-semibold text-[#e7e7e7] transition-colors hover:border-[#adc6ff] hover:bg-[#1d2428]"
                >
                  <Terminal size={16} /> Try Validation Sandbox
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#343434] bg-[#1a1a1a] px-5 py-3 text-sm font-medium text-[#8e8e8e] transition-colors hover:text-white"
                >
                  <ShieldCheck size={16} className="text-[#4edea3]" /> Console
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-[#687071]">
                <span className="flex items-center gap-1.5 font-mono">
                  <Check size={13} className="text-[#4edea3]" /> Pre-push Fail Closed
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Check size={13} className="text-[#4edea3]" /> Presidio PII Shield
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Check size={13} className="text-[#4edea3]" /> Loki Verdict Sinks
                </span>
              </div>
            </div>

            {/* Interactive Terminal / Live Preview Card */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 bg-[#4d8eff]/15 blur-3xl"
              />
              <div className="overflow-hidden rounded-md border border-[#343434] bg-[#141718] shadow-2xl shadow-black/60">
                <div className="flex items-center justify-between border-b border-[#282d2f] bg-[#1a1e20] px-4 py-3">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#8d9697]">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
                    </div>
                    <span className="ml-2 font-semibold text-[#f1f1f1]">
                      pg scan --hook=pre-push
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#4edea3]">
                    ● ACTIVE
                  </span>
                </div>

                <div className="space-y-3 p-5 font-mono text-xs leading-relaxed sm:p-6 sm:text-[13px]">
                  <div className="text-[#8e8e8e]">
                    <span className="text-[#4edea3]">&gt;</span> Checking local diff against active Governance Manifest...
                  </div>
                  <div className="rounded bg-[#0d1011] p-3 text-xs border border-[#22282a]">
                    <p className="text-[#8e8e8e]">{"// Bucket A1: Scannable Regex Inspection"}</p>
                    <p className="text-[#4edea3]">✔ A1-001 No AWS Access Keys in Source (0.012s)</p>
                    <p className="text-[#4edea3]">✔ A1-002 No Unencrypted RSA Private Keys (0.008s)</p>
                    <p className="text-[#4edea3]">✔ A1-003 Presidio PII Shielding (0.019s)</p>
                  </div>

                  <div className="rounded bg-[#0d1011] p-3 text-xs border border-[#f0c674]/30">
                    <p className="text-[#f0c674]">{"// Bucket A2: Contextual Review Dispatched"}</p>
                    <p className="text-[#e7e7e7]">
                      Rule: <span className="text-[#f0c674]">A2-001 Mandatory KMS Encryption at Rest</span>
                    </p>
                    <p className="text-[#8e8e8e]">Action: Dispatching diff snippet to operator approval queue...</p>
                    <p className="text-[#adc6ff] font-semibold mt-1">
                      Verdict: 202 ACCEPTED → Poll /validate/val-9802 [Approved]
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-[#687071] border-t border-[#22282a]">
                    <span>Policy Hash: <code className="text-[#adc6ff]">sha256:7f4a...e12d</code></span>
                    <span className="text-[#4edea3]">Exit Code: 0 (Push Allowed)</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-2 flex items-center gap-2 border border-[#3a4548] bg-[#1c2325] px-3.5 py-1.5 font-mono text-[11px] text-[#a3a6a5] shadow-lg sm:-right-4">
                <LockKeyhole size={14} className="text-[#4edea3]" /> Immutable Audit Lineage
              </div>
            </div>
          </section>

          {/* Metric Bar */}
          <section className="mt-20 grid grid-cols-2 gap-4 border-y border-[#343434] py-8 lg:grid-cols-4 sm:gap-6 sm:py-10">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-1">
                <p className="font-mono text-2xl font-bold text-[#adc6ff] sm:text-3xl">
                  {m.value}
                </p>
                <p className="text-sm font-semibold text-[#f1f1f1]">{m.label}</p>
                <p className="text-xs text-[#8e8e8e] leading-5">{m.desc}</p>
              </div>
            ))}
          </section>

          {/* Operating Loop (How it works) */}
          <section
            id="how-it-works"
            aria-labelledby="flow-title"
            className="mt-28 scroll-mt-12 pt-6 sm:mt-36"
          >
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="ops-label text-[#4edea3]">The Continuous Loop</p>
                <h2
                  id="flow-title"
                  className="mt-2 text-3xl font-bold tracking-tight text-[#f1f1f1] sm:text-4xl"
                >
                  From static policy PDF to active pre-push gate.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#8e8e8e]">
                Automate the entire lifecycle of governance documents without creating manual CI bottlenecks or developer friction.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01 / INGEST",
                  title: "Document Ingestion",
                  icon: FileText,
                  desc: "Upload PDFs, Markdown policies, or statutory laws. FerretOPS performs SHA-256 hash checks and deduplication to maintain clean version lineage.",
                },
                {
                  step: "02 / COMPILE",
                  title: "4-Bucket Compilation",
                  icon: Cpu,
                  desc: "LLM extraction classifies text into deterministic regex (A1), review gates (A2), infra metadata (B), and semantic directives (C).",
                },
                {
                  step: "03 / ENFORCE",
                  title: "Local Git Pre-Push",
                  icon: Terminal,
                  desc: "The `pg` CLI evaluates A1 regex rules locally in <50ms. No sensitive uncommitted code ever leaves the machine without a pass verdict.",
                },
                {
                  step: "04 / AUDIT",
                  title: "HITL & Loki Sinks",
                  icon: ShieldCheck,
                  desc: "Contextual diffs route to the operator dashboard for Human-in-the-Loop review. Every decision emits an immutable structured log.",
                },
              ].map((s) => {
                const StepIcon = s.icon;
                return (
                  <article
                    key={s.step}
                    className="group relative rounded-sm border border-[#343434] bg-[#15181a] p-6 transition-colors hover:border-[#4d8eff]/60 hover:bg-[#181d20]"
                  >
                    <div className="flex items-center justify-between">
                      <StepIcon size={22} className="text-[#adc6ff] transition-transform group-hover:scale-110" />
                      <span className="font-mono text-[10px] font-semibold text-[#737373]">
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mt-6 text-base font-bold text-[#f1f1f1]">
                      {s.title}
                    </h3>
                    <p className="mt-2.5 text-xs leading-5 text-[#8e8e8e]">
                      {s.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* 4 Rule Buckets Deep Dive */}
          <section
            id="buckets"
            aria-labelledby="buckets-title"
            className="mt-28 scroll-mt-12 border-t border-[#343434] pt-16 sm:mt-36"
          >
            <div className="text-center">
              <p className="ops-label text-[#adc6ff]">Taxonomy & Architecture</p>
              <h2
                id="buckets-title"
                className="mt-2 text-3xl font-bold tracking-tight text-[#f1f1f1] sm:text-4xl"
              >
                The 4-Bucket Governance Matrix
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#8e8e8e]">
                Not all policy sentences are created equal. FerretOPS segments governance into four strictly separated execution planes.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {buckets.map((b) => {
                const BucketIcon = b.icon;
                return (
                  <div
                    key={b.id}
                    className={`rounded-sm border ${b.color} p-6 sm:p-8 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold ${b.badgeColor}`}>
                          {b.tag}
                        </span>
                        <BucketIcon size={20} />
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-[#f1f1f1]">
                        {b.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[#a3a6a5]">
                        {b.desc}
                      </p>

                      <div className="mt-6 space-y-2 border-t border-[#343434]/80 pt-4">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#737373]">
                          Enforced Examples:
                        </p>
                        {b.examples.map((ex) => (
                          <div key={ex} className="flex items-start gap-2 text-xs text-[#d1d5db]">
                            <ChevronRight size={14} className="mt-0.5 shrink-0 text-[#4edea3]" />
                            <span>{ex}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4">
                      <Link
                        href="/policy"
                        className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      >
                        Inspect {b.id} Rules in Manifest <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CLI & Operator Workflows */}
          <section
            id="cli"
            aria-labelledby="workflows-title"
            className="mt-28 scroll-mt-12 border-t border-[#343434] pt-16 sm:mt-36"
          >
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="ops-label text-[#4edea3]">Developer Velocity</p>
                <h2
                  id="workflows-title"
                  className="mt-2 text-3xl font-bold tracking-tight text-[#f1f1f1] sm:text-4xl"
                >
                  Meet developers where they work: the terminal.
                </h2>
                <p className="mt-4 text-sm leading-6 text-[#8e8e8e]">
                  The <code className="rounded bg-[#202020] px-1.5 py-0.5 font-mono text-xs text-[#adc6ff]">pg</code> CLI installs as a lightweight Git hook. It intercepts secret leaks, unencrypted credentials, and non-compliant code before the remote repository ever receives the commit.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4edea3]/10 text-[#4edea3]">
                      <Check size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#f1f1f1]">Zero External Network Latency</h4>
                      <p className="text-xs text-[#8e8e8e]">A1 regex evaluations execute fully in-memory locally.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4edea3]/10 text-[#4edea3]">
                      <Check size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#f1f1f1]">Integrated Presidio PII Engine</h4>
                      <p className="text-xs text-[#8e8e8e]">Shields sensitive credit card, phone, and national ID patterns.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#4edea3]/10 text-[#4edea3]">
                      <Check size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#f1f1f1]">Gitleaks Secret Scanning</h4>
                      <p className="text-xs text-[#8e8e8e]">Deterministic entropy and credential pattern filters.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/validate"
                    className="inline-flex items-center gap-2 rounded-sm bg-[#202020] border border-[#343434] px-4 py-2.5 text-xs font-semibold text-[#f1f1f1] hover:border-[#adc6ff]"
                  >
                    <Terminal size={14} /> Open Validation Simulator <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Terminal Code Snippet */}
              <div className="rounded-md border border-[#343434] bg-[#121415] p-5 font-mono text-xs leading-relaxed text-[#a3a6a5] shadow-xl">
                <p className="text-[#737373]"># 1. Install CLI and register git pre-push hook</p>
                <p className="text-[#4edea3]">$ pg init --repo=./my-service</p>
                <p className="text-[#f1f1f1] mt-1">✔ Configured pre-push hook in .git/hooks/pre-push</p>
                <p className="text-[#f1f1f1]">✔ Synced Governance Manifest (12 rules active)</p>

                <p className="text-[#737373] mt-5"># 2. Trigger push with local diff</p>
                <p className="text-[#4edea3]">$ git push origin feat/payment-gateway</p>
                <p className="text-[#8e8e8e] mt-1">[pg] Scanning 4 files in commit 7a8f9c...</p>
                <p className="text-[#ff5451]">[FAIL] A1-001: AWS Access Key detected in config.yaml:14</p>
                <p className="text-[#ffb3ad] font-mono text-[11px] pl-4">→ Remediation: Store in AWS Secrets Manager or vault.</p>
                <p className="text-[#ff5451] font-semibold mt-1">Push aborted by policy gate (Fail-Closed).</p>
              </div>
            </div>
          </section>

          {/* Supported Regulatory Frameworks */}
          <section className="mt-28 border-t border-[#343434] pt-16 sm:mt-36">
            <div className="text-center">
              <p className="ops-label text-[#f0c674]">Enterprise Governance</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#f1f1f1] sm:text-3xl">
                Built for Statutory Frameworks & Org Constitutions
              </h2>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {frameworks.map((f) => (
                <div
                  key={f.name}
                  className="rounded-sm border border-[#343434] bg-[#15181a] p-5"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#adc6ff]" />
                    <h4 className="font-semibold text-sm text-[#f1f1f1]">{f.name}</h4>
                  </div>
                  <p className="mt-2 text-xs text-[#8e8e8e]">{f.focus}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-28 border-t border-[#343434] pt-16 sm:mt-36">
            <div className="text-center">
              <p className="ops-label text-[#8e8e8e]">Frequently Asked Questions</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#f1f1f1] sm:text-3xl">
                Architecture & Security Guardrails
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-sm border border-[#343434] bg-[#15181a] p-6"
                >
                  <h4 className="text-sm font-semibold text-[#f1f1f1]">{faq.q}</h4>
                  <p className="mt-2.5 text-xs leading-5 text-[#8e8e8e]">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Banner */}
          <section className="mt-28 rounded-md border border-[#4d8eff]/40 bg-gradient-to-br from-[#1b2638] to-[#12161b] p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold text-[#f1f1f1] sm:text-3xl">
              Ready to enforce continuous compliance in your delivery pipeline?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#adc6ff]">
              Ingest your first compliance standard in seconds and inspect the generated rule manifest.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/policy"
                className="rounded-sm bg-[#adc6ff] px-6 py-3 text-sm font-semibold text-[#091224] transition-colors hover:bg-white"
              >
                Ingest Policy File
              </Link>
              <Link
                href="/dashboard"
                className="rounded-sm border border-[#adc6ff]/40 bg-[#162032] px-6 py-3 text-sm font-semibold text-[#adc6ff] transition-colors hover:bg-[#adc6ff]/20 hover:text-white"
              >
                Launch Command Console
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-24 border-t border-[#343434] pt-8 text-xs text-[#687071]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded border border-[#4d8eff] bg-[#4d8eff]/15 font-mono text-xs font-bold text-[#adc6ff]">
                  F
                </div>
                <span className="font-mono font-semibold text-[#f1f1f1]">
                  FERRETOPS / CONTINUOUS COMPLIANCE GATE
                </span>
              </div>
              <div className="flex flex-wrap gap-5 font-medium">
                <Link href="/dashboard" className="hover:text-[#adc6ff]">
                  Command Console
                </Link>
                <Link href="/policy" className="hover:text-[#adc6ff]">
                  Policy Dashboard
                </Link>
                <Link href="/validate" className="hover:text-[#adc6ff]">
                  Validation Sandbox
                </Link>
                <Link href="/upload" className="hover:text-[#adc6ff]">
                  Upload Policy
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
