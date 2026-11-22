import type { PageId } from "@getkaze/core";

/** Luxe page ids (Luxe L2a). No component imports here, so this module is
   safe to load on every guest page without adding weight to Field Journal. */
export const luxePageIds: PageId[] = ["home"];
