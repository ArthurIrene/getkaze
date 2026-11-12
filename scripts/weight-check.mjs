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
 * JavaScript above 160 KB on a page prints a FLAG line (the run still passes).
 *
 *   node scripts/weight-check.mjs [--skip-build] [--port 3100] [--json out.json]
 *   WEIGHT_PAGES=/,/rooms node scripts/weight-check.mjs   (measure only these pages)
 */
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const ALL_PAGES = ["/", "/rw", "/rooms", "/rw/rooms", "/contact", "/rw/contact", "/book", "/rw/book", "/privacy"];
const PAGES = process.env.WEIGHT_PAGES ? process.env.WEIGHT_PAGES.split(",") : ALL_PAGES;
const BUDGET = 300 * 1024; // first view, all transferred bytes: fails above this
const JS_FLAG = Number(process.env.WEIGHT_JS_FLAG_KB ?? 160) * 1024; // JS budget still open: flagged above this, never fails
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
const used = order.filter((k) => results.some((r) => r.totals[k]));
console.log("\nFirst view, 360x800, empty cache. transferred = body bytes on the wire (compressed, no headers). 1 KB = 1024 B.\n");
console.log(pad("page", 14) + used.map((k) => pad(k, 13)).join("") + pad("total", 11) + "raw total");
for (const r of results) {
  console.log(
    pad(r.path, 14) +
      used.map((k) => pad(`${kb(r.totals[k]?.body ?? 0).trim()} (${r.totals[k]?.count ?? 0})`, 13)).join("") +
      pad(kb(r.total.body).trim(), 11) +
      kb(r.total.raw).trim(),
  );
}

const jsSets = new Map();
for (const r of results) {
  const files = r.rows.filter((x) => x.kind === "JS").sort((a, b) => b.body - a.body);
  const key = files.map((f) => new URL(f.url).pathname).join(",");
  if (!jsSets.has(key)) jsSets.set(key, { pages: [], files });
  jsSets.get(key).pages.push(r.path);
}
for (const { pages, files } of jsSets.values()) {
  console.log(`\nJS files on ${pages.join(", ")} (transferred / raw, encoding):`);
  for (const f of files) {
    console.log(`  ${kb(f.body)} ${String(f.body).padStart(8)} B  ${kb(f.raw)}  ${pad(f.encoding, 6)} ${new URL(f.url).pathname}`);
  }
}

console.log(`\nBudget: ${kb(BUDGET).trim()} per first view. JS is reported, and flagged over ${kb(JS_FLAG).trim()} (JS budget still open).`);
for (const r of results) {
  const ok = r.total.body <= BUDGET;
  if (!ok) failed = true;
  const js = r.totals.JS?.body ?? 0;
  console.log(`${ok ? "PASS" : "FAIL"}  ${pad(r.path, 12)} ${kb(r.total.body).trim().padStart(9)}  (JS ${kb(js).trim()})`);
  if (js > JS_FLAG) console.log(`FLAG  ${pad(r.path, 12)} JS ${kb(js).trim()} is over ${kb(JS_FLAG).trim()}`);
}

const jsonOut = opt("--json");
if (jsonOut) {
  const report = results.map(({ path, totals, total, rows }) => ({
    path,
    totals,
    total,
    pass: total.body <= BUDGET,
    jsFlag: (totals.JS?.body ?? 0) > JS_FLAG,
    files: rows.map(({ url, kind, body, raw, encoding }) => ({ url: new URL(url).pathname, kind, body, raw, encoding })),
  }));
  writeFileSync(jsonOut, JSON.stringify({ budget: BUDGET, jsFlag: JS_FLAG, pages: report }, null, 2));
}

process.exit(failed ? 1 : 0);
