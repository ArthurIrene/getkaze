import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";

/** Host: the host photo, name, greeting and note. */
export async function Host({ site }: TemplateProps) {
  const t = await getTranslations("Luxe");
  return (
    <section className="tl-section tl-host" aria-labelledby="tl-host">
      <h2 id="tl-host" className="tl-section-title">{t("host")}</h2>
      {site.host.photo.src ? <PhotoSpot photo={site.host.photo} /> : <div className="tl-ph" aria-label={site.host.name} style={{ height: 240 }} />}
      <h3 className="tl-host-name">{site.host.name}</h3>
      <p className="tl-host-greeting">{site.host.greeting}</p>
      <p className="tl-host-note">{site.host.note}</p>
    </section>
  );
}
