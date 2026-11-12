import "server-only";
import { createClient } from "@supabase/supabase-js";
import { rowToSiteData, siteBaseUrl, type SiteData, type SiteKey } from "@getkaze/core";
import { hostConfig, hostSettings } from "@/lib/hosts";
import { supabaseConfigured, supabaseEnv } from "@/lib/supabase/env";
import { demoLodge } from "./demo-lodge";

/**
 * The published site of one business, from the database
 * (specs/demo-lodge-database.md). Guests read only through
 * get_published_site (row-level-security.md): a server-only, cookie-less
 * anonymous client, cached by Next with the tag "site:<slug|host>" for 5
 * minutes (Batch 3's editor revalidates the tag on save). Unknown, draft or
 * paused businesses give null (clean 404). Never imported by client code.
 *
 * Not configured (both Supabase settings missing): the bundled demo lodge,
 * for the demo slug only, with one server warning. Once configured, a
 * database error is always an error, never hidden by the demo. Removed or
 * kept to the demo slug at G2.
 */
const REVALIDATE_SECONDS = 300;

/** Once per server process (route bundles can hold separate copies of this module). */
const WARNED = Symbol.for("getkaze.notConfiguredWarned");
function warnNotConfigured() {
  const g = globalThis as { [WARNED]?: boolean };
  if (g[WARNED]) return;
  g[WARNED] = true;
  console.warn("[getkaze] Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing): showing the bundled demo lodge only; login and admin are off.");
}

function demoSite(key: Pick<SiteKey, "slug" | "host">): SiteData | null {
  warnNotConfigured();
  const slug = hostSettings().demoSlug;
  if (key.slug !== slug) return null;
  return { ...demoLodge, baseUrl: siteBaseUrl({ slug }, hostConfig()) };
}

function guestClient(tag: string) {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS, tags: [tag] } }),
    },
  });
}

export async function getSite(key: Pick<SiteKey, "slug" | "host">): Promise<SiteData | null> {
  if (!key.slug && !key.host) return null;
  if (!supabaseConfigured()) return demoSite(key);
  const tag = `site:${key.slug ?? key.host}`;
  const { data, error } = await guestClient(tag).rpc("get_published_site", key.slug ? { p_slug: key.slug } : { p_host: key.host });
  if (error) throw new Error(`Could not load the site (${error.code ?? "unknown"}).`);
  if (!data) return null;
  const slug = (data as { business?: { slug?: string } }).business?.slug ?? key.slug ?? "";
  const mapped = rowToSiteData(data, siteBaseUrl({ slug }, hostConfig()));
  if (!mapped.ok) throw new Error(`The published site "${slug}" is incomplete: ${mapped.errors.join("; ")}`);
  return mapped.site;
}

/**
 * Sites to pre-render at build time. The database is never read during a
 * build (a missing function or seed must not fail it): once configured,
 * every site renders on its first visit and is cached by tag. Not
 * configured: the bundled demo only.
 */
export function prerenderSlugs(): string[] {
  return supabaseConfigured() ? [] : [hostSettings().demoSlug];
}
