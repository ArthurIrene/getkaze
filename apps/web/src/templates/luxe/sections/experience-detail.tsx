import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";
import { pageHref } from "../parts/links";

const categoryKeys: Record<string, string> = {
  wildlife: "experiencesCategoryWildlife",
  hiking: "experiencesCategoryHiking",
  culture: "experiencesCategoryCulture",
};

const arrangedByKeys: Record<string, string> = {
  own_guides: "experienceArrangedByOwn",
  licensed_partner: "experienceArrangedByPartner",
};

export async function ExperienceDetail({ site, locale, query }: TemplateProps) {
  const t = await getTranslations("Luxe");
  const slug = query?.slug;
  const activity = site.activities.find((a) => a.id === slug);
  if (!activity) notFound();

  const hero = activity.photos?.[0] ?? activity.photo;
  const planUrl = `${pageHref("myStay", locale)}?activity=${activity.id}&group=experience`;

  return (
    <section className="tl-section tl-experience-detail" aria-labelledby="tl-experience-detail">
      <h1 id="tl-experience-detail" className="tl-section-title">{activity.name}</h1>
      {hero && hero.src && (
        <div className="tl-experience-hero">
          <PhotoSpot
            photo={hero}
            sizes="(min-width: 760px) 66vw, (min-width: 480px) 90vw, 100vw"
            fetchPriority="high"
          />
        </div>
      )}
      <div className="tl-experience-meta">
        {activity.line && <p className="tl-section-line">{activity.line}</p>}
        {activity.distance && <p className="tl-experience-distance">{activity.distance}</p>}
        {activity.duration && (
          <p className="tl-experience-duration">{t("experienceDuration", { duration: activity.duration })}</p>
        )}
        {activity.category && (
          <span className="tl-badge tl-badge--category">
            {t(categoryKeys[activity.category] as "experiencesCategoryWildlife" | "experiencesCategoryHiking" | "experiencesCategoryCulture")}
          </span>
        )}
        {activity.arrangedBy && (
          <span className="tl-badge tl-badge--arranged-by">
            {t(arrangedByKeys[activity.arrangedBy] as "experienceArrangedByOwn" | "experienceArrangedByPartner")}
          </span>
        )}
        {activity.price ? (
          <p className="tl-experience-price">
            {t("experiencePrice", { price: `${activity.price.rwf} RWF / ${activity.price.usd} USD` })}
          </p>
        ) : (
          <p className="tl-experience-price">{t("experienceEnquire")}</p>
        )}
      </div>
      {activity.body && (
        <div className="tl-experience-body">
          <p>{activity.body}</p>
        </div>
      )}
      {activity.whatToBring?.length && (
        <div className="tl-experience-list">
          <h2 className="tl-experience-heading">{t("experienceWhatToBring")}</h2>
          <ul>
            {activity.whatToBring.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {activity.goodToKnow && (
        <div className="tl-experience-body">
          <h2 className="tl-experience-heading">{t("experienceGoodToKnow")}</h2>
          <p>{activity.goodToKnow}</p>
        </div>
      )}
      <a href={planUrl} className="tl-activity-plan">
        {t("experiencesPlan")}
      </a>
    </section>
  );
}
