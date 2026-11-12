import type { ReactNode } from "react";
import { publishedSlugs } from "@/data/get-site";

/**
 * Guest sites, reached only through the proxy's rewrite (specs/business-by-host.md).
 * Pages are static and revalidate every 5 minutes; Batch 3's editor revalidates on save.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await publishedSlugs();
  return slugs.flatMap((slug) => [{ site: slug }, { site: `p~${slug}` }]);
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return children;
}
