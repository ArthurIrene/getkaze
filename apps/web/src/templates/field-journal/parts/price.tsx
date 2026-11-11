import type { PriceView } from "@getkaze/core";

/**
 * Both prices are in the HTML; CSS shows the one the guest picked in the
 * header switch (no JavaScript). See field-journal.css, "Currency switch".
 */
export function Price({ price }: { price: PriceView }) {
  return (
    <>
      <span className="fj-cur-rwf">{price.rwf}</span>
      <span className="fj-cur-usd">{price.usd}</span>
    </>
  );
}
