import { ImageResponse } from "next/og";
import { initials } from "@getkaze/core";
import { getSite } from "@/data/get-site";
import { templateThemes } from "@/templates/registry";

/**
 * Placeholder icons with the business's initials (pwa-manifest.md), made at
 * build time. ImageResponse is part of Next.js (not a new dependency) and
 * not Vercel-only, but it must be re-checked on Cloudflare Workers at G2.
 */
const files = {
  "icon.svg": { size: 0, maskable: false },
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: false },
} as const;
type IconFile = keyof typeof files;

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(files).map((file) => ({ file }));
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function GET(_request: Request, { params }: RouteContext<"/icons/[file]">) {
  const { file } = await params;
  if (!(file in files)) return new Response("Not found", { status: 404 });
  const site = await getSite();
  const theme = templateThemes[site.template];
  const text = initials(site.name);
  const spec = files[file as IconFile];

  if (file === "icon.svg") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${theme.accent}"/><text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${text.length > 1 ? 26 : 32}" fill="${theme.paper}">${escapeXml(text)}</text></svg>`;
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
  }

  const { size, maskable } = spec;
  // Maskable icons keep the letters inside the central 80% safe zone and fill the whole square.
  const fontSize = Math.round(size * (maskable ? 0.32 : 0.42) * (text.length > 1 ? 1 : 1.2));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.accent,
          color: theme.paper,
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        {text}
      </div>
    ),
    { width: size, height: size },
  );
}
