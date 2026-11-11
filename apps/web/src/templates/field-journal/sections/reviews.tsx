import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";

/** Reviews: one quote and the owner's scores. */
export async function Reviews({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section className="fj-review fj-rise" aria-label={t("reviews")}>
      {site.reviews.quote ? <blockquote className="fj-hand">{site.reviews.quote}</blockquote> : null}
      {site.reviews.scores.length > 0 ? (
        <dl className="fj-scores">
          {site.reviews.scores.map((score) => (
            <div key={score.source}>
              <dt className="fj-mono">{score.source}</dt>
              <dd>{score.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
