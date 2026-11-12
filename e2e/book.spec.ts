import { expect, test, type Page } from "@playwright/test";

/**
 * Booking request happy path (specs/booking-request.md, D-044 launch mode).
 * The form's POST to /book/send is routed to the real server and its 303
 * status and Location are read, so no request goes to wa.me or a mail app.
 */

function isoInDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kigali" }).format(d);
}

/** Same date wording as the server (packages/core formatStayDate). */
function stayDate(iso: string, locale: "en" | "rw"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** The business's stored WhatsApp number and email in the demo data. */
const STORED_WA = "https://wa.me/250700000000";
const STORED_MAIL = "mailto:hello@example.com";
const waLocation = (text: string) => `${STORED_WA}?text=${encodeURIComponent(text)}`;
const mailLocation = (subject: string, body: string) =>
  `${STORED_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

type Sent = { status: number; location: string };

/**
 * Catch the form's POST /book/send and its redirect. Playwright routes only the
 * first URL of a redirect chain, so the POST itself is routed: it goes to the
 * real server (route.fetch, no redirects followed), status and Location are
 * kept, and the browser gets a stub page instead of opening wa.me or mail.
 */
async function catchSend(page: Page): Promise<() => Sent | undefined> {
  let sent: Sent | undefined;
  await page.route("**/book/send", async (route) => {
    const response = await route.fetch({ maxRedirects: 0 });
    sent = { status: response.status(), location: response.headers()["location"] ?? "" };
    return route.fulfill({ status: 200, contentType: "text/plain", body: "intercepted" });
  });
  return () => sent;
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
  const caught = await catchSend(page);
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

  const sent = caught()!;
  expect(sent.status).toBe(303);
  const url = new URL(sent.location);
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
  // Exactly the stored number with the full prefilled message.
  expect(sent.location).toBe(
    waLocation(
      [
        "Hello Kinigi Hills! I would like to request:",
        "Room: Volcano View Double",
        `Dates: ${stayDate(isoInDays(30), "en")} to ${stayDate(isoInDays(33), "en")} (3 nights)`,
        "Guests: 2 adults",
        "Quoted total: RWF 240,000 (3 × RWF 80,000)",
        "I would like to pay by: MTN MoMo",
        "Name: Anna Becker",
        "Note: Late arrival, around 21:00",
      ].join("\n"),
    ),
  );
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
  const caught = await catchSend(page);
  await page.goto("/rw/book?room=garden-double");
  await expect(page.locator("h1")).toHaveText("Reba ibyumba bihari");
  await page.locator('input[name="checkIn"]').fill(isoInDays(5));
  await page.locator('input[name="checkOut"]').fill(isoInDays(6));
  await page.locator('input[name="name"]').fill("Aline");
  await page.getByRole("button", { name: "Ohereza kuri WhatsApp" }).click();
  await expect.poll(caught).toBeDefined();
  const sent = caught()!;
  expect(sent.status).toBe(303);
  const text = new URL(sent.location).searchParams.get("text") ?? "";
  expect(text).toContain("Muraho Kinigi Hills! Ndifuza:");
  expect(text).toContain("Icyumba: Garden Double");
  expect(text).toContain("Izina: Aline");
  expect(sent.location).toBe(
    waLocation(
      [
        "Muraho Kinigi Hills! Ndifuza:",
        "Icyumba: Garden Double",
        `Amatariki: ${stayDate(isoInDays(5), "rw")} kugeza ${stayDate(isoInDays(6), "rw")} (amajoro 1)`,
        "Abashyitsi: abakuru 2",
        "Igiciro cyagereranyijwe: USD 45 (1 × USD 45)",
        "Nifuza kwishyura binyuze kuri: Kuri lodge (amafaranga cyangwa ikarita)",
        "Izina: Aline",
      ].join("\n"),
    ),
  );
});

test("Send by email opens a mailto to the stored address with the full request", async ({ page }) => {
  const caught = await catchSend(page);
  await page.goto("/book?room=garden-single");
  await page.locator('input[name="checkIn"]').fill(isoInDays(20));
  await page.locator('input[name="checkOut"]').fill(isoInDays(22));
  await page.locator('input[name="adults"]').fill("1");
  await page.getByLabel("Bank transfer").check();
  await page.getByLabel("Your name").fill("Ann");
  await page.getByRole("button", { name: "Send by email" }).click();
  await expect.poll(caught).toBeDefined();
  const sent = caught()!;
  expect(sent.status).toBe(303);
  const from = stayDate(isoInDays(20), "en");
  const to = stayDate(isoInDays(22), "en");
  expect(sent.location).toBe(
    mailLocation(
      `Booking request: Garden Single, ${from} to ${to}`,
      [
        "Hello Kinigi Hills! I would like to request:",
        "Room: Garden Single",
        `Dates: ${from} to ${to} (2 nights)`,
        "Guests: 1 adult",
        "Quoted total: USD 70 (2 × USD 35)",
        "I would like to pay by: Bank transfer",
        "Name: Ann",
      ].join("\n"),
    ),
  );
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the form still sends", async ({ page }) => {
    const caught = await catchSend(page);
    await page.goto("/book?room=garden-double");
    await fillForm(page);
    await page.getByRole("button", { name: "Send by WhatsApp" }).click();
    await expect.poll(caught).toBeDefined();
    const sent = caught()!;
    expect(sent.status).toBe(303);
    expect(new URL(sent.location).searchParams.get("text")).toContain("Room: Garden Double");
    expect(sent.location).toBe(
      waLocation(
        [
          "Hello Kinigi Hills! I would like to request:",
          "Room: Garden Double",
          `Dates: ${stayDate(isoInDays(30), "en")} to ${stayDate(isoInDays(33), "en")} (3 nights)`,
          "Guests: 2 adults",
          "Quoted total: USD 135 (3 × USD 45)",
          "I would like to pay by: MTN MoMo",
          "Name: Anna Becker",
          "Note: Late arrival, around 21:00",
        ].join("\n"),
      ),
    );
  });
});
