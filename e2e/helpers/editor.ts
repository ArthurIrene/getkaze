import { expect, type Page } from "@playwright/test";
import { createUser, insert, uniqueEmail, uniqueSlug } from "./supabase";

/** Fixtures for the editor tests (local Supabase only). */
export const PASSWORD = "volcano-sunrise-42";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** An active, published lodge with one room and its owner (signed-in tests use the owner's email). */
export async function liveLodge(name = `Edit Lodge ${Math.random().toString(36).slice(2, 6)}`) {
  const email = uniqueEmail("editor");
  const ownerId = await createUser(email, PASSWORD);
  const slug = uniqueSlug("edit");
  const b = await insert("businesses", { slug, name, legal_name: name, preset: "hotel_lodge", style: "lodge" });
  await insert("site_settings", {
    business_id: b.id,
    contacts: { phone: "+250 700 000 001", whatsapp: "+250 700 000 002" },
    location: { map_url: "https://maps.app.goo.gl/example", area: { en: "Kinigi" } },
    hours: [{ en: "Reception: 24 hours" }],
    hero: { title: { en: "Welcome" } },
    sections: [{ id: "hero", visible: true }, { id: "rooms", visible: true }, { id: "findUs", visible: true }],
    published_at: new Date().toISOString(),
  });
  await insert("memberships", { business_id: b.id, user_id: ownerId, roles: ["owner"], status: "active" });
  await insert("catalog_items", { business_id: b.id, kind: "room_type", handle: "garden", name: { en: "Garden room" }, price_rwf: 60000, price_usd: 45, max_guests: 2, units: 2 });
  await rest(`businesses?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
  return { id: b.id as string, slug, name, email, ownerId };
}

export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/owner$/);
}

export async function noSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
}
