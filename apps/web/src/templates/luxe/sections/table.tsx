import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { Price } from "../parts/price";

/** Table: the dining name and dishes with prices. */
export async function Table({ site }: TemplateProps) {
  return (
    <section className="tl-section tl-table" aria-labelledby="tl-table">
      <h2 id="tl-table" className="tl-section-title">{site.dining.name}</h2>
      <ul className="tl-grid">
        {site.dining.dishes.map((d) => (
          <li key={d.id} className="tl-dish">
            <h3 className="tl-dish-name">{d.name}</h3>
            <p className="tl-dish-price"><Price price={d.price} /></p>
          </li>
        ))}
      </ul>
    </section>
  );
}
