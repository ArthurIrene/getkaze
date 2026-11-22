import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";

/** Quick facts: value and detail per fact. */
export async function Facts({ site }: TemplateProps) {
  const t = await getTranslations("Luxe");
  return (
    <section className="tl-section tl-facts" aria-labelledby="tl-facts">
      <h2 id="tl-facts" className="tl-section-title">{t("facts")}</h2>
      <ul className="tl-grid">
        {site.facts.map((f) => (
          <li key={f.id} className="tl-fact">
            <span className="tl-fact-value">{f.value}</span>
            <p className="tl-fact-detail">{f.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
