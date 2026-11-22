import type { ReactNode } from "react";
import type { Viewport } from "next";
import { parseSiteKey, type SiteKey } from "@getkaze/core";
import { getSite, prerenderSlugs } from "@/data/get-site";
import { templateThemes, type TemplateTheme } from "@/templates/registry";
import { luxeTheme } from "@/templates/luxe/theme";

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

/**
 * Browser bar colour per scheme: the template's paper colours (pwa-manifest.md).
 * Reads the site once (React-cached getSite) so the page below shares the read
 * instead of hitting the database a second time.
 */
export async function generateViewport({ params }: { params: Promise<{ site: string }> }): Promise<Viewport> {
  const { site: siteKey } = await params;
  const key: SiteKey | null = parseSiteKey(siteKey ?? "");
  let theme: TemplateTheme = templateThemes["field-journal"]!;
  if (key) {
    const site = await getSite(key);
    if (site?.template === "luxe") theme = luxeTheme;
  }
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: theme.paper },
      { media: "(prefers-color-scheme: dark)", color: theme.paperDark },
    ],
  };
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return children;
}
