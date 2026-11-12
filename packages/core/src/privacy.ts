import { pickText, type ContentLocale, type LocalizedText } from "./i18n";
import type { SiteView } from "./site/view";

type PlatformPrivacy = {
  name: string;
  company: string;
  privacyNotice: { status: "draft" | "reviewed"; updated: string; registration: string | null };
  hosting: readonly { provider: string; where: LocalizedText }[];
};

/** Everything the privacy notice fills in, for one business and language (privacy-notice.md). */
export type PrivacyFacts = {
  business: string;
  legalName: string;
  area: string;
  phone: string;
  whatsapp: string;
  /** Only when the business has an email. */
  email?: string;
  processor: string;
  platform: string;
  hosting: string;
  draft: boolean;
  updated: string;
  /** Only once NCSA has issued it. */
  registration?: string;
};

export function privacyFacts(view: SiteView, platform: PlatformPrivacy, locale: ContentLocale): PrivacyFacts {
  const { phone, whatsapp, email } = view.contacts;
  return {
    business: view.name,
    legalName: view.legalName,
    area: view.location.area,
    phone,
    whatsapp,
    ...(email ? { email } : {}),
    processor: platform.company,
    platform: platform.name,
    hosting: platform.hosting.map((h) => `${h.provider}, ${pickText(h.where, locale)}`).join("; "),
    draft: platform.privacyNotice.status === "draft",
    updated: platform.privacyNotice.updated,
    ...(platform.privacyNotice.registration ? { registration: platform.privacyNotice.registration } : {}),
  };
}
