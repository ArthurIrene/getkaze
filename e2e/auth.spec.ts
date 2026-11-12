import { expect, test } from "@playwright/test";
import { businessWithOwner, createUser, inviteUser, latestEmail, trySignUp, uniqueEmail } from "./helpers/supabase";

/** Owner login: email and password, invite only, reset by email (specs/auth.md, D-059). Local Supabase only. */
const PASSWORD = "volcano-sunrise-42";

test("an invited owner accepts the invite, sets a password and lands on Your site", async ({ page }) => {
  const email = uniqueEmail("invited");
  const userId = await inviteUser(email);
  await businessWithOwner(userId, "active", "Invite Lodge");

  const mail = await latestEmail(email);
  expect(mail.subject).toBe("You are invited to Kaze");
  expect(mail.link).toMatch(/\/auth\/confirm\?token_hash=[^&]+&type=invite$/);

  await page.goto(mail.link);
  await expect(page).toHaveURL(/\/auth\/accept$/);
  await page.getByLabel("New password").fill("short");
  await page.getByLabel("Type it again").fill("short");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("main [role=alert]")).toHaveText("At least 10 characters, not only numbers.");

  await page.getByLabel("New password").fill(PASSWORD);
  await page.getByLabel("Type it again").fill(PASSWORD);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/owner\?saved=1$/);
  await expect(page.getByRole("heading", { name: "Your site" })).toBeVisible();
  await expect(page.locator("main [role=status]")).toHaveText("Saved. You are signed in.");
});

test("wrong password and unknown email get the same answer", async ({ page }) => {
  const email = uniqueEmail("owner");
  await createUser(email, PASSWORD);
  for (const [who, pw] of [[email, "not-the-password"], [uniqueEmail("nobody"), PASSWORD]] as const) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(who);
    await page.getByLabel("Password").fill(pw);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login\?error=1$/);
    await expect(page.locator("main [role=alert]")).toHaveText("Email or password is wrong.");
  }
});

test("password reset by email, then sign in with the new password, then sign out", async ({ page }) => {
  const email = uniqueEmail("reset");
  const userId = await createUser(email, PASSWORD);
  await businessWithOwner(userId);

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.locator("main [role=status]")).toHaveText("If that email has an account, we sent a link.");

  const mail = await latestEmail(email);
  expect(mail.subject).toBe("Reset your Kaze password");
  await page.goto(mail.link);
  await expect(page).toHaveURL(/\/auth\/update-password$/);
  const fresh = "lake-kivu-evening-7";
  await page.getByLabel("New password").fill(fresh);
  await page.getByLabel("Type it again").fill(fresh);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/owner\?saved=1$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(fresh);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/owner$/);
});

test("the same reset answer for an unknown email; no account probing", async ({ page }) => {
  await page.goto("/auth/reset");
  await page.getByLabel("Email").fill(uniqueEmail("ghost"));
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.locator("main [role=status]")).toHaveText("If that email has an account, we sent a link.");
});

test("public sign-up is refused (invite only)", async () => {
  const r = await trySignUp(uniqueEmail("signup"), PASSWORD);
  expect(r.status).toBeGreaterThanOrEqual(400);
  expect(JSON.stringify(r.body)).toMatch(/signup|sign up|not allowed|disabled/i);
});

test("email links only go to fixed pages; a bad link goes to login", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=nope&type=signup&next=https://evil.example");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/auth/confirm?token_hash=nope&type=recovery&next=https://evil.example");
  await expect(page).toHaveURL(/\/login\?error=link$/);
  await page.goto("/auth/update-password");
  await expect(page).toHaveURL(/\/login$/);
});

test("a signed-in owner gets no cookie from guest pages", async ({ page, context }) => {
  const email = uniqueEmail("cookies");
  const userId = await createUser(email, PASSWORD);
  await businessWithOwner(userId);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/owner$/);
  expect((await context.cookies()).some((c) => c.name.startsWith("sb-") && c.httpOnly)).toBe(true);

  for (const path of ["/", "/rooms", "/contact", "/book", "/privacy"]) {
    const res = await page.goto(path);
    expect(res?.headers()["set-cookie"], path).toBeUndefined();
  }
});

test("a disabled owner signs in but sees no active site", async ({ page }) => {
  const email = uniqueEmail("disabled");
  const userId = await createUser(email, PASSWORD);
  await businessWithOwner(userId, "disabled");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/owner$/);
  await expect(page.getByText("No active site for this account.")).toBeVisible();
});
