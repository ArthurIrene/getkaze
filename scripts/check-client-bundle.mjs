#!/usr/bin/env node
/**
 * Client bundle guard (specs/db-testing-and-migrations.md, demo-lodge-database.md).
 * Fails when any file the browser can download (.next/static) contains:
 *  - the service role key itself (its value from the environment at build time),
 *  - the name SUPABASE_SERVICE_ROLE_KEY,
 *  - Supabase client code (@supabase/...), which must stay on the server.
 * Run after `pnpm build`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const STATIC = new URL("../apps/web/.next/static", import.meta.url).pathname;
const needles = [
  ["the name SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  ["Supabase client code", "@supabase/"],
  ["Supabase auth client code", "GoTrueClient"],
];
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (key && key.length >= 20) needles.push(["the service role key value", key]);

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(js|mjs|css|json|html|txt|map)$/.test(name)) yield path;
  }
}

let found = 0;
let scanned = 0;
for (const file of files(STATIC)) {
  scanned++;
  const text = readFileSync(file, "utf8");
  for (const [label, needle] of needles) {
    if (text.includes(needle)) {
      found++;
      console.error(`FAIL ${file.replace(STATIC, ".next/static")}: contains ${label}`);
    }
  }
}
console.log(`${found ? "FAIL" : "ok  "} client bundle: ${scanned} files scanned for ${needles.length} patterns${key ? " (including the key value)" : ""}`);
process.exit(found ? 1 : 0);
