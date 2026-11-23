import type { SiteView } from "./site/view";

/** Guest site pages a template can have (Batch 1 + Luxe L4/L5). Paths are per language prefix ("/", "/rw/..."). */
export const pageIds = ["home", "rooms", "contact", "book", "privacy", "credits", "myStay", "experiences", "experienceDetail", "dining", "gallery"] as const;
export type PageId = (typeof pageIds)[number];

export const pagePaths: Record<PageId, string> = {
  home: "/",
  rooms: "/rooms",
  contact: "/contact",
  book: "/book",
  privacy: "/privacy",
  credits: "/credits",
  myStay: "/my-stay",
  experiences: "/experiences",
  experienceDetail: "/experiences/[slug]",
  dining: "/dining",
  gallery: "/gallery",
};

/**
 * Pages this business's site shows: rooms and the booking request only when
 * the business has rooms; photo credits only when it has credited photos.
 * myStay, experiences, experienceDetail, dining, gallery are Luxe-only and added by the Luxe template's availablePages.
 * A template may implement fewer; callers filter by what the template has.
 */
export function sitePages(view: Pick<SiteView, "rooms" | "credits">): PageId[] {
  const hasRooms = view.rooms.length > 0;
  return pageIds.filter((id) => {
    if (["myStay", "experiences", "experienceDetail", "dining", "gallery"].includes(id)) return false; // Luxe-only, added by template
    if (id === "rooms" || id === "book") return hasRooms;
    if (id === "credits") return view.credits.length > 0;
    return true;
  });
}

/** Pages listed in the site menu, in order (privacy lives in the footer only). */
export function menuPages(pages: readonly PageId[]): PageId[] {
  return (["rooms", "contact"] as const).filter((id) => pages.includes(id));
}
