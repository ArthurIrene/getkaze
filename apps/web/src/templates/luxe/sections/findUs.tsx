import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";

/** Find us: map link, area, directions and address. */
export async function FindUs({ site }: TemplateProps) {
  const t = await getTranslations("Luxe");
  return (
    <section className="tl-section tl-findus" aria-labelledby="tl-findus">
      <h2 id="tl-findus" className="tl-section-title">{t("findUs")}</h2>
      <a href={site.location.mapUrl} className="tl-map-link" target="_blank" rel="noopener">
        {t("here")}
      </a>
      <div className="tl-area">{site.location.area}</div>
      {site.location.directions.map((d, i) => (
        <p key={i} className="tl-direction">{d}</p>
      ))}
      <address className="tl-address">{site.location.address.locality}, {site.location.address.region}</address>
    </section>
  );
}
