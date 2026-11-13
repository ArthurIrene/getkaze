import { getTranslations } from "next-intl/server";
import { whatsAppLink } from "@getkaze/core";
import type { TemplateProps } from "../../types";
import { Drawing } from "../parts/icons";
import { LazyImg } from "../parts/lazy-img";

/** Around us: postcards that flip to a line and "Ask us to arrange" (<details>, no JavaScript). */
export async function Around({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section aria-labelledby="fj-around">
      <div className="fj-head fj-rise">
        <h2 id="fj-around">{t("around")}</h2>
        <span className="fj-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {t("tapCard")}
        </span>
      </div>
      <ul className="fj-row fj-grid">
        {site.activities.map((activity) => (
          <li key={activity.id} className="fj-card">
            <details>
              <summary>
                <span className="fj-front">
                  <span className="fj-mono fj-dist">{activity.distance}</span>
                  {activity.photo?.src ? (
                    <LazyImg src={activity.photo.src} srcset={activity.photo.srcset} sizes="(min-width: 760px) 25vw, 60vw" alt={activity.photo.alt} className="fj-card-photo" />
                  ) : (
                    <Drawing icon={activity.icon} size={120} stroke={1.4} />
                  )}
                  <span className="fj-card-name">{activity.name}</span>
                </span>
                <span className="fj-back fj-fade">
                  <span className="fj-card-name">{activity.name}</span>
                  <span className="fj-card-line">{activity.line}</span>
                </span>
              </summary>
              {activity.arrange ? (
                <a
                  className="fj-arrange"
                  href={whatsAppLink(
                    site.contacts.whatsapp,
                    t("arrangeMessage", { name: site.name, activity: activity.name }),
                  )}
                >
                  {t("arrange")}
                </a>
              ) : null}
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
