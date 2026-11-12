import { defineRouting } from "next-intl/routing";

/**
 * Language routing (D-029).
 * - English is required and the default: served at "/" with no prefix.
 * - Kinyarwanda is served at "/rw". French can be added here later.
 * - No browser-language detection, so "/" is always English and
 *   predictable. Change these settings in this one file.
 */
export const routing = defineRouting({
  locales: ["en", "rw"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  // No NEXT_LOCALE cookie: the language comes from the URL only, so guest sites set no cookies (privacy-notice.md).
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
