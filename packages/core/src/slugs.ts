/**
 * Business slugs, the `<slug>` in `<slug>.altavision.rw` (D-062,
 * specs/core-data.md). The database enforces the same rules: the slug check
 * constraint and the `reserved_slugs` table. scripts/check-migrations.mjs
 * keeps `reservedSlugs` equal to the migration's list.
 */

/** Names that can never be a business slug (D-062). Keep in step with public.reserved_slugs. */
export const reservedSlugs = [
  "www", "mail", "admin", "app", "api", "kaze",
  "s", "auth", "login", "owner", "static",
  "cdn", "assets", "smtp", "imap", "pop", "webmail",
  "ftp", "ns1", "ns2", "autodiscover", "autoconfig", "_dmarc",
  "status", "support", "help", "docs", "blog",
  "send", "resend", "zmail", "email", "mx",
] as const;

export const slugLimits = { min: 3, max: 40 } as const;

const SLUG = /^[a-z0-9](-?[a-z0-9])*$/;

export type SlugProblem = "empty" | "too_short" | "too_long" | "format" | "reserved";

/** Problems with a slug, in the order a form shows them; empty when the slug is fine. */
export function slugProblems(slug: string): SlugProblem[] {
  if (slug.length === 0) return ["empty"];
  const problems: SlugProblem[] = [];
  if (slug.length < slugLimits.min) problems.push("too_short");
  if (slug.length > slugLimits.max) problems.push("too_long");
  if (!SLUG.test(slug)) problems.push("format");
  if ((reservedSlugs as readonly string[]).includes(slug)) problems.push("reserved");
  return problems;
}

/** A slug suggestion from a business name: "Kinigi Hills" → "kinigi-hills", "Hôtel Été" → "hotel-ete". */
export function normalizeSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, slugLimits.max)
    .replace(/-+$/g, "");
  return base;
}
