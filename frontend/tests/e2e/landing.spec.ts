import { expect, test } from "@playwright/test";

test("landing page explains FerretOPS and links to the live console", async ({
  page,
}) => {
  await page.goto("/landing");

  await expect(page).toHaveTitle(/FerretOPS/);
  await expect(
    page.getByRole("heading", { name: /Turn policy into a guardrail/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Ingest a policy/i }),
  ).toHaveAttribute("href", "/upload");
  await expect(
    page.getByRole("link", { name: /Open console/i }),
  ).toHaveAttribute("href", "/");
});
