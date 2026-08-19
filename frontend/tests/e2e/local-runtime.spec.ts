import { expect, test } from "@playwright/test";

test("dashboard loads from the local API", async ({ page, request }) => {
  const backendBaseURL = process.env.E2E_API_BASE_URL ?? "http://localhost:8000";
  const health = await request.get(`${backendBaseURL}/health`);

  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({ status: "healthy" });

  const apiResponses = new Map<string, number>();
  page.on("response", (response) => {
    if (new URL(response.url()).origin === new URL(backendBaseURL).origin) {
      apiResponses.set(new URL(response.url()).pathname, response.status());
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Compliance Dashboard" }),
  ).toBeVisible();

  await expect.poll(() => apiResponses.get("/validate")).toBe(200);
  await expect.poll(() => apiResponses.get("/regulation")).toBe(200);

  expect(await page.getByText("Backend unavailable").count()).toBe(0);
  expect(await page.getByText("1,247").count()).toBe(0);
});
