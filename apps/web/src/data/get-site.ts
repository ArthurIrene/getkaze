import "server-only";
import { createClient } from "@supabase/supabase-js";
import { rowToSiteData, siteBaseUrl, type SiteData, type SiteKey } from "@getkaze/core";
import { hostConfig } from "@/lib/hosts";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * The published site of one business, from the database
 * (specs/demo-lodge-database.md). Guests read only through
 * get_published_site (row-level-security.md): a server-only, cookie-less
 * anonymous client, cached by Next with the tag "site:<slug|host>" for 5
 * minutes (Batch 3's editor revalidates the tag on save). Unknown, draft or
 * paused businesses give null (clean 404). Never imported by client code.
 */
const REVALIDATE_SECONDS = 300;

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
  const tag = `site:${key.slug ?? key.host}`;
  const { data, error } = await guestClient(tag).rpc("get_published_site", key.slug ? { p_slug: key.slug } : { p_host: key.host });
  if (error) throw new Error(`Could not load the site (${error.code ?? "unknown"}).`);
  if (!data) return null;
  const slug = (data as { business?: { slug?: string } }).business?.slug ?? key.slug ?? "";
  const mapped = rowToSiteData(data, siteBaseUrl({ slug }, hostConfig()));
  if (!mapped.ok) throw new Error(`The published site "${slug}" is incomplete: ${mapped.errors.join("; ")}`);
  return mapped.site;
}

/** Slugs of active, published businesses, to pre-render (static generation). */
export async function publishedSlugs(): Promise<string[]> {
  const { data, error } = await guestClient("sites").rpc("list_published_slugs");
  if (error) throw new Error(`Could not list published sites (${error.code ?? "unknown"}).`);
  return (data as string[] | null) ?? [];
}
