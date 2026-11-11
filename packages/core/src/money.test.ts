import { describe, expect, it } from "vitest";
import { formatPrice, priceIn, showPrice } from "./money";

describe("priceIn (both prices typed by the owner, D-023)", () => {
  const price = { rwf: 45000, usd: 35 };

  it("uses the RWF price for RWF", () => {
    expect(priceIn(price, "rwf")).toBe(45000);
  });

  it("uses the USD price for USD, with no exchange rate", () => {
    expect(priceIn(price, "usd")).toBe(35);
  });
});

describe("formatPrice", () => {
  it("groups RWF thousands with no decimals", () => {
    expect(formatPrice(45000, "rwf")).toBe("RWF 45,000");
    expect(formatPrice(100000, "rwf")).toBe("RWF 100,000");
  });

  it("rounds RWF to whole francs", () => {
    expect(formatPrice(1999.6, "rwf")).toBe("RWF 2,000");
  });

  it("shows whole USD without cents and cents when present", () => {
    expect(formatPrice(35, "usd")).toBe("USD 35");
    expect(formatPrice(4.5, "usd")).toBe("USD 4.50");
    expect(formatPrice(1250.25, "usd")).toBe("USD 1,250.25");
  });
});

describe("showPrice", () => {
  it("formats the owner's price in the chosen currency", () => {
    expect(showPrice({ rwf: 6000, usd: 4.5 }, "usd")).toBe("USD 4.50");
    expect(showPrice({ rwf: 6000, usd: 4.5 }, "rwf")).toBe("RWF 6,000");
  });
});
