import { slugProblems } from "./slugs";

/**
 * Business by host (specs/business-by-host.md, D-062). Pure rules: the proxy
 * turns a request's host and path into one of these, with no database call.
 */
export type HostSettings = {
  /** "altavision.rw" once DNS points here; unset before. */
  platformDomain?: string;
  /** Our screens' host, "kaze.altavision.rw"; unset before. */
  appHost?: string;
  /** Hosts that serve platform screens and the /s/<slug> fallback. */
  platformHosts: string[];
  /** The demo shown at the bare platform host (D-053). */
  demoSlug: string;
};

export type HostResult =
  | { kind: "site"; slug: string; via: "subdomain" | "path" | "demo" }
  | { kind: "custom"; host: string }
  | { kind: "platform" }
  | { kind: "unknown" };

const HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

/** Lowercase, without port; null when it is not a valid host name. */
export function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (h.length === 0 || h.length > 253 || !HOST.test(h)) return null;
  return h;
}

function isPlatformHost(host: string, s: HostSettings): boolean {
  return s.platformHosts.includes(host) || host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

/** The /s/<slug> fallback prefix in a path (after an optional language prefix is NOT allowed: /s comes first). */
export function fallbackSlug(path: string): string | null {
  const m = /^\/s\/([^/]+)(?=\/|$)/.exec(path);
  return m && slugProblems(m[1]!).length === 0 ? m[1]! : null;
}

/** Which site (or platform) a request is for. `path` is the URL path without query. */
export function parseHost(rawHost: string | null | undefined, path: string, s: HostSettings): HostResult {
  const host = normalizeHost(rawHost);
  if (!host) return { kind: "unknown" };
  if (s.appHost && host === s.appHost) return { kind: "platform" };
  if (s.platformDomain) {
    if (host === s.platformDomain || host === `www.${s.platformDomain}`) return { kind: "site", slug: s.demoSlug, via: "demo" };
    if (host.endsWith(`.${s.platformDomain}`)) {
      const label = host.slice(0, -(s.platformDomain.length + 1));
      if (!label.includes(".") && slugProblems(label).length === 0) return { kind: "site", slug: label, via: "subdomain" };
      return { kind: "unknown" };
    }
  }
  if (isPlatformHost(host, s)) {
    const slug = fallbackSlug(path);
    if (slug) return { kind: "site", slug, via: "path" };
    if (path.startsWith("/s/") || path === "/s") return { kind: "unknown" };
    return { kind: "site", slug: s.demoSlug, via: "demo" };
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return { kind: "unknown" };
  return { kind: "custom", host };
}

/**
 * The internal route key for a site: a slug, "p~<slug>" when reached through
 * the /s/<slug> fallback (links keep that prefix), or a custom host (has dots).
 */
export function siteKey(r: Extract<HostResult, { kind: "site" | "custom" }>): string {
  if (r.kind === "custom") return r.host;
  return r.via === "path" ? `p~${r.slug}` : r.slug;
}

export type SiteKey = { slug?: string; host?: string; base: string };

export function parseSiteKey(key: string): SiteKey | null {
  const k = decodeURIComponent(key).toLowerCase();
  if (k.startsWith("p~")) {
    const slug = k.slice(2);
    return slugProblems(slug).length ? null : { slug, base: `/s/${slug}` };
  }
  if (k.includes(".")) return normalizeHost(k) ? { host: k, base: "" } : null;
  return slugProblems(k).length ? null : { slug: k, base: "" };
}

/** Platform screens (login, owner, admin) exist only on the app host and platform hosts, never on a business host. */
export function servesPlatformScreens(rawHost: string | null | undefined, s: HostSettings): boolean {
  const host = normalizeHost(rawHost);
  if (!host) return false;
  if (s.appHost && host === s.appHost) return true;
  if (s.platformDomain && (host === s.platformDomain || host.endsWith(`.${s.platformDomain}`))) return false;
  return isPlatformHost(host, s);
}

/** Split a guest path into language and the rest: "/rw/rooms" → { locale: "rw", rest: "/rooms" }. */
export function splitLocale(path: string, locales: readonly string[], defaultLocale: string): { locale: string; rest: string } {
  const m = /^\/([a-z]{2})(?=\/|$)(.*)$/.exec(path);
  if (m && locales.includes(m[1]!) && m[1] !== defaultLocale) return { locale: m[1]!, rest: m[2] || "/" };
  return { locale: defaultLocale, rest: path || "/" };
}
