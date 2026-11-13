import { getTranslations } from "next-intl/server";
import type { TemplateProps } from "../types";
import { FieldJournalPage } from "./parts/page";

/**
 * Photo credits (specs/demo-photos.md): every credited photo on the site with
 * its title, photographer, source and licence. Required for CC BY photos;
 * CC0 and Public Domain photos are listed too. The page exists only when the
 * site has credited photos (core sitePages).
 */
export default async function FieldJournalCredits(props: TemplateProps) {
  const t = await getTranslations("Credits");
  return (
    <FieldJournalPage {...props} className="fj-subpage">
      <article className="fj-legal">
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
        <ul className="fj-credits">
          {props.site.credits.map((c) => (
            <li key={c.sourceUrl} data-credit={c.attribution ? "by" : "free"}>
              <span className="fj-credit-shows">{c.shows}</span>
              <span>
                <a href={c.sourceUrl} rel="nofollow noopener">{c.title}</a> · {t("by", { author: c.author })} ·{" "}
                {c.licenceUrl ? <a href={c.licenceUrl} rel="license nofollow noopener">{c.licence}</a> : c.licence}
              </span>
            </li>
          ))}
        </ul>
        <p className="fj-muted">{t("changes")}</p>
      </article>
    </FieldJournalPage>
  );
}
