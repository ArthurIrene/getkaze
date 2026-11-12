import type { MetadataRoute } from "next";
import { shortName } from "@getkaze/core";
import { siteForHost } from "@/lib/site-for-host";
import { templateThemes } from "@/templates/registry";

/** /manifest.webmanifest per business (pwa-manifest.md). No service worker in Batch 1. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const found = await siteForHost();
  const name = found?.site.name ?? "Kaze";
  const theme = templateThemes[found?.site.template ?? "field-journal"];
  const description = found ? `${found.view.hero.title} ${found.view.hero.line}`.trim() : undefined;
  return {
    name,
    short_name: shortName(name),
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en",
    dir: "ltr",
    background_color: theme.paper,
    theme_color: theme.paper,
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
