import assert from "node:assert/strict";
import test from "node:test";
import { getApiBase } from "../services/api-base.mjs";

test("uses localhost for a local browser without configuration", () => {
  assert.equal(
    getApiBase({ isBrowser: true, hostname: "localhost" }),
    "http://localhost:8000",
  );
});

test("uses same-origin /api for hosted browser requests", () => {
  assert.equal(getApiBase({ isBrowser: true, hostname: "app.example" }), "/api");
});

test("uses same-origin /api for server requests", () => {
  assert.equal(getApiBase({ isBrowser: false }), "/api");
});

test("preserves an explicitly configured API URL", () => {
  assert.equal(
    getApiBase({ configuredUrl: "https://api.example/", isBrowser: true }),
    "https://api.example",
  );
});
