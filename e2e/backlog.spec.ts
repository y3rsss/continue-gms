import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type { Game } from "../shared/types";
import { mockApi } from "./mock";

const games: Game[] = JSON.parse(
  readFileSync(new URL("./fixtures/games.json", import.meta.url), "utf8"),
).results;

const stamps = {
  "grand-theft-auto-v": "want",
  "the-witcher-3-wild-hunt": "want",
  "tomb-raider": "want",
  "red-dead-redemption-2": "want",
  "counter-strike-global-offensive": "playing",
};

async function seedBacklog(page: Page, backlog: Record<string, string>) {
  const entries = Object.fromEntries(
    Object.entries(backlog).map(([slug, status], i) => [
      slug,
      { status, game: games.find((game) => game.slug === slug), updatedAt: 100 - i },
    ]),
  );
  await page.addInitScript((data) => localStorage.setItem("continue.backlog", data), JSON.stringify(entries));
}

const titles = (page: Page) => page.getByRole("main").locator("a[href^='/games/'] .narrow");
const coverRow = (page: Page) => page.getByRole("heading", { name: "Want to play, on sale" });

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("On sale keeps the status and sorts by biggest discount", async ({ page }) => {
  await seedBacklog(page, stamps);
  await page.goto("/backlog");
  await page.getByRole("button", { name: /Want to play 4/ }).click();
  await page.getByRole("button", { name: /On sale 2/ }).click();
  await expect(page).toHaveURL(/status=want/);
  await expect(page).toHaveURL(/sale=1/);
  await expect(titles(page)).toHaveText(["The Witcher 3: Wild Hunt", "Tomb Raider"]);

  await page.getByRole("button", { name: /Sorted by/ }).click();
  await page.getByRole("menuitem", { name: "Biggest discount" }).click();
  await expect(titles(page)).toHaveText(["Tomb Raider", "The Witcher 3: Wild Hunt"]);
  await expect(page).toHaveURL(/sort=discount/);
});

test("a free game doesn't count as on sale", async ({ page }) => {
  await seedBacklog(page, stamps);
  await page.goto("/backlog?status=playing&sale=1");
  await expect(page.getByText("Nothing here is on sale right now.")).toBeVisible();
});

test("says when prices can't load, and a price sort still lists the games", async ({ page }) => {
  await page.route("**/api/prices**", (route) =>
    route.fulfill({ status: 400, contentType: "application/json", body: '{"error":"Invalid games"}' }),
  );
  await seedBacklog(page, stamps);
  await page.goto("/backlog?sale=1");
  await expect(
    page.getByText("Couldn't load prices. Check your connection and reload the page."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "On sale", exact: true })).toBeVisible();

  await page.goto("/backlog?sort=price");
  await expect(titles(page)).toHaveCount(5);
});

test("the cover shows Want to play games on sale, biggest discount first", async ({ page }) => {
  await seedBacklog(page, stamps);
  await page.goto("/");
  const row = page.locator("section", { has: coverRow(page) });
  await expect(row.locator(".narrow")).toHaveText(["Tomb Raider", "The Witcher 3: Wild Hunt"]);

  await row.getByRole("link", { name: "See all" }).click();
  await expect(page).toHaveURL(/\/backlog\?status=want&sale=1&sort=discount/);
  await expect(titles(page)).toHaveText(["Tomb Raider", "The Witcher 3: Wild Hunt"]);
});

test("the cover leaves the row out when nothing on Want to play is on sale", async ({ page }) => {
  await seedBacklog(page, {
    "grand-theft-auto-v": "want",
    "red-dead-redemption-2": "want",
    "tomb-raider": "finished",
  });
  await page.goto("/");
  await expect(page.getByText("Best price").first()).toBeAttached();
  await expect(coverRow(page)).toHaveCount(0);
});
