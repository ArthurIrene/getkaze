import type { ReactNode } from "react";
import { prerenderSlugs } from "@/data/get-site";

/**
 * Guest sites, reached only through the proxy's rewrite (specs/business-by-host.md).
 * Pages render on their first visit, then are cached and revalidate every 5 minutes
 * (and by tag: Batch 3's editor revalidates on save). The build never reads the database.
 */
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  const slugs = prerenderSlugs();
  return slugs.flatMap((slug) => [{ site: slug }, { site: `p~${slug}` }]);
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return children;
}
