import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { pageHref } from "../parts/links";

const categoryKeys: Record<string, string> = {
  wildlife: "experiencesCategoryWildlife",
  hiking: "experiencesCategoryHiking",
  culture: "experiencesCategoryCulture",
};

export async function Experiences({ site, locale }: TemplateProps) {
  const t = await getTranslations("Luxe");
  const categories = ["wildlife", "hiking", "culture"] as const;
  const allActivities = site.activities.filter((a) => a.category && categories.includes(a.category));
  return (
    <section className="tl-section tl-experiences" aria-labelledby="tl-experiences">
      <h2 id="tl-experiences" className="tl-section-title">{t("experiencesTitle")}</h2>
      <p className="tl-section-line">{t("experiencesLine")}</p>
      <nav className="tl-experiences-filter" aria-label={t("experiencesFilterAll")}>
        <details className="tl-filter">
          <summary className="tl-filter-summary">{t("experiencesFilterAll")}</summary>
          <ul className="tl-filter-list">
            <li><a href={pageHref("experiences", locale)}>{t("experiencesFilterAll")}</a></li>
            <li><a href={`${pageHref("experiences", locale)}?category=wildlife`}>{t("experiencesFilterWildlife")}</a></li>
            <li><a href={`${pageHref("experiences", locale)}?category=hiking`}>{t("experiencesFilterHiking")}</a></li>
            <li><a href={`${pageHref("experiences", locale)}?category=culture`}>{t("experiencesFilterCulture")}</a></li>
          </ul>
        </details>
      </nav>
      <ul className="tl-grid tl-activity-grid">
        {allActivities.map((activity, i) => {
          const [first] = activity.photos ?? [];
          return (
            <li key={activity.id} className="tl-activity">
              <article className="tl-activity-card">
                {i === 0 && first ? (
                  <PhotoSpot photo={first} sizes="(min-width: 760px) 33vw, (min-width: 480px) 50vw, 100vw" />
                ) : (
                  <div className="tl-ph" aria-label={activity.name} style={{ height: 180 }} />
                )}
                {activity.category && (
                  <span className="tl-badge tl-badge--category">
                    {t(categoryKeys[activity.category] as "experiencesCategoryWildlife" | "experiencesCategoryHiking" | "experiencesCategoryCulture")}
                  </span>
                )}
                <h3 className="tl-activity-name">{activity.name}</h3>
                <p className="tl-activity-line">{activity.line}</p>
                {activity.distance && <p className="tl-activity-distance">{activity.distance}</p>}
                <a href={`/my-stay?activity=${activity.id}&group=experience`} className="tl-activity-plan">
                  {t("experiencesPlan")}
                </a>
              </article>
            </li>
          );
        })}
      </ul>
      {allActivities.length === 0 && <p className="tl-empty">{t("experiencesEmpty")}</p>}
    </section>
  );
}