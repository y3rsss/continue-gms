import type { Page } from "@playwright/test";
import { PASSWORD, expect, test } from "./supabase";

const dialog = (page: Page) => page.getByRole("dialog");
const toast = (page: Page) => page.getByRole("status");

async function openSignIn(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(dialog(page)).toBeVisible();
}

async function signIn(page: Page, email: string, password: string) {
  await dialog(page).getByLabel("Email").fill(email);
  await dialog(page).getByLabel("Password", { exact: true }).fill(password);
  await dialog(page).getByRole("button", { name: "Sign in" }).click();
}

test("signs in with email and password, and out again", async ({ page, supabase }) => {
  supabase.addUser("yers");
  await openSignIn(page);
  await signIn(page, "yers@example.com", PASSWORD);
  await expect(toast(page)).toHaveText("Signed in. Welcome back.");
  await expect(dialog(page)).toBeHidden();

  await page.getByRole("button", { name: "Account menu" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toContainText("Yers");
  await expect(menu).toContainText("@yers");
  await expect(menu).toContainText("Private");

  await menu.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(toast(page)).toHaveText("Signed out.");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("a wrong password says so", async ({ page, supabase }) => {
  supabase.addUser("yers");
  await openSignIn(page);
  await signIn(page, "yers@example.com", "Wrong-horse-1");
  await expect(dialog(page)).toContainText("Wrong email or password.");
});

test("an unconfirmed email can ask for the link again", async ({ page, supabase, baseURL }) => {
  supabase.addUser("yers", { confirmed: false });
  await openSignIn(page);
  await signIn(page, "yers@example.com", PASSWORD);
  await expect(dialog(page)).toContainText("Confirm your email first.");

  await dialog(page).getByRole("button", { name: "Send it again" }).click();
  await expect(dialog(page)).toContainText("Check your inbox");
  expect(supabase.emails).toEqual([{ kind: "resend", email: "yers@example.com", redirectTo: baseURL }]);
});

test("signing up sends a confirmation email and makes the profile", async ({ page, supabase, baseURL }) => {
  await openSignIn(page);
  await dialog(page).getByRole("radio", { name: "New game" }).click();
  await dialog(page).getByLabel("Email").fill("New.Player@example.com");
  await expect(dialog(page)).toContainText("You'll be @newplayer");

  await dialog(page).getByLabel("Password", { exact: true }).fill("short");
  await dialog(page).getByRole("button", { name: "Create account" }).click();
  await expect(dialog(page)).toContainText("Your password needs 8+ characters");

  await dialog(page).getByLabel("Password", { exact: true }).fill(PASSWORD);
  await dialog(page).getByRole("button", { name: "Create account" }).click();
  await expect(dialog(page)).toContainText("We sent a confirmation link to New.Player@example.com");
  expect(supabase.profiles.map((p) => p.username)).toEqual(["newplayer"]);
  expect(supabase.emails).toEqual([{ kind: "signup", email: "New.Player@example.com", redirectTo: baseURL }]);
});

test("a forgotten password gets a reset link to the reset page", async ({ page, supabase, baseURL }) => {
  await openSignIn(page);
  await dialog(page).getByLabel("Email").fill("yers@example.com");
  await dialog(page).getByRole("button", { name: "Forgot it?" }).click();
  await expect(dialog(page)).toContainText("Forgot password");
  await dialog(page).getByRole("button", { name: "Send reset link" }).click();
  await expect(dialog(page)).toContainText("If yers@example.com has an account");
  expect(supabase.emails).toEqual([
    { kind: "reset", email: "yers@example.com", redirectTo: `${baseURL}/reset-password` },
  ]);
});

test("only providers switched on in Supabase get a button", async ({ page, supabase }) => {
  supabase.providers.google = false;
  await openSignIn(page);
  await expect(dialog(page).getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  await expect(dialog(page).getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
});

test("an expired email link explains itself and cleans up the address", async ({ page }) => {
  await page.goto("/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid");
  await expect(toast(page)).toHaveText("That link expired or was already used. Ask for a new one.");
  await expect(page).toHaveURL(/\/$/);
});

test.describe("the reset password page", () => {
  test("asks for the email link when opened signed out", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Open this page from the link in your password reset email.")).toBeVisible();
  });

  test("saves a new password", async ({ page, supabase }) => {
    const user = supabase.addUser("yers");
    await supabase.signInAs(page, user);
    await page.goto("/reset-password");
    await expect(page.getByText("Signed in as yers@example.com")).toBeVisible();

    await page.getByLabel("New password").fill("Brand-new-pass-2");
    await page.getByLabel("Repeat it").fill("Brand-new-pass-3");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page.getByText("The two passwords don't match.")).toBeVisible();

    await page.getByLabel("Repeat it").fill("Brand-new-pass-2");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(toast(page)).toHaveText("Password saved.");
    await expect(page).toHaveURL(/\/$/);
    expect(user.password).toBe("Brand-new-pass-2");
  });
});
