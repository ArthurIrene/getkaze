import { getTranslations } from "next-intl/server";
import { type PageId, type SiteView } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";
import { pageHref } from "./links";

export async function Footer({ site, locale, pages }: { site: SiteView; locale: Locale; pages: PageId[] }) {
  const t = await getTranslations("Luxe");
  const n = await getTranslations("Nav");
  const links = pages.filter((id) => id !== "home");
  return (
    <footer className="tl-footer">
      <span className="tl-footer-name">{site.name}</span>
      <span className="tl-hand tl-footer-welcome">{t("welcome")}</span>
      <div className="tl-footer-row">
        <small>{t("copyright", { name: site.legalName })}</small>
        {links.length > 0 ? (
          <ul className="tl-footer-links">
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
