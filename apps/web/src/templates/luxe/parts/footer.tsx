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
      <div className="tl-footer-name">{site.name}</div>
      <ul className="tl-footer-contact">
        <li>
          <a href={site.contacts.telHref} className="tl-footer-call">
            {t("contactCallUs")}
          </a>
        </li>
        {site.contacts.email ? (
          <li>
            <a href={`mailto:${site.contacts.email}`} className="tl-footer-call">
              {t("contactEmailUs")}
            </a>
          </li>
        ) : null}
      </ul>
      <nav aria-label={n("site")} className="tl-footer-nav">
        <ul>
          {links.map((id) => (
            <li key={id}>
              <a href={pageHref(id, locale, site.linkBase)}>{n(id)}</a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="tl-footer-rights">{t("copyright", { name: site.legalName })}</p>
    </footer>
  );
}
