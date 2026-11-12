import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { fallbackSlug, isPlatformPath, parseHost, servesPlatformScreens, siteKey, splitLocale } from "@getkaze/core";
import { routing } from "./i18n/routing";
import { hostSettings } from "./lib/hosts";
import { refreshSession } from "./lib/supabase/refresh";

const intl = createMiddleware(routing);

/** A route key that never matches a site: the page answers with the clean 404. */
const NO_SITE = "~";

/**
 * Business by host (specs/business-by-host.md, D-062). No database call here:
 * - platform screens (login, auth links, owner, admin) only on platform hosts,
 *   with the Supabase session refresh (guest pages never set cookies);
 * - every guest path is rewritten to the internal route /<locale>/site/<key>/…,
 *   where the key comes from the subdomain, the /s/<slug> fallback, the demo
 *   (bare platform host) or a custom domain. The internal route itself is never
 *   reachable from outside.
 */
export default async function proxy(request: NextRequest) {
  const settings = hostSettings();
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const path = request.nextUrl.pathname;

  const toSite = (locale: string, key: string, rest: string) => {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/site/${encodeURIComponent(key)}${rest === "/" ? "" : rest}`;
    return NextResponse.rewrite(url);
  };

  // The internal route is not a public address.
  const inner = splitLocale(path, routing.locales, routing.defaultLocale);
  if (/^\/(en\/)?site(\/|$)/.test(inner.rest) || /^\/en(\/|$)/.test(path)) {
    return toSite(routing.defaultLocale, NO_SITE, "/");
  }

  if (isPlatformPath(path)) {
    if (!servesPlatformScreens(host, settings)) return toSite(inner.locale, NO_SITE, "/");
    const response = intl(request);
    await refreshSession(request, response);
    return response;
  }

  const target = parseHost(host, path, settings);
  if (target.kind === "unknown" || target.kind === "platform") return toSite(inner.locale, NO_SITE, "/");
  const afterPrefix = target.kind === "site" && target.via === "path" ? path.slice(`/s/${fallbackSlug(path)}`.length) || "/" : path;
  const { locale, rest } = splitLocale(afterPrefix, routing.locales, routing.defaultLocale);
  return toSite(locale, siteKey(target), rest);
}

export const config = {
  // Every path except API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
