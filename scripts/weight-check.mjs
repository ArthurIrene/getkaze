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
 *
 * With a LOCAL Supabase configured (as in CI), it also measures a lodge with
 * an uploaded hero photo (approved point 4) at 2x pixel ratio, so the phone
 * loads the 960 px file. The fixture's files are made at their size targets
 * (480: 40 KB, 960: 80 KB, 1440: 160 KB), so the check covers the worst case
 * the editor allows by target.
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

async function measure(browser, path, deviceScaleFactor = 1) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor, isMobile: true, hasTouch: true });
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

// ---------- Hero photo fixture (local Supabase only) ----------
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const localDb = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(sbUrl) && sbKey && !process.env.WEIGHT_PAGES;
const HERO_SLUG = "weight-hero";

async function sb(path, init = {}) {
  const res = await fetch(`${sbUrl}${path}`, {
    ...init,
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Photo-like WebP files at each width, padded up to their size target (browsers ignore bytes after the RIFF chunk). */
async function heroFiles(browser) {
  const page = await browser.newPage();
  const out = {};
  for (const [w, target] of [[480, 40], [960, 80], [1440, 160]]) {
    const b64 = await page.evaluate(async ([w, target]) => {
      const h = Math.round((w * 3) / 4);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const g = c.getContext("2d");
      const img = g.createImageData(w, h);
      for (let p = 0, i = 0; p < w * h; p++, i += 4) { const x = p % w, y = (p / w) | 0, n = Math.random() * 24; img.data[i] = 60 + (y * 50) / h + n; img.data[i + 1] = 90 + (x * 60) / w + n; img.data[i + 2] = 200 - (y * 110) / h + n; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      // The editor's rule: step the quality down until the file is under its target.
      let blob;
      for (let q = 0.82; q >= 0.25; q -= 0.08) {
        blob = await new Promise((r) => c.toBlob(r, "image/webp", q));
        if (blob.size <= target * 1024) break;
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    }, [w, target]);
    const file = Buffer.from(b64, "base64");
    if (file.length > target * 1024) throw new Error(`hero fixture ${w}: ${file.length} B is over its ${target} KB target`);
    out[w] = Buffer.concat([file, Buffer.alloc(target * 1024 - file.length)]);
  }
  await page.close();
  return out;
}

async function heroFixture(browser) {
  const [existing] = await sb(`/rest/v1/businesses?slug=eq.${HERO_SLUG}&select=id`);
  if (existing) return `/s/${HERO_SLUG}`;
  const [demo] = await sb(`/rest/v1/site_settings?select=*,businesses!inner(slug)&businesses.slug=eq.${process.env.DEMO_SITE_SLUG ?? "kinigi-hills"}`);
  if (!demo) throw new Error("the demo lodge is not in the database (seed)");
  const [b] = await sb("/rest/v1/businesses", { method: "POST", body: JSON.stringify({ slug: HERO_SLUG, name: "Weight Hero Lodge", legal_name: "Weight Hero Lodge", preset: "hotel_lodge", style: "lodge", languages: ["en", "rw"] }) });
  const { businesses: _b, business_id: _id, updated_at: _u, ...settings } = demo;
  await sb("/rest/v1/site_settings", { method: "POST", body: JSON.stringify({ ...settings, business_id: b.id }) });
  const folder = `${b.id}/${crypto.randomUUID()}`;
  const files = await heroFiles(browser);
  for (const [w, body] of Object.entries(files)) {
    const res = await fetch(`${sbUrl}/storage/v1/object/business-media/${folder}/${w}.webp`, { method: "POST", headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "image/webp" }, body });
    if (!res.ok) throw new Error(`upload ${w}: ${res.status} ${await res.text()}`);
  }
  await sb("/rest/v1/media", { method: "POST", body: JSON.stringify({ business_id: b.id, place: "hero", alt: { en: "The volcanoes" }, storage_path: folder, format: "webp", width: 1440, height: 1080, bytes: Object.values(files).reduce((n, f) => n + f.length, 0) }) });
  await sb(`/rest/v1/businesses?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
  return `/s/${HERO_SLUG}`;
}

let failed = false;
const results = [];
try {
  await waitForServer();
  const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  for (const path of PAGES) results.push(await measure(browser, path));
  if (localDb) {
    const path = await heroFixture(browser);
    const r = await measure(browser, path, 2);
    r.path = `${path} @2x`;
    const hero = r.rows.find((x) => x.kind === "Images" && /\/business-media\//.test(x.url));
    if (!hero || !/\/960\.webp$/.test(new URL(hero.url).pathname)) {
      failed = true;
      console.error(`FAIL  ${r.path}: the hero did not load its 960 px file (${hero ? new URL(hero.url).pathname : "no photo"})`);
    }
    results.push(r);
  }
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
