import type { ComponentType } from "react";
import type { SectionId } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { Footer } from "./parts/footer";
import { Header } from "./parts/header";
import { StickyBar } from "./parts/sticky-bar";
import { Hero } from "./sections/hero";
import "./field-journal.css";

/** One component per home section. Sections not built yet are skipped. */
const sections: Partial<Record<SectionId, ComponentType<TemplateProps>>> = {
  hero: Hero,
};

/** Field Journal home (mockups/canvas/T1-Home.dc.html). Read only. */
export default function FieldJournalHome({ site, locale }: TemplateProps) {
  return (
    <div className="fj" data-cur={site.defaultCurrency}>
      <Header site={site} locale={locale} />
      <main>
        {site.sections.map((id) => {
          const Section = sections[id];
          return Section ? <Section key={id} site={site} locale={locale} /> : null;
        })}
      </main>
      <Footer site={site} />
      <StickyBar site={site} />
    </div>
  );
}
