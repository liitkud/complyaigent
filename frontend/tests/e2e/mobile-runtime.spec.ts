import { expect, test } from "@playwright/test";

test.describe("mobile runtime baseline", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "This baseline targets the mobile project",
  );

  test("loads the live dashboard without mobile layout regressions", async ({
    page,
  }) => {
    const apiResponses = new Map<string, number>();
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.pathname === "/validate" || url.pathname === "/regulation") {
        apiResponses.set(url.pathname, response.status());
      }
    });

    await page.goto("/");

    await expect(page).toHaveTitle(/FerretOPS/);
    await expect(page.getByText("FerretOPS / Command Console")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Compliance Dashboard" }),
    ).toBeVisible();

    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();
    await sidebar.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      sidebar.getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();

    await expect.poll(() => apiResponses.get("/validate")).toBe(200);
    await expect.poll(() => apiResponses.get("/regulation")).toBe(200);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });
});
