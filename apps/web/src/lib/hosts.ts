import type { HostConfig, HostSettings } from "@getkaze/core";

/** Host settings from the environment (D-062). PLATFORM_DOMAIN and APP_HOST stay unset until DNS points here. */
export function hostConfig(): HostConfig {
  return {
    platformDomain: process.env.PLATFORM_DOMAIN || undefined,
    fallbackHost: process.env.FALLBACK_HOST || "getkaze.vercel.app",
  };
}

export function hostSettings(): HostSettings {
  return {
    platformDomain: process.env.PLATFORM_DOMAIN || undefined,
    appHost: process.env.APP_HOST || undefined,
    platformHosts: (process.env.PLATFORM_HOSTS || "getkaze.vercel.app").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean),
    demoSlug: process.env.DEMO_SITE_SLUG || "kinigi-hills",
  };
}
