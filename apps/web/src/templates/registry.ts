import type { ComponentType } from "react";
import type { TemplateId } from "@getkaze/core";
import type { TemplateProps } from "./types";
import FieldJournalHome from "./field-journal/home";

/**
 * Home page per template (D-039). To add a template: add its id in
 * packages/core (templateIds), a folder here, and one line below.
 */
export const homeTemplates: Record<TemplateId, ComponentType<TemplateProps>> = {
  "field-journal": FieldJournalHome,
};
