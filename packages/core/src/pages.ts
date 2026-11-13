import type { SiteView } from "./site/view";

/** Guest site pages a template can have (Batch 1). Paths are per language prefix ("/", "/rw/..."). */
export const pageIds = ["home", "rooms", "contact", "book", "privacy", "credits"] as const;
export type PageId = (typeof pageIds)[number];

export const pagePaths: Record<PageId, string> = {
  home: "/",
  rooms: "/rooms",
  contact: "/contact",
  book: "/book",
  privacy: "/privacy",
  credits: "/credits",
};

/**
 * Pages this business's site shows: rooms and the booking request only when
 * the business has rooms; photo credits only when it has credited photos. A template may implement fewer; callers filter by
 * what the template has.
 */
export function sitePages(view: Pick<SiteView, "rooms" | "credits">): PageId[] {
  const hasRooms = view.rooms.length > 0;
  return pageIds.filter((id) => (id === "rooms" || id === "book" ? hasRooms : id === "credits" ? view.credits.length > 0 : true));
}

/** Pages listed in the site menu, in order (privacy lives in the footer only). */
export function menuPages(pages: readonly PageId[]): PageId[] {
  return (["rooms", "contact"] as const).filter((id) => pages.includes(id));
}
