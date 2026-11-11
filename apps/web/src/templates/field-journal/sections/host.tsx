import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../../types";
import { PhotoSpot } from "../parts/photo";

/** Your host: taped photo, greeting, and a note that opens on tap. */
export async function Host({ site }: TemplateProps) {
  const t = await getTranslations("FieldJournal");
  return (
    <section className="fj-host fj-rise" aria-label={site.host.name}>
      <div className="fj-host-row">
        <figure className="fj-polaroid" style={{ margin: 0 }}>
          <span className="fj-tape" aria-hidden="true" />
          <PhotoSpot photo={site.host.photo} />
          <figcaption className="fj-hand">{site.host.name}</figcaption>
        </figure>
        <p className="fj-host-greeting">{site.host.greeting}</p>
      </div>
      <details>
        <summary className="fj-mono">
          <span className="fj-more">{t("hostMore")}</span>
          <span className="fj-less">{t("hostLess")}</span>
        </summary>
        <p className="fj-hand fj-host-note fj-fade">{site.host.note}</p>
      </details>
    </section>
  );
}
