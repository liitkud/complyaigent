const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Resolve the backend base URL for both browser and server-rendered requests.
 * An explicit URL is always preferred. Local browser development talks to the
 * backend directly; hosted deployments use the frontend's same-origin proxy.
 */
export function getApiBase({
  configuredUrl,
  isBrowser,
  hostname,
} = {}) {
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  if (isBrowser && LOCAL_HOSTS.has(hostname)) return "http://localhost:8000";
  return "/api";
}
