import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/games/hollow-knight");
  await expect(page.getByRole("heading", { level: 1, name: "Hollow Knight" })).toBeVisible();
});

test("shows where to buy with prices and the record low", async ({ page }) => {
  await expect(page.getByRole("link", { name: /Steam\s*\$14\.99/ })).toBeVisible();
  await expect(page.getByText("Lowest price ever: $2.99 in Apr 2024")).toBeVisible();
  await expect(page.getByRole("button", { name: /Show all 7 stores/ })).toBeVisible();
});

test("a backlog stamp shows up on My backlog", async ({ page }) => {
  const playing = page.getByRole("button", { name: "Playing", exact: true });
  await playing.click();
  await expect(playing).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "My backlog" }).click();
  await expect(page.getByRole("button", { name: /Playing 1/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Hollow Knight/ })).toBeVisible();
});

test("the gallery opens on the main image and wraps around", async ({ page }) => {
  const counter = page.getByRole("dialog").locator("span.wide").first();

  await page.getByRole("button", { name: "Open Hollow Knight screenshots" }).click();
  await expect(counter).toHaveText(/02\s*\/\s*12/);

  await page.keyboard.press("ArrowRight");
  await expect(counter).toHaveText(/03\s*\/\s*12/);

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(counter).toHaveText(/12\s*\/\s*12/);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the screenshot grid leaves out the main image", async ({ page }) => {
  const tiles = page.getByRole("button", { name: /^Open Hollow Knight screenshot \d+$/ });
  await expect(tiles.first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Hollow Knight screenshot 2" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Show all 12 screenshots and trailers/ })).toBeVisible();
});
