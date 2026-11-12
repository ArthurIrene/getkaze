/**
 * @getkaze/core — shared business rules (CLAUDE.md rule 5).
 *
 * Plain TypeScript only: no React, no Next.js, no database client, so any
 * app (web now, mobile later) can import it.
 */

/** Platform settings. The product name is config, not hard-coded (D-051). */
export const platform = {
  name: "GetKaze",
  appName: "Kaze",
  /** The company that builds and runs client sites (D-051): the data processor in privacy notices. */
  company: "Altavision",
  /**
   * Privacy notice text status. "draft" until a lawyer has reviewed it
   * (privacy-notice.md); the page shows a draft line while it is a draft.
   * Registration numbers stay null until NCSA issues them (COMPLIANCE.md).
   */
  /** Our support WhatsApp number shown to owners (D-034). Placeholder until the business number is set. */
  supportWhatsApp: "+250 700 000 000",
  privacyNotice: {
    status: "draft" as "draft" | "reviewed",
    updated: "2026-11-12",
    registration: null as string | null,
  },
  /** Where client sites are served from. Keep in step with COMPLIANCE.md "Hosting countries". */
  hosting: [{ provider: "Vercel", where: { en: "United States (global network)", rw: "Leta Zunze Ubumwe za Amerika (urusobe rw'isi yose)" } }],
} as const;

export type Platform = typeof platform;

export * from "./i18n";
export * from "./money";
export * from "./contact";
export * from "./modules";
export * from "./sections";
export * from "./site/types";
export * from "./site/view";
export * from "./pages";
export * from "./booking";
export * from "./privacy";
export * from "./seo";
export * from "./brand";
export * from "./slugs";
export * from "./presets";
export * from "./access";
export * from "./admin";
export * from "./hosts";
