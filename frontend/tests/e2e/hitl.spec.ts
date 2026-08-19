import { expect, test } from "@playwright/test";

const pendingValidation = {
  validation_id: "validation-mid-1",
  verdict: "MID",
  reasoning: "Human review required.",
  activity_logged: true,
  created_at: "2026-08-20T10:00:00Z",
  status: "pending",
};

test("approves a pending validation through the HITL API", async ({ page }) => {
  let patchBody: unknown;

  await page.route("**/validate", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: [pendingValidation] });
      return;
    }
    await route.fallback();
  });
  await page.route("**/validate/validation-mid-1", async (route) => {
    expect(route.request().method()).toBe("PATCH");
    patchBody = route.request().postDataJSON();
    await route.fulfill({
      json: {
        success: true,
        validation_id: "validation-mid-1",
        status: "approved",
      },
    });
  });
  await page.route("**/regulation", async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "HITL Pending Approvals" })).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();

  await expect(page.getByText("No pending approvals")).toBeVisible();
  expect(patchBody).toEqual({ action: "approve" });
});
