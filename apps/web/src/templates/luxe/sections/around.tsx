import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";

/** Around: activities with name, line, distance and optional photo. */
export async function Around({ site }: TemplateProps) {
  const t = await getTranslations("Luxe");
  return (
    <section className="tl-section tl-around">
      <h2 className="tl-section-title">{t("around")}</h2>
      <ul className="tl-grid">
        {site.activities.map((a) => (
          <li key={a.id} className="tl-activity">
            {a.photo ? <PhotoSpot photo={a.photo} sizes="(min-width: 760px) 50vw, 100vw" /> : <div className="tl-ph" aria-label={a.name} style={{ height: 200 }} />}
            <h3 className="tl-activity-name">{a.name}</h3>
            <p className="tl-activity-line">{a.line}</p>
            <span className="tl-activity-distance">{a.distance}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
