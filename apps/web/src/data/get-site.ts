import { siteBaseUrl, type SiteData, type SiteKey } from "@getkaze/core";
import { hostConfig, hostSettings } from "@/lib/hosts";
import { demoLodge } from "./demo-lodge";

/**
 * The business site for a request (slug or custom host), or null for an
 * unknown, draft or paused one (clean 404). Feature 7: the demo lodge file
 * answers for the demo slug; feature 8 reads the database instead.
 */
export async function getSite(key: Pick<SiteKey, "slug" | "host">): Promise<SiteData | null> {
  const demo = hostSettings().demoSlug;
  if (key.slug !== demo) return null;
  return { ...demoLodge, baseUrl: siteBaseUrl({ slug: demo }, hostConfig()) };
}

/** Slugs to pre-render (static generation). */
export async function publishedSlugs(): Promise<string[]> {
  return [hostSettings().demoSlug];
}
