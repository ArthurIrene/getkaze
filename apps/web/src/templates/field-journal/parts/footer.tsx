import { getTranslations } from "next-intl/server";
import type { PageId, SiteView } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";
import { pageHref } from "./links";

export async function Footer({ site, locale, pages }: { site: SiteView; locale: Locale; pages: PageId[] }) {
  const t = await getTranslations("FieldJournal");
  const n = await getTranslations("Nav");
  const links = (["contact", "privacy", "credits"] as const).filter((id) => pages.includes(id));
  return (
    <footer className="fj-footer">
      <span className="fj-footer-name">{site.name}</span>
      <span className="fj-hand fj-footer-welcome">{t("welcome")}</span>
      <div className="fj-footer-row">
        <small>{t("copyright", { name: site.legalName })}</small>
        {links.length > 0 ? (
          <ul className="fj-footer-links">
            {links.map((id) => (
              <li key={id}>
                <a href={pageHref(id, locale, site.linkBase)}>{n(id)}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}
