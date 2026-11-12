import { expect, test } from "@playwright/test";
import { insert, select, uniqueSlug } from "./helpers/supabase";

/**
 * Guest sites come from the database (specs/demo-lodge-database.md).
 * Local Supabase only; each test makes its own businesses.
 */
async function business(status: "draft" | "active" | "paused", published: boolean, name: string) {
  const slug = uniqueSlug("db");
  const b = await insert("businesses", { slug, name, legal_name: `${name} Ltd`, preset: "hotel_lodge", style: "guesthouse" });
  await insert("site_settings", {
    business_id: b.id,
    contacts: { phone: "+250 700 111 222", whatsapp: "+250 700 111 333" },
    location: { map_url: "https://maps.example.test", area: { en: "Musanze town" }, directions: [], address: { locality: "Musanze", region: "Musanze", country: "RW" } },
    hero: { title: { en: `Welcome to ${name}` }, line: { en: "in town" } },
    sections: [{ id: "hero", visible: true }, { id: "rooms", visible: true }, { id: "findUs", visible: true }],
    stay: { checkIn: "13:00", checkOut: "11:00", breakfastIncluded: false, notes: [] },
    booking_payments: ["lodge"],
    published_at: published ? new Date().toISOString() : null,
  });
  await insert("catalog_items", { business_id: b.id, kind: "room_type", handle: "twin", name: { en: "Twin Room" }, price_rwf: 30000, price_usd: 22, max_guests: 2 });
  if (status !== "draft") {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/businesses?id=eq.${b.id}`, {
      method: "PATCH",
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }
  return slug;
}

test("the demo lodge is a published business in the database", async () => {
  const [demo] = await select("businesses", "slug=eq.kinigi-hills&select=status,name");
  expect(demo).toEqual({ status: "active", name: "Kinigi Hills" });
});

test("a new active, published business shows at /s/<slug> without a rebuild", async ({ page }) => {
  const slug = await business("active", true, "Town Guesthouse");
  const res = await page.goto(`/s/${slug}/rooms`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".fj-logo")).toHaveText("Town Guesthouse");
  await expect(page.locator("#room-twin h2")).toHaveText("Twin Room");
  await expect(page.locator("#room-twin .fj-room-price .fj-cur-rwf")).toHaveText("RWF 30,000");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://getkaze.vercel.app/s/${slug}/rooms`);
});

test("draft, unpublished and paused businesses are a clean 404 with no business data", async ({ page }) => {
  for (const [status, published, name] of [["draft", false, "Draft Inn"], ["active", false, "Unpublished Inn"], ["paused", true, "Paused Inn"]] as const) {
    const slug = await business(status, published, name);
    const res = await page.goto(`/s/${slug}`);
    expect(res?.status(), name).toBe(404);
    await expect(page.getByRole("heading", { name: "This site is not available" }), name).toBeVisible();
    await expect(page.getByText(name), name).toHaveCount(0);
  }
});
