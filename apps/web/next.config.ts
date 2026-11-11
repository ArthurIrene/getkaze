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
