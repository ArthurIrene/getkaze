import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against the production server (run `pnpm build` first).
 * Chromium only. Set PW_CHROMIUM_PATH to use a browser that is already
 * installed instead of the one `playwright install chromium` downloads.
 */
const port = Number(process.env.E2E_PORT ?? 3200);
/** Second server, with PLATFORM_DOMAIN=altavision.test, for subdomain routing tests. */
export const subdomainPort = Number(process.env.E2E_SUBDOMAIN_PORT ?? 3201);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "off",
    colorScheme: "light",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    {
      name: "chromium-phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @getkaze/web exec next start -p ${port}`,
      url: `http://127.0.0.1:${port}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    // Same build with a platform domain set, for subdomain routing (e2e/hosts.spec.ts, D-062).
    {
      command: `pnpm --filter @getkaze/web exec next start -p ${subdomainPort}`,
      url: `http://127.0.0.1:${subdomainPort}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...(process.env as Record<string, string>), PLATFORM_DOMAIN: "altavision.test", APP_HOST: "kaze.altavision.test" },
    },
  ],
});
