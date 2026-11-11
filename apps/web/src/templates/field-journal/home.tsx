import type { ComponentType } from "react";
import type { SectionId } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { Footer } from "./parts/footer";
import { Header } from "./parts/header";
import { StickyBar } from "./parts/sticky-bar";
import { Around } from "./sections/around";
import { Facts } from "./sections/facts";
import { FindUs } from "./sections/find-us";
import { Hero } from "./sections/hero";
import { Host } from "./sections/host";
import { Life } from "./sections/life";
import { Reviews } from "./sections/reviews";
import { Rooms } from "./sections/rooms";
import { Table } from "./sections/table";
import "./field-journal.css";

/** One component per home section (D-042). Order and visibility come from the owner. */
const sections: Record<SectionId, ComponentType<TemplateProps>> = {
  hero: Hero,
  facts: Facts,
  life: Life,
  rooms: Rooms,
  table: Table,
  around: Around,
  host: Host,
  reviews: Reviews,
  findUs: FindUs,
};

/** Field Journal home (mockups/canvas/T1-Home.dc.html). Read only. */
export default function FieldJournalHome({ site, locale }: TemplateProps) {
  return (
    <div className="fj" data-cur={site.defaultCurrency}>
      <Header site={site} locale={locale} />
      <main>
        {site.sections.map((id) => {
          const Section = sections[id];
          return <Section key={id} site={site} locale={locale} />;
        })}
      </main>
      <Footer site={site} />
      <StickyBar site={site} />
    </div>
  );
}
