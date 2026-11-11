import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";

/** Life strip: taped scrapbook photos with handwritten captions. */
export async function Life({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section aria-label={t("life")} className="fj-life">
      <ul className="fj-row">
        {site.moments.map((moment) => (
          <li key={moment.id} className="fj-polaroid">
            <figure style={{ margin: 0 }}>
              <span className="fj-tape" aria-hidden="true" />
              <PhotoSpot photo={moment.photo} icon={moment.icon} iconSize={84} />
              <figcaption className="fj-hand">{moment.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
