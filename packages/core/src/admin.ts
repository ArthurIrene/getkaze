import { localePath } from "./seo";
import type { PageId } from "./pages";

/**
 * Platform admin rules (specs/platform-admin.md) and site addresses
 * (specs/business-by-host.md, D-062).
 */

export type HostConfig = {
  /** e.g. "altavision.rw" once DNS points at the site; unset before (D-062). */
  platformDomain?: string;
  /** Host that serves the fallback /s/<slug> paths, e.g. "getkaze.vercel.app". */
  fallbackHost: string;
};

/** The public address of a business site (no trailing slash). */
export function siteBaseUrl(business: { slug: string }, config: HostConfig): string {
  return config.platformDomain
    ? `https://${business.slug}.${config.platformDomain}`
    : `https://${config.fallbackHost}/s/${business.slug}`;
}

/** Path of a page inside a site, keeping the /s/<slug> prefix in fallback mode. */
export function sitePath(page: PageId, locale: string, mode: { fallbackSlug?: string }): string {
  const path = localePath(page, locale);
  if (!mode.fallbackSlug) return path;
  return `/s/${mode.fallbackSlug}${path === "/" ? "" : path}`;
}

export const supportReasonLimits = { min: 5, max: 200 } as const;

export function supportReasonProblems(reason: string): ("too_short" | "too_long")[] {
  const length = Array.from(reason.trim()).length;
  if (length < supportReasonLimits.min) return ["too_short"];
  if (length > supportReasonLimits.max) return ["too_long"];
  return [];
}

export type BusinessStatus = "draft" | "active" | "paused";

/** A business can only go live with a published site (the database checks the published texts). */
export function canSetStatus(status: BusinessStatus, site: { publishedAt: string | null }): boolean {
  return status !== "active" || site.publishedAt !== null;
}

/** A simple email check for invite forms; the auth server checks again. */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 320;
}
