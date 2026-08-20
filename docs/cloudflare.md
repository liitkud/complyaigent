# Cloudflare Deployment Baseline

This note records the Cloudflare compatibility baseline for the frontend. It
uses `@opennextjs/cloudflare` and Wrangler for a local Workers build and preview.
It does not authenticate, contact Cloudflare, or deploy anything.

## Current Support

The frontend uses Next.js 16.2.11 with the official OpenNext Cloudflare adapter.
The adapter converts the Next.js build output and runtime to a Worker. Wrangler
provides the local Worker runtime and asset serving.

The local compatibility check is:

```bash
cd frontend
pnpm cloudflare:check
```

The check is offline. It verifies the package, scripts, adapter config, Worker
entrypoint, assets directory, compatibility date, and `nodejs_compat` flag. It
does not invoke Wrangler, OpenNext, or any Cloudflare API.

## Local Build And Preview

The provider-neutral build remains:

```bash
pnpm build
```

Build the Worker bundle without deploying:

```bash
pnpm cloudflare:build
```

Preview the adapted bundle locally:

```bash
pnpm cloudflare:preview
```

Run `cloudflare:build` before preview. The preview uses `wrangler dev --local`
and does not deploy.

## Static Compatibility

The current frontend is not compatible with `output: "export"`:

- `app/ingest/[id]/page.tsx` is a dynamic route without
  `generateStaticParams()`.
- `app/regulation/[id]/page.tsx` is a dynamic route without
  `generateStaticParams()`.
- `app/dashboard/page.tsx` declares `force-dynamic`; the current local build
  still classifies that client-only route as static, so this declaration is not
  evidence that the whole application can be exported.
- The dashboard, upload, validation, and detail screens fetch the backend at
  runtime from client components. Those browser interactions are individually
  static-friendly, but they do not remove the dynamic route constraints.

Next.js local documentation says static export does not support dynamic routes
without `generateStaticParams()`, and does not support server features that
need request-time execution. Do not add `output: "export"` to the shared
`next.config.ts`; it would change the existing local build contract and would
not produce a valid deployment for this app.

Static-compatible pieces include the React client components, CSS, metadata,
links, and browser-side `fetch` calls. A static-only Pages deployment would
still need route changes, a backend API with suitable CORS, and a deliberate
fallback/rewriting design. A Pages deployment that keeps the current dynamic
routes also needs a Pages-compatible adapter. Neither path is this change.

## Workers Adapter Boundary

The adapter-owned work is the production build command, Worker entrypoint,
asset serving, request routing, and any supported cache/runtime integration.
The app-owned work is the normal Next.js app and its `pnpm build` contract.
Keep those concerns separate. Do not add a Cloudflare-specific runtime import
to application routes until an adapter is selected and pinned.

The existing `pnpm build` remains the provider-neutral local build. The
`cloudflare:build` adapter build is an additional command and must not replace
it.

## Required Account Guard

Any future Workers deployment command must fail closed unless the operator has
explicitly selected the approved Cloudflare account. Keep the approved account
name in local environment configuration, not in source code. The guard is
required before any `wrangler` or adapter deploy command:

```bash
test -n "${CLOUDFLARE_ACCOUNT_NAME:-}" \
  || { echo "Refusing Cloudflare deploy: set CLOUDFLARE_ACCOUNT_NAME" >&2; exit 1; }
```

The account ID and approved account name must be supplied through the
deployment environment or the provider's local configuration. Do not commit an
account ID, token, or authenticated state. This repository does not run the
guard or a deploy as part of its compatibility check.

## Verified Worker

The frontend Worker is deployed at:

```text
https://ferretops.kuyacarlo.workers.dev
```

Verified after deployment:

- `/` returns HTTP 200.
- `/landing` returns HTTP 200.
- `/dashboard` returns HTTP 200.

The backend remains self-hosted. `/api/health` returns HTTP 404 until a backend
origin or same-origin proxy is configured for the Worker. Do not treat the
public dashboard shell as proof that the remote API is connected.
