import { expect, test, type Page } from "@playwright/test";
import { createUser, insert, uniqueEmail, uniqueSlug } from "./helpers/supabase";

/** Owner "Your site" (specs/owner-your-site.md). Local Supabase only. */
const PASSWORD = "volcano-sunrise-42";

async function liveBusiness(name: string, ownerId: string | null) {
  const slug = uniqueSlug("live");
  const b = await insert("businesses", { slug, name, legal_name: name, preset: "hotel_lodge", style: "lodge" });
  await insert("site_settings", {
    business_id: b.id,
    contacts: { phone: "+250 700 000 001", whatsapp: "+250 700 000 002" },
    location: { map_url: "https://maps.example.test" },
    hero: { title: { en: "Welcome" } },
    published_at: new Date().toISOString(),
  });
  await insert("business_modules", { business_id: b.id, module_id: "menu", enabled: true });
  if (ownerId) await insert("memberships", { business_id: b.id, user_id: ownerId, roles: ["owner"], status: "active" });
  return { id: b.id as string, slug };
}

async function activate(id: string) {
  // status 'active' needs a published site (set above); written as the database owner in tests.
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/businesses?id=eq.${id}`, {
    method: "PATCH",
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "active" }),
  });
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/owner$/);
}

test("an owner sees their live site, its address, modules and our support visits, and nothing of others", async ({ page }) => {
  const email = uniqueEmail("owner-site");
  const ownerId = await createUser(email, PASSWORD);
  const mine = await liveBusiness(`My Lodge ${Math.random().toString(36).slice(2, 6)}`, ownerId);
  await activate(mine.id);
  const adminId = await createUser(uniqueEmail("support-admin"), PASSWORD);
  await insert("support_access", { business_id: mine.id, admin_id: adminId, reason: "Fixing the opening hours", started_at: new Date(Date.now() - 3600_000).toISOString(), ended_at: new Date(Date.now() - 1800_000).toISOString() });
  const theirs = await liveBusiness("Someone Else's Lodge", null);
  await insert("support_access", { business_id: theirs.id, admin_id: adminId, reason: "Not yours to see" });

  await signIn(page, email);
  const card = page.locator(`[data-business="${mine.id}"]`);
  await expect(card.getByRole("heading")).toContainText("My Lodge");
  await expect(card).toContainText("Live");
  await expect(card).toContainText(`https://getkaze.vercel.app/s/${mine.slug}`);
  await expect(card.getByRole("link", { name: "Open your site ↗" })).toHaveAttribute("href", `https://getkaze.vercel.app/s/${mine.slug}`);
  await expect(card).toContainText("Menu");
  await expect(card.locator("[data-visit]")).toHaveCount(1);
  await expect(card.locator("[data-visit]")).toContainText("Fixing the opening hours");

  await expect(page.locator(`[data-business="${theirs.id}"]`)).toHaveCount(0);
  await expect(page.getByText("Someone Else's Lodge")).toHaveCount(0);
  await expect(page.getByText("Not yours to see")).toHaveCount(0);

  const help = page.getByRole("link", { name: "Need a change? WhatsApp us" });
  await expect(help).toHaveAttribute("href", /^https:\/\/wa\.me\/250700000000\?text=/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBe(0);
});

test("a draft site shows Not live yet, and the Kinyarwanda page works", async ({ page }) => {
  const email = uniqueEmail("owner-draft");
  const ownerId = await createUser(email, PASSWORD);
  const draft = await liveBusiness("Draft Lodge", ownerId);
  await signIn(page, email);
  await expect(page.locator(`[data-business="${draft.id}"]`)).toContainText("Not live yet");
  await expect(page.locator(`[data-business="${draft.id}"]`)).toContainText("No support visits yet.");
  await page.getByRole("link", { name: "RW" }).click();
  await expect(page).toHaveURL(/\/rw\/owner$/);
  await expect(page.getByRole("heading", { name: "Urubuga rwawe" })).toBeVisible();
  await expect(page.locator(`[data-business="${draft.id}"]`)).toContainText("Ntirurajya ahagaragara");
});
