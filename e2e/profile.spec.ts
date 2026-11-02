import type { Page } from "@playwright/test";
import { expect, test } from "./supabase";

const toast = (page: Page) => page.getByRole("status");
const titles = (page: Page) => page.getByRole("main").locator("a[href^='/games/'] .narrow");
const NOT_FOUND = "There's no public profile here. The username may be wrong, or the profile is private.";

test("anyone can see a public profile, without games whose data is broken", async ({ page, supabase }) => {
  const mika = supabase.addUser("mika", { isPublic: true });
  supabase.addEntry(mika, "portal-2", "finished", 1_000);
  supabase.addEntry(mika, "the-witcher-3-wild-hunt", "want", 2_000);
  supabase.addEntry(mika, "tomb-raider", "playing", 3_000, { slug: "tomb-raider", name: 5 });

  await page.goto("/u/mika");
  await expect(page.getByRole("heading", { level: 1, name: "Mika" })).toBeVisible();
  await expect(page.getByText("@mika")).toBeVisible();
  await expect(page.getByText("2 games")).toBeVisible();
  await expect(titles(page)).toHaveText(["The Witcher 3: Wild Hunt", "Portal 2"]);
});

test("a private profile looks the same as one that doesn't exist", async ({ page, supabase }) => {
  const sam = supabase.addUser("sam");
  supabase.addEntry(sam, "portal-2", "finished", 1_000);

  await page.goto("/u/sam");
  await expect(page.getByText(NOT_FOUND)).toBeVisible();
  await expect(titles(page)).toHaveCount(0);
  await page.goto("/u/nobody");
  await expect(page.getByText(NOT_FOUND)).toBeVisible();
});

test("your own private profile says only you can see it", async ({ page, supabase }) => {
  await supabase.signInAs(page, supabase.addUser("yers"));
  await page.goto("/u/yers");
  await expect(page.getByText("Only you can see this page.")).toBeVisible();
  await page.getByRole("link", { name: "Make it public" }).click();
  await expect(page).toHaveURL(/\/settings$/);
});

test.describe("sharing from the backlog", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Share makes the profile public and copies its link", async ({ page, supabase, baseURL }) => {
    const user = supabase.addUser("yers");
    await supabase.signInAs(page, user);
    await page.goto("/backlog");
    await page.getByRole("button", { name: "Share" }).click();
    const popover = page.getByRole("dialog");
    await popover.getByText("Public", { exact: true }).click();

    await expect(toast(page)).toHaveText("Your profile is public.");
    expect(supabase.profileOf(user)?.is_public).toBe(true);
    await expect(popover.getByRole("link", { name: `${new URL(baseURL!).host}/u/yers` })).toBeVisible();

    await popover.getByRole("button", { name: "Copy" }).click();
    await expect(toast(page)).toHaveText("Link copied.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}/u/yers`);
  });

  test("a failed change says so and stays private", async ({ page, supabase }) => {
    supabase.answer("PATCH", "/rest/v1/profiles", 500, { code: "XX000", message: "Server down" });
    await supabase.signInAs(page, supabase.addUser("yers"));
    await page.goto("/backlog");
    await page.getByRole("button", { name: "Share" }).click();
    const popover = page.getByRole("dialog");
    await popover.getByText("Public", { exact: true }).click();

    await expect(toast(page)).toHaveText("Couldn't change who sees your profile. Try again.");
    await expect(popover.getByRole("radio", { name: /Private/ })).toBeChecked();
  });
});
