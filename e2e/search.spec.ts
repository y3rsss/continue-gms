import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "Valheim" })).toBeVisible();
});

test("Ctrl+K opens search and Enter opens the top result", async ({ page }) => {
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();

  await input.fill("hollow");
  await expect(page.getByRole("option").first()).toContainText("Hollow Knight");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/games\/hollow-knight$/);
  await expect(page.getByRole("heading", { level: 1, name: "Hollow Knight" })).toBeVisible();
});

test("See all results opens the index for the typed search", async ({ page }) => {
  await page.getByRole("button", { name: /Search games/ }).click();
  await page.getByRole("combobox").fill("hollow");
  await page.getByRole("option", { name: /See all results/ }).click();
  await expect(page).toHaveURL(/\/games\?search=hollow/);
});

test("Escape closes search", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
