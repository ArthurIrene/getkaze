import type { PageId } from "@getkaze/core";
import type { TemplateProps } from "../../types";
import { Footer } from "./footer";
import { Header } from "./header";
import { StickyBar } from "./sticky-bar";

/** Shared Luxe page shell: skip link, header, main, footer, sticky contact bar. Read only. */
export function LuxePage({ site, locale, page, pages, children }: TemplateProps & { pages: PageId[]; children: React.ReactNode }) {
  return (
    <div
      className="tl"
      data-cur={site.defaultCurrency}
      data-page={page}
      data-look={site.look.colorSet === "auto" ? undefined : site.look.colorSet}
      data-accent={site.look.accent === "forest" ? undefined : site.look.accent}
    >
      <link rel="stylesheet" href="/luxe.css" />
      <a href="#main" className="tl-skip">
        Skip to content
      </a>
      <Header site={site} locale={locale} page={page} pages={pages} />
      <main id="main">{children}</main>
      <Footer site={site} locale={locale} pages={pages} />
      <StickyBar site={site} locale={locale} pages={pages} />
    </div>
  );
}
