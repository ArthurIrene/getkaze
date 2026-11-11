import { getTranslations } from "next-intl/server";
import { whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { Price } from "../parts/price";

/**
 * At our table: dining room and featured dishes, with a plain
 * "Reserve a table" WhatsApp button (D-046). Shown only with the menu module.
 */
export async function Table({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section aria-labelledby="fj-table">
      <div className="fj-head fj-rise">
        <div>
          <span className="fj-hand fj-kicker">{t("tableKicker")}</span>
          <h2 id="fj-table">{t("table")}</h2>
        </div>
      </div>
      <div className="fj-dining">
        <PhotoSpot photo={site.dining.photo} icon="fire" iconSize={64} />
        <span className="fj-hand fj-dining-name">{site.dining.name}</span>
        <a className="fj-dining-cta" href={whatsAppLink(site.contacts.whatsapp, t("reserveMessage", { name: site.name }))}>
          {t("reserve")}
        </a>
      </div>
      <ul className="fj-dishes">
        {site.dining.dishes.map((dish) => (
          <li key={dish.id} className="fj-dish">
            <PhotoSpot photo={dish.photo} icon={dish.icon} iconSize={52} />
            <b>{dish.name}</b>
            <span className="fj-mono">
              <Price price={dish.price} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
