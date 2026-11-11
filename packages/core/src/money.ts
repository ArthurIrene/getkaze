/** Currencies a guest can switch between (D-023). */
export const currencies = ["rwf", "usd"] as const;
export type Currency = (typeof currencies)[number];

/** Both prices are typed by the owner; there is no exchange rate (D-023). */
export type Price = { rwf: number; usd: number };

/** The owner's price in the chosen currency. */
export function priceIn(price: Price, currency: Currency): number {
  return currency === "usd" ? price.usd : price.rwf;
}

const groupWhole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const groupCents = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * "RWF 45,000", "USD 35", "USD 4.50". RWF has no decimals; USD shows cents
 * only when the price has them.
 */
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === "rwf") return `RWF ${groupWhole.format(Math.round(amount))}`;
  const cents = Math.round(amount * 100) % 100 !== 0;
  return `USD ${(cents ? groupCents : groupWhole).format(amount)}`;
}

/** The owner's price in one currency, formatted. */
export function showPrice(price: Price, currency: Currency): string {
  return formatPrice(priceIn(price, currency), currency);
}
