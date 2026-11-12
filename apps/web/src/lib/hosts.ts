import type { HostConfig } from "@getkaze/core";

/** Host settings from the environment (D-062). PLATFORM_DOMAIN stays unset until DNS points here. */
export function hostConfig(): HostConfig {
  return {
    platformDomain: process.env.PLATFORM_DOMAIN || undefined,
    fallbackHost: process.env.FALLBACK_HOST || "getkaze.vercel.app",
  };
}
