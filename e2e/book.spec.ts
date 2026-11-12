import { expect, test, type Page } from "@playwright/test";

/**
 * Booking request happy path (specs/booking-request.md, D-044 launch mode).
 * wa.me is intercepted with page.route, so no request leaves the test.
 */

function isoInDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kigali" }).format(d);
}

async function catchWhatsApp(page: Page): Promise<() => URL | undefined> {
  let caught: URL | undefined;
  await page.route("https://wa.me/**", (route) => {
    caught = new URL(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/plain", body: "intercepted" });
  });
  return () => caught;
}

async function fillForm(page: Page) {
  await page.locator('input[name="checkIn"]').fill(isoInDays(30));
  await page.locator('input[name="checkOut"]').fill(isoInDays(33));
  await page.locator('input[name="adults"]').fill("2");
  await page.getByLabel("MTN MoMo").check();
  await page.getByLabel("Your name").fill("Anna Becker");
  await page.getByLabel("Note (optional)").fill("Late arrival, around 21:00");
}

test("sticky bar and Check dates open the form; sending opens WhatsApp with the request", async ({ page }) => {
  const caught = await catchWhatsApp(page);
  await page.goto("/");
  await expect(page.locator(".fj-bar-main")).toHaveAttribute("href", "/book");

  await page.goto("/rooms");
  await page.locator("#room-volcano-view-double").getByRole("link", { name: "Check dates" }).click();
  await expect(page).toHaveURL(/\/book\?room=volcano-view-double$/);
  await expect(page.locator('input[name="room"][value="volcano-view-double"]')).toBeChecked();

  // The quoted total follows the header's currency switch.
  await page.locator('label[for="fj-cur-rwf"]').click();
  await fillForm(page);
  await page.getByRole("button", { name: "Send by WhatsApp" }).click();
  await expect.poll(caught).toBeDefined();

  const url = caught()!;
  expect(url.origin + url.pathname).toBe("https://wa.me/250700000000");
  const text = url.searchParams.get("text") ?? "";
  expect(text.split("\n")).toEqual([
    "Hello Kinigi Hills! I would like to request:",
    "Room: Volcano View Double",
    expect.stringMatching(/^Dates: \w{3}, \d{1,2} \w{3} \d{4} to \w{3}, \d{1,2} \w{3} \d{4} \(3 nights\)$/),
    "Guests: 2 adults",
    "Quoted total: RWF 240,000 (3 × RWF 80,000)",
    "I would like to pay by: MTN MoMo",
    "Name: Anna Becker",
    "Note: Late arrival, around 21:00",
  ]);
});

test("too many guests leads to an error page that carries no guest details", async ({ page }) => {
  await page.goto("/book?room=garden-single");
  await fillForm(page);
  await page.getByRole("button", { name: "Send by WhatsApp" }).click();
  await expect(page).toHaveURL(/\/book\/error\?reason=guests&max=1$/);
  await expect(page.locator(".fj-book-error")).toContainText("This room sleeps up to 1.");
  expect(page.url()).not.toContain("Anna");
});

test("the route ignores planted targets and caps long fields", async ({ request }) => {
  const res = await request.post("/book/send", {
    maxRedirects: 0,
    form: {
      room: "garden-double",
      checkIn: isoInDays(10),
      checkOut: isoInDays(12),
      adults: "2",
      pay: "lodge",
      name: "N".repeat(500),
      note: "x".repeat(5000),
      via: "whatsapp",
      whatsapp: "+1 555 000 0000",
      email: "attacker@evil.example",
      location: "https://evil.example",
    },
  });
  expect(res.status()).toBe(303);
  const location = res.headers()["location"] ?? "";
  expect(location.startsWith("https://wa.me/250700000000?text=")).toBe(true);
  expect(location).not.toContain("evil");
  const text = new URL(location).searchParams.get("text") ?? "";
  expect(text).toContain(`Name: ${"N".repeat(80)}\n`);
  expect(text.length).toBeLessThanOrEqual(1200);
  expect(res.headers()["cache-control"]).toBe("no-store");

  const email = await request.post("/book/send", {
    maxRedirects: 0,
    form: { room: "garden-double", checkIn: isoInDays(10), checkOut: isoInDays(12), adults: "1", pay: "bank", name: "Ann", via: "email", email: "attacker@evil.example" },
  });
  expect(email.headers()["location"]).toMatch(/^mailto:hello@example\.com\?subject=/);
});

test("Kinyarwanda form sends the message in Kinyarwanda", async ({ page }) => {
  const caught = await catchWhatsApp(page);
  await page.goto("/rw/book?room=garden-double");
  await expect(page.locator("h1")).toHaveText("Reba ibyumba bihari");
  await page.locator('input[name="checkIn"]').fill(isoInDays(5));
  await page.locator('input[name="checkOut"]').fill(isoInDays(6));
  await page.locator('input[name="name"]').fill("Aline");
  await page.getByRole("button", { name: "Ohereza kuri WhatsApp" }).click();
  await expect.poll(caught).toBeDefined();
  const text = caught()!.searchParams.get("text") ?? "";
  expect(text).toContain("Muraho Kinigi Hills! Ndifuza:");
  expect(text).toContain("Icyumba: Garden Double");
  expect(text).toContain("Izina: Aline");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the form still sends", async ({ page }) => {
    const caught = await catchWhatsApp(page);
    await page.goto("/book?room=garden-double");
    await fillForm(page);
    await page.getByRole("button", { name: "Send by WhatsApp" }).click();
    await expect.poll(caught).toBeDefined();
    expect(caught()!.searchParams.get("text")).toContain("Room: Garden Double");
  });
});
