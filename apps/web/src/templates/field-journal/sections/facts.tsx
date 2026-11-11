import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { Drawing } from "../parts/icons";

/** Quick facts: three stamps, tap one for the detail (<details>, no JavaScript). */
export async function Facts({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section aria-label={t("facts")} className="fj-facts">
      {site.facts.map((fact) => (
        <details key={fact.id} className="fj-fact">
          <summary>
            <Drawing icon={fact.icon} size={30} />
            <b>{fact.value}</b>
          </summary>
          <p className="fj-fade">{fact.detail}</p>
        </details>
      ))}
    </section>
  );
}
