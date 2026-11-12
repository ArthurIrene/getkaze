import type { PageId, SiteView } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";

/** What every guest site template page receives. Templates only read it. */
export type TemplateProps = {
  site: SiteView;
  locale: Locale;
  /** The page being shown. */
  page: PageId;
  /** Pages this site has and this template implements (for menus and links). */
  pages: PageId[];
  /** Query parameters that a page may read (e.g. ?room= on the booking request). */
  query?: Record<string, string | undefined>;
};
