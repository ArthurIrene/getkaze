import type { MetadataRoute } from "next";
import { siteForHost } from "@/lib/site-for-host";

/**
 * /robots.txt per host: allow everything and point to that site's sitemap.
 * No Disallow on purpose: crawlers must fetch pages to see their noindex (D-054).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const found = await siteForHost();
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(found ? { sitemap: `${found.view.baseUrl.replace(/\/s\/[^/]+$/, "")}/sitemap.xml` } : {}),
  };
}
