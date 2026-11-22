import type { PriceView } from "@getkaze/core";

/** Both prices in the HTML; CSS shows the one the guest picked (no JavaScript). */
export function Price({ price }: { price: PriceView }) {
  return (
    <>
      <span className="tl-cur-rwf">{price.rwf}</span>
      <span className="tl-cur-usd">{price.usd}</span>
    </>
  );
}
