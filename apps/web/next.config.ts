import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Keep this portable: production runs on Cloudflare (D-035), so no
 * Vercel-only features (no @vercel/* packages, Vercel image optimizer,
 * Edge Config, Vercel KV/Blob, or vercel.json settings).
 */
const nextConfig: NextConfig = {
  // Compile the shared TypeScript package directly from source.
  transpilePackages: ["@getkaze/core"],
  poweredByHeader: false,
  // Demo data only: noindex everything until gate G2 (CLAUDE.md "Never do").
  // No robots.txt Disallow on purpose: crawlers must fetch pages to see noindex.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
