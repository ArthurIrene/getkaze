import "server-only";
import { headers } from "next/headers";
import { parseHost, toSiteView, type SiteData, type SiteView } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import { hostSettings } from "./hosts";

/**
 * The site for files served at a host's root (sitemap, robots, manifest,
 * icons): the subdomain's business, the demo on platform hosts, or a custom
 * domain. Null for unknown hosts.
 */
export async function siteForHost(): Promise<{ site: SiteData; view: SiteView } | null> {
  const h = await headers();
  const target = parseHost(h.get("x-forwarded-host") ?? h.get("host"), "/", hostSettings());
  if (target.kind !== "site" && target.kind !== "custom") return null;
  const site = await getSite(target.kind === "site" ? { slug: target.slug } : { host: target.host });
  return site ? { site, view: toSiteView(site, "en") } : null;
}
