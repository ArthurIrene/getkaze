import { expect, test, type Page } from "@playwright/test";
import { createUser, insert, latestEmail, select, totp, uniqueEmail } from "./helpers/supabase";

/** Platform admin with TOTP 2FA (specs/platform-admin.md, D-060). Local Supabase only. */
const PASSWORD = "volcano-sunrise-42";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** A fresh platform admin, signed in, TOTP enrolled and verified (aal2). Returns its secret. */
async function adminSession(page: Page): Promise<{ email: string; secret: string; userId: string }> {
  const email = uniqueEmail("admin");
  const userId = await createUser(email, PASSWORD);
  await insert("platform_admins", { user_id: userId });
  await signIn(page, email);
  await expect(page).toHaveURL(/\/admin\/mfa\/enroll$/);
  await expect(page.getByAltText("QR code for your authenticator app")).toBeVisible();
  const secret = (await page.getByTestId("totp-secret").textContent())!.trim();
  await page.getByLabel("6-digit code").fill("000000");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.locator("main [role=alert]")).toHaveText("That code did not work. Try the newest one.");
  // A wrong code restarts enrolment with a new secret.
  const fresh = (await page.getByTestId("totp-secret").textContent())!.trim();
  await page.getByLabel("6-digit code").fill(totp(fresh));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
  return { email, secret: fresh, userId };
}

test("an admin enrols TOTP, and every new session needs a code before the admin opens", async ({ page, context }) => {
  const { email, secret } = await adminSession(page);
  await context.clearCookies();
  await signIn(page, email);
  // aal1: the admin screens send you to the code step, they never show data.
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.getByLabel("6-digit code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("an owner who is not an admin is sent away from the admin", async ({ page }) => {
  const email = uniqueEmail("owner");
  await createUser(email, PASSWORD);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/owner$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/owner$/);
});

test("create a business, flip a module, invite its owner and log a support session", async ({ page }) => {
  await adminSession(page);
  const suffix = Math.random().toString(36).slice(2, 7);
  const name = `Volcano View ${suffix}`;

  // Reserved and malformed slugs are refused with a reason.
  await page.goto("/admin/new");
  await page.getByLabel("Business name").fill("Admin Lodge");
  await page.getByLabel("Subdomain (slug)").fill("admin");
  await page.getByRole("button", { name: "Create business" }).click();
  await expect(page.locator("main [role=alert]")).toHaveText("That subdomain is reserved.");

  await page.getByLabel("Business name").fill(name);
  await page.getByLabel("Subdomain (slug)").fill("");
  await page.getByLabel("Type and style").selectOption("guesthouse");
  await page.getByRole("button", { name: "Create business" }).click();
  await expect(page.locator("main [role=status]")).toHaveText("Business created (draft).");
  await expect(page.getByRole("heading", { name })).toBeVisible();

  const [business] = await select("businesses", `name=eq.${encodeURIComponent(name)}&select=id,slug,status,preset,style`);
  expect(business).toMatchObject({ slug: `volcano-view-${suffix}`, status: "draft", preset: "hotel_lodge", style: "guesthouse" });
  const modules = await select("business_modules", `business_id=eq.${business!.id}&select=module_id,enabled&order=module_id`);
  expect(modules).toEqual([
    { module_id: "booking", enabled: false },
    { module_id: "menu", enabled: true },
    { module_id: "ordering", enabled: false },
  ]);

  // A draft cannot go live without a published site.
  await page.getByLabel("Status").selectOption("active");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.locator("main [role=alert]")).toHaveText("Publish the site before making it active.");

  // Module switch.
  await page.getByRole("button", { name: /Menu \+ WhatsApp orders: Off/ }).click();
  await expect(page.getByRole("button", { name: /Menu \+ WhatsApp orders: On/ })).toBeVisible();
  const ordering = await select("business_modules", `business_id=eq.${business!.id}&module_id=eq.ordering&select=enabled`);
  expect(ordering[0]!.enabled).toBe(true);
  const logged = await select("content_changes", `business_id=eq.${business!.id}&table_name=eq.business_modules&action=eq.update&select=actor_kind`);
  expect(logged.map((r) => r.actor_kind)).toContain("platform_admin");

  // Invite the owner: the email arrives, the membership is "invited".
  const ownerEmail = uniqueEmail("new-owner");
  await page.getByLabel("Owner's email").fill(ownerEmail);
  await page.getByRole("button", { name: "Invite owner" }).click();
  await expect(page.locator("main [role=status]")).toHaveText("Invite sent.");
  const mail = await latestEmail(ownerEmail);
  expect(mail.subject).toBe("You are invited to Kaze");
  const members = await select("memberships", `business_id=eq.${business!.id}&select=status,roles`);
  expect(members).toEqual([{ status: "invited", roles: ["owner"] }]);

  // Support session: open with a reason, then close. Both are in support_access.
  await page.getByLabel("Reason").fill("Setting up the rooms");
  await page.getByRole("button", { name: "Open support session" }).click();
  await expect(page.getByText("Support session open: Setting up the rooms")).toBeVisible();
  await page.getByRole("button", { name: "Close support session" }).click();
  await expect(page).toHaveURL(/support=closed$/);
  await expect(page.getByText("Support session open:")).toHaveCount(0);
  const sessions = await select("support_access", `business_id=eq.${business!.id}&select=reason,ended_at`);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]!.reason).toBe("Setting up the rooms");
  expect(sessions[0]!.ended_at).not.toBeNull();

  // The client list shows it with its status and owner state.
  await page.goto("/admin");
  const card = page.getByRole("link", { name: new RegExp(name) });
  await expect(card).toContainText("Draft");
  await expect(card).toContainText("Owner: invited");
});

test("an invited owner who accepts becomes active", async ({ page, context }) => {
  await adminSession(page);
  const name = `Accept Lodge ${Math.random().toString(36).slice(2, 7)}`;
  await page.goto("/admin/new");
  await page.getByLabel("Business name").fill(name);
  await page.getByRole("button", { name: "Create business" }).click();
  const ownerEmail = uniqueEmail("accepting");
  await page.getByLabel("Owner's email").fill(ownerEmail);
  await page.getByRole("button", { name: "Invite owner" }).click();
  await expect(page.locator("main [role=status]")).toHaveText("Invite sent.");

  await context.clearCookies();
  await page.goto((await latestEmail(ownerEmail)).link);
  await page.getByLabel("New password").fill(PASSWORD);
  await page.getByLabel("Type it again").fill(PASSWORD);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/owner\?saved=1$/);
  const [business] = await select("businesses", `name=eq.${encodeURIComponent(name)}&select=id`);
  const members = await select("memberships", `business_id=eq.${business!.id}&select=status`);
  expect(members).toEqual([{ status: "active" }]);
});
