#!/usr/bin/env node
/**
 * Page-weight check (FEATURES.md section 5, D-041).
 *
 * Builds the app (turbo, cached when nothing changed), starts the production
 * server, loads each page like a phone's first view (360x800, no scrolling,
 * empty cache) and sums the bytes the browser actually transferred per type.
 * Fails when the first view of any page is over the budget. JavaScript is
 * reported but not enforced yet (JS budget still open).
 *
 *   node scripts/weight-check.mjs [--skip-build] [--port 3100] [--json out.json]
 */
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const PAGES = ["/", "/rw"];
const BUDGET = 300 * 1024; // first view, all transferred bytes
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const port = Number(opt("--port", process.env.WEIGHT_PORT ?? "3100"));
const base = `http://127.0.0.1:${port}`;

if (!flag("--skip-build")) {
  const build = spawnSync("pnpm", ["build"], { stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const server = spawn("pnpm", ["--filter", "@getkaze/web", "exec", "next", "start", "-p", String(port)], {
  stdio: ["ignore", "inherit", "inherit"],
  detached: true,
});
const stopServer = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
};
process.on("exit", stopServer);

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(base + "/");
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start on ${base}`);
}

function kind(type, mime, url) {
  if (type === "Document") return "HTML";
  if (type === "Stylesheet" || mime.includes("css")) return "CSS";
  if (type === "Script" || mime.includes("javascript")) return "JS";
  if (type === "Image" || mime.startsWith("image/")) return "Images";
  if (type === "Font" || mime.startsWith("font/")) return "Fonts";
  return "Other";
}

async function measure(browser, path) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  const reqs = new Map();
  cdp.on("Network.responseReceived", ({ requestId, type, response }) => {
    reqs.set(requestId, {
      url: response.url,
      type,
      mime: response.mimeType ?? "",
      encoding: response.headers["content-encoding"] ?? response.headers["Content-Encoding"] ?? "none",
      headerBytes: response.encodedDataLength ?? 0,
      body: 0,
      raw: 0,
      done: false,
    });
  });
  // dataLength per chunk gives the decoded size. The wire size comes from
  // loadingFinished (all bytes) minus the header bytes counted at
  // responseReceived: per-chunk encodedDataLength is 0 for documents.
  cdp.on("Network.dataReceived", ({ requestId, dataLength }) => {
    const r = reqs.get(requestId);
    if (r) r.raw += dataLength;
  });
  cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
    const r = reqs.get(requestId);
    if (r) {
      r.body = Math.max(0, encodedDataLength - r.headerBytes);
      r.done = true;
    }
  });
  await page.goto(base + path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await context.close();

  const rows = [...reqs.values()].filter((r) => r.done && !r.url.startsWith("data:"));
  const totals = {};
  for (const r of rows) {
    r.kind = kind(r.type, r.mime, r.url);
    totals[r.kind] ??= { count: 0, body: 0, raw: 0 };
    totals[r.kind].count++;
    totals[r.kind].body += r.body;
    totals[r.kind].raw += r.raw;
  }
  const total = rows.reduce((s, r) => ({ body: s.body + r.body, raw: s.raw + r.raw }), { body: 0, raw: 0 });
  return { path, rows, totals, total };
}

const kb = (b) => (b / 1024).toFixed(1).padStart(7) + " KB";
const pad = (s, n) => String(s).padEnd(n);

let failed = false;
const results = [];
try {
  await waitForServer();
  const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  for (const path of PAGES) results.push(await measure(browser, path));
  await browser.close();
} finally {
  stopServer();
}

const order = ["HTML", "CSS", "JS", "Images", "Fonts", "Other"];
console.log("\nFirst view, 360x800, empty cache. transferred = body bytes on the wire (compressed, no headers); raw = decoded. 1 KB = 1024 B.\n");
console.log(pad("type", 8) + results.map((r) => pad(`${r.path} transferred`, 18) + pad(`${r.path} raw`, 14)).join(""));
for (const k of order) {
  if (!results.some((r) => r.totals[k])) continue;
  console.log(
    pad(k, 8) +
      results
        .map((r) => {
          const t = r.totals[k] ?? { body: 0, raw: 0, count: 0 };
          return pad(kb(t.body) + ` (${t.count})`, 18) + pad(kb(t.raw), 14);
        })
        .join(""),
  );
}
console.log(pad("Total", 8) + results.map((r) => pad(kb(r.total.body), 18) + pad(kb(r.total.raw), 14)).join(""));

for (const r of results) {
  console.log(`\nJS files on ${r.path} (transferred / raw, encoding):`);
  for (const f of r.rows.filter((x) => x.kind === "JS").sort((a, b) => b.body - a.body)) {
    console.log(`  ${kb(f.body)} ${String(f.body).padStart(8)} B  ${kb(f.raw)}  ${pad(f.encoding, 6)} ${new URL(f.url).pathname}`);
  }
}

console.log(`\nBudget: ${kb(BUDGET).trim()} per first view (JS reported only, budget still open).`);
for (const r of results) {
  const ok = r.total.body <= BUDGET;
  if (!ok) failed = true;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.path}  ${kb(r.total.body).trim()}  (JS ${kb(r.totals.JS?.body ?? 0).trim()})`);
}

const jsonOut = opt("--json");
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results.map(({ path, totals, total, rows }) => ({ path, totals, total, files: rows.map(({ url, kind, body, raw, encoding }) => ({ url, kind, body, raw, encoding })) })), null, 2));

process.exit(failed ? 1 : 0);
