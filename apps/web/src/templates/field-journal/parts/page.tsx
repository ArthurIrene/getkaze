import type { ReactNode } from "react";
import type { TemplateProps } from "../../types";
import { Footer } from "./footer";
import { Header } from "./header";
import { LAZY_SCRIPT } from "./lazy-img";
import { StickyBar } from "./sticky-bar";
import "../field-journal.css";

/** Shared Field Journal page: header, main, footer and sticky bar. Read only. */
export function FieldJournalPage({
  site,
  locale,
  page,
  pages,
  bar = "call",
  className,
  children,
}: TemplateProps & { bar?: "call" | "whatsapp"; className?: string; children: ReactNode }) {
  return (
    <div className="fj" data-cur={site.defaultCurrency} data-page={page} data-look={site.look.colorSet === "auto" ? undefined : site.look.colorSet} data-accent={site.look.accent === "forest" ? undefined : site.look.accent}>
      <Header site={site} locale={locale} page={page} pages={pages} />
      <main className={className}>{children}</main>
      <Footer site={site} locale={locale} pages={pages} />
      <StickyBar site={site} locale={locale} pages={pages} second={bar} />
      {/* Loads photos below the first view when they come near (parts/lazy-img.tsx). */}
      <script dangerouslySetInnerHTML={{ __html: LAZY_SCRIPT }} />
    </div>
  );
}
