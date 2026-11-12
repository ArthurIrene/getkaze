#!/usr/bin/env node
/**
 * Slow-3G timing report (specs/speed-pass.md). Report only: never fails.
 *
 * Starts the production server (build first), then loads each page in
 * Chromium as a 360x800 phone with an empty cache over an emulated slow
 * connection: 400 ms latency, 500 kbit/s down and up (the profile PR #2
 * used, so numbers compare). No CPU throttling. Median of 3 runs of first
 * contentful paint and full load (loadEventEnd).
 *
 *   node scripts/speed-check.mjs [--port 3101] [--runs 3] [--json speed.json]
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const PAGES = ["/", "/rooms", "/contact", "/book"];
const PROFILE = { latency: 400, downloadThroughput: (500 * 1000) / 8, uploadThroughput: (500 * 1000) / 8 };
const GUIDE = { fcp: 1500, load: 4000 }; // flag above these, never fail

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const port = Number(opt("--port", "3101"));
const runs = Number(opt("--runs", "3"));
const base = `http://127.0.0.1:${port}`;

const server = spawn("pnpm", ["--filter", "@getkaze/web", "exec", "next", "start", "-p", String(port)], {
  stdio: ["ignore", "ignore", "inherit"],
  detached: true,
});
const stop = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
};
process.on("exit", stop);

for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(base + "/")).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const results = [];
try {
  for (const path of PAGES) {
    const fcps = [];
    const loads = [];
    for (let i = 0; i < runs; i++) {
      const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", { offline: false, ...PROFILE });
      await page.goto(base + path, { waitUntil: "load", timeout: 60_000 });
      const t = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const fcp = performance.getEntriesByName("first-contentful-paint")[0];
        return { fcp: fcp ? fcp.startTime : NaN, load: nav ? nav.loadEventEnd : NaN };
      });
      fcps.push(t.fcp);
      loads.push(t.load);
      await context.close();
    }
    results.push({ path, fcp: Math.round(median(fcps)), load: Math.round(median(loads)), runs: { fcp: fcps.map(Math.round), load: loads.map(Math.round) } });
  }
} finally {
  await browser.close();
  stop();
}

const s = (ms) => `${(ms / 1000).toFixed(2)} s`;
console.log(`\nSlow 3G (${PROFILE.latency} ms, 500 kbit/s down/up, no CPU throttling), 360x800, empty cache, median of ${runs}.\n`);
console.log("page".padEnd(12) + "first paint".padEnd(14) + "full load");
for (const r of results) {
  const flags = [r.fcp > GUIDE.fcp ? "FLAG first paint" : "", r.load > GUIDE.load ? "FLAG load" : ""].filter(Boolean).join(", ");
  console.log(r.path.padEnd(12) + s(r.fcp).padEnd(14) + s(r.load).padEnd(10) + (flags ? `  ${flags}` : ""));
}
console.log(`\nGuide: first paint ≤ ${s(GUIDE.fcp)}, full load ≤ ${s(GUIDE.load)} (report only).`);
const json = opt("--json");
if (json) writeFileSync(json, JSON.stringify({ profile: PROFILE, guide: GUIDE, pages: results }, null, 2));
process.exit(0);
