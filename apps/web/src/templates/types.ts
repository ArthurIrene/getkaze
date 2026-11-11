import type { SiteView } from "@getkaze/core";
import type { Locale } from "@/i18n/routing";

/** What every guest site template receives. Templates only read it. */
export type TemplateProps = { site: SiteView; locale: Locale };
