import { expect, test } from "@playwright/test";

/** Contact page happy path on a 360x800 phone (specs/contact-page.md). */
test("contact page: Call, WhatsApp, email and map links; no iframe", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "All contact details →" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("h1")).toHaveText("Contact");

  await expect(page.getByRole("link", { name: /Call us/ })).toHaveAttribute("href", "tel:+250700000000");

  const wa = new URL((await page.getByRole("link", { name: /WhatsApp us/ }).getAttribute("href")) ?? "");
  expect(wa.origin + wa.pathname).toBe("https://wa.me/250700000000");
  expect(wa.searchParams.get("text")).toBe("Hello Kinigi Hills, I have a question.");

  await expect(page.getByRole("link", { name: /Email us/ })).toHaveAttribute("href", "mailto:hello@example.com");

  const maps = page.getByRole("link", { name: /Open in Google Maps/ });
  await expect(maps).toHaveCount(2); // the drawn map card and the button
  for (const href of await maps.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
    expect(href).toMatch(/^https:\/\/www\.google\.com\/maps\//);
  }
  await expect(page.locator("iframe")).toHaveCount(0);

  await expect(page.getByRole("heading", { name: "Hours" })).toBeVisible();
  await expect(page.getByText("Reception every day, 6:00 to 22:00")).toBeVisible();
  await expect(page.getByText("From Musanze town:", { exact: false })).toBeVisible();
});

test("Kinyarwanda contact page with English fallback for untranslated lines", async ({ page }) => {
  await page.goto("/rw/contact");
  await expect(page.locator("h1")).toHaveText("Twandikire");
  await expect(page.getByText("Uvuye i Kigali: amasaha 2 n'iminota 30.")).toBeVisible();
  await expect(page.getByText("Ask us for a driver from Kigali or Musanze.")).toBeVisible();
});
