import type { PageId } from "@getkaze/core";

/** Luxe page ids (Luxe L2a/L3b). No component imports here, so this module is
 *  safe to load on every guest page without adding weight to Field Journal.
 *  Extended only as each page component is built, so no link points to an
 *  unbuilt page. */
export const luxePageIds: PageId[] = ["home", "rooms", "contact", "book", "privacy", "myStay", "experiences", "experienceDetail", "dining", "gallery"];
