import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isPlatformPath } from "@getkaze/core";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/supabase/refresh";

const intl = createMiddleware(routing);

/**
 * Language routing for every page; Supabase session refresh only on platform
 * paths (login, auth links, owner, admin), so guest pages never set cookies.
 */
export default async function proxy(request: NextRequest) {
  const response = intl(request);
  if (isPlatformPath(request.nextUrl.pathname)) await refreshSession(request, response);
  return response;
}

export const config = {
  // Every path except API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|.*\\..*).*)",
};
