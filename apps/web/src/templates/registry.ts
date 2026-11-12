import type { ComponentType } from "react";
import type { PageId, TemplateId } from "@getkaze/core";
import type { TemplateProps } from "./types";
import FieldJournalHome from "./field-journal/home";
import FieldJournalRooms from "./field-journal/rooms";

/** A template's pages. Home is required; other pages are added as the template gets them. */
export type TemplatePages = { home: ComponentType<TemplateProps> } & Partial<
  Record<Exclude<PageId, "home">, ComponentType<TemplateProps>>
>;

/**
 * Pages per template (D-039). To add a template: add its id in
 * packages/core (templateIds), a folder here, and one entry below.
 */
export const templates: Record<TemplateId, TemplatePages> = {
  "field-journal": {
    home: FieldJournalHome,
    rooms: FieldJournalRooms,
  },
};
