import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
const wranglerConfig = readFileSync(join(root, "wrangler.jsonc"), "utf8");
const openNextConfig = readFileSync(join(root, "open-next.config.ts"), "utf8");

const requiredScripts = [
  "build",
  "start",
  "cloudflare:build",
  "cloudflare:preview",
  "cloudflare:check",
];
const missingScripts = requiredScripts.filter(
  (script) => typeof packageJson.scripts?.[script] !== "string",
);
if (missingScripts.length > 0) {
  throw new Error(`Missing Next.js scripts: ${missingScripts.join(", ")}`);
}

if (packageJson.dependencies?.next !== "16.2.11") {
  throw new Error(
    `Expected Next.js 16.2.11, found ${packageJson.dependencies?.next}`,
  );
}

if (/output\s*:\s*["']export["']/.test(nextConfig)) {
  throw new Error(
    "Static export is enabled; use a Workers adapter for this app.",
  );
}

if (
  !existsSync(
    join(root, "node_modules", "@opennextjs/cloudflare", "package.json"),
  )
) {
  throw new Error("@opennextjs/cloudflare is not installed");
}

if (!existsSync(join(root, "node_modules", "wrangler", "package.json"))) {
  throw new Error("wrangler is not installed");
}

for (const expected of [
  '"main": ".open-next/worker.js"',
  '"directory": ".open-next/assets"',
  '"compatibility_date": "2026-08-20"',
  '"nodejs_compat"',
]) {
  if (!wranglerConfig.includes(expected)) {
    throw new Error(`Wrangler config is missing ${expected}`);
  }
}

if (!openNextConfig.includes("defineCloudflareConfig")) {
  throw new Error("OpenNext Cloudflare config is not enabled");
}

if (packageJson.scripts?.deploy || packageJson.scripts?.["cloudflare:deploy"]) {
  throw new Error(
    "Deploy scripts are not allowed in the local compatibility baseline",
  );
}

console.log("Next.js 16 local compatibility check: pass");
console.log("OpenNext Cloudflare adapter and Wrangler: installed");
console.log("Worker entrypoint/assets and nodejs_compat: configured");
console.log("Cloudflare API/authentication: not used by this offline check.");
