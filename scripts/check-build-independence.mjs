#!/usr/bin/env node
/**
 * The build never depends on the database (specs/demo-lodge-database.md,
 * "Build without a database"). Two production builds, each started and checked:
 *
 * 1. Supabase settings missing: the build passes, the demo lodge shows at / and
 *    /s/<demo>, any other site is a clean 404, every platform path answers
 *    "Not configured yet" (503), and the server warns exactly once.
 * 2. Settings present but the database unreachable (or functions and seed
 *    missing): the build still passes (nothing is read at build time), and a
 *    guest page answers 500. The demo never hides a real database error.
 *
 *   node scripts/check-build-independence.mjs
 *
 * Bypasses Turborepo (no cached build replay). Leaves apps/web/.next holding
 * the last build, so run `pnpm build` again before weight, speed or e2e checks.
 */
import { spawn, spawnSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const WEB = `${ROOT}apps/web`;
const PORT = Number(process.env.INDEPENDENCE_PORT ?? 3290);
const BASE = `http://127.0.0.1:${PORT}`;
const WARNING = "Supabase is not configured";

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failures++;
};

/** Environment without any Supabase setting, plus the given ones. */
function envWith(extra) {
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
  for (const k of Object.keys(env)) if (k.startsWith("NEXT_PUBLIC_SUPABASE_") || k === "SUPABASE_SERVICE_ROLE_KEY") delete env[k];
  return { ...env, ...extra };
}

function build(env, label) {
  const r = spawnSync("pnpm", ["exec", "next", "build"], { cwd: WEB, env, encoding: "utf8" });
  check(r.status === 0, `${label}: the build passes`);
  if (r.status !== 0) {
    console.error((r.stdout ?? "") + (r.stderr ?? ""));
    process.exit(1);
  }
}

async function serve(env, run) {
  const server = spawn("pnpm", ["exec", "next", "start", "-p", String(PORT)], { cwd: WEB, env, detached: true });
  let log = "";
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  try {
    for (let i = 0; i < 120; i++) {
      try {
        await fetch(`${BASE}/robots.txt`);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    await run();
    await new Promise((r) => setTimeout(r, 300));
    return log;
  } finally {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* already stopped */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: res.status, body: await res.text() };
};

// 1. Not configured.
{
  const env = envWith({});
  build(env, "settings missing");
  const log = await serve(env, async () => {
    const home = await get("/");
    check(home.status === 200 && home.body.includes("Kinigi Hills"), `settings missing: / shows the demo lodge (${home.status})`);
    const rooms = await get("/s/kinigi-hills/rooms");
    check(rooms.status === 200 && rooms.body.includes("Garden"), `settings missing: /s/kinigi-hills/rooms shows the demo rooms (${rooms.status})`);
    const rw = await get("/s/kinigi-hills/rw");
    check(rw.status === 200 && rw.body.includes("Kinigi Hills"), `settings missing: /s/kinigi-hills/rw shows the demo (${rw.status})`);
    const other = await get("/s/some-other-lodge");
    check(other.status === 404 && !other.body.includes("Kinigi Hills"), `settings missing: another slug is a clean 404 (${other.status})`);
    for (const path of ["/login", "/admin", "/owner", "/rw/login", "/auth/reset"]) {
      const r = await get(path);
      check(r.status === 503 && r.body.includes(path.startsWith("/rw") ? "Ntibiratunganywa" : "Not configured yet"), `settings missing: ${path} says not configured yet (${r.status})`);
    }
    const confirm = await get("/auth/confirm?token_hash=x&type=invite");
    check(confirm.status === 503, `settings missing: /auth/confirm does not reach Supabase (${confirm.status})`);
  });
  const warnings = log.split(WARNING).length - 1;
  check(warnings === 1, `settings missing: exactly one server warning (${warnings})`);
  check(!/Error|Missing NEXT_PUBLIC/.test(log), "settings missing: no server error");
}

// 2. Configured, database unreachable (port 9 refuses connections).
{
  const env = envWith({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9", NEXT_PUBLIC_SUPABASE_ANON_KEY: "not-a-real-key" });
  build(env, "database unreachable");
  const log = await serve(env, async () => {
    for (const path of ["/", "/s/kinigi-hills"]) {
      const r = await get(path);
      check(r.status === 500 && !r.body.includes("Kinigi Hills"), `database unreachable: ${path} is an error, not the demo (${r.status})`);
    }
  });
  check(!log.includes(WARNING), "database unreachable: no not-configured warning");
}

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nThe build does not depend on the database.");
