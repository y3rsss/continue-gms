import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("the night edition stays on after a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Switch to night edition" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to day edition" })).toBeVisible();
});

test("an unknown page shows Game over", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  await expect(page.getByText("This page doesn't exist.")).toBeVisible();
  await page.getByRole("link", { name: "Continue? Yes, back to the cover" }).click();
  await expect(page).toHaveURL("/");
});

test("an unknown game says it can't be found", async ({ page }) => {
  await page.route("**/api/game?slug=missing-game", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"Game not found"}' }),
  );
  await page.goto("/games/missing-game");
  await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  await expect(page.getByText(/couldn't find that game/)).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [name, path, ready] of [
    ["cover", "/", "Valheim"],
    ["index", "/games", "Grand Theft Auto V"],
    ["game page", "/games/hollow-knight", "Hollow Knight"],
  ]) {
    test(`the ${name} fits the screen without sideways scrolling`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(ready).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("search still opens from the menu bar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Search games/ }).click();
    await expect(page.getByRole("combobox")).toBeFocused();
  });
});
