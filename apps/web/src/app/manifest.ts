import type { MetadataRoute } from "next";
import { shortName } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import { pageMetadata } from "@/lib/metadata";
import { templateThemes } from "@/templates/registry";

/** /manifest.webmanifest per business (pwa-manifest.md). No service worker in Batch 1. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSite();
  const theme = templateThemes[site.template];
  const description = (await pageMetadata("home", "en")).description ?? undefined;
  return {
    name: site.name,
    short_name: shortName(site.name),
    description: description ?? undefined,
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
