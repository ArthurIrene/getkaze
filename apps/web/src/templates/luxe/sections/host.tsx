import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";

/** Host: the host name, greeting and note (photo removed on home). */
export async function Host({ site }: TemplateProps) {
  const t = await getTranslations("Luxe");
  return (
    <section className="tl-section tl-host" aria-labelledby="tl-host">
      <h2 id="tl-host" className="tl-section-title">{t("host")}</h2>
      <div className="tl-ph" aria-label={site.host.name} style={{ height: 160 }} />
      <h3 className="tl-host-name">{site.host.name}</h3>
      <p className="tl-host-greeting">{site.host.greeting}</p>
      <p className="tl-host-note">{site.host.note}</p>
    </section>
  );
}
