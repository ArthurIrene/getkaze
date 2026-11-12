import type { MetadataRoute } from "next";
import { getSite } from "@/data/get-site";

/**
 * /robots.txt: allow everything and point to the sitemap. No Disallow on
 * purpose: crawlers must fetch pages to see their noindex (D-054).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { baseUrl } = await getSite();
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${baseUrl.replace(/\/+$/, "")}/sitemap.xml` };
}
