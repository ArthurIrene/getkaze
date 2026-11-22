import type { ComponentType } from "react";
import type { SectionId } from "@getkaze/core";
import type { TemplateProps } from "../types";
import { LuxePage } from "./parts/page";
import { Around } from "./sections/around";
import { Facts } from "./sections/facts";
import { FindUs } from "./sections/findUs";
import { Hero } from "./sections/hero";
import { Host } from "./sections/host";
import { Rooms } from "./sections/rooms";
import { Table } from "./sections/table";

/** One component per home section Luxe builds. Unknown or unbuilt ids are skipped without error. */
const sections: Partial<Record<SectionId, ComponentType<TemplateProps>>> = {
  hero: Hero,
  facts: Facts,
  rooms: Rooms,
  table: Table,
  around: Around,
  host: Host,
  findUs: FindUs,
  // life and reviews are not rendered by Luxe yet (L4): skipped without error.
};

/** Luxe home: full sections from SiteView, plain HTML, zero of our JavaScript. */
export default function LuxeHome(props: TemplateProps) {
  return (
    <LuxePage {...props}>
      {props.site.sections.map((id) => {
        const Section = sections[id];
        if (!Section) return null;
        return <Section key={id} {...props} />;
      })}
    </LuxePage>
  );
}
