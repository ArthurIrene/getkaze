#!/usr/bin/env node
/**
 * Migration guard (specs/core-data.md, D-021: data changes only add).
 * 1. Fails on statements that remove or rename data: DROP TABLE/COLUMN/SCHEMA,
 *    any RENAME, ALTER COLUMN ... TYPE, TRUNCATE.
 * 2. Keeps the reserved slug list in packages/core equal to the database's
 *    (D-062).
 * `--self-test` checks that bad samples are caught.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "supabase/migrations");

const RULES = [
  [/\bdrop\s+table\b/i, "DROP TABLE"],
  [/\bdrop\s+column\b/i, "DROP COLUMN"],
  [/\bdrop\s+schema\b/i, "DROP SCHEMA"],
  [/\brename\b/i, "RENAME"],
  [/\balter\s+column\s+\S+\s+(set\s+data\s+)?type\b/i, "ALTER COLUMN ... TYPE"],
  [/\btruncate\b/i, "TRUNCATE"],
];

/** Remove comments and quoted strings, so words inside them do not count. */
function code(sql) {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\$([a-z_]*)\$[\s\S]*?\$\1\$/gi, (body) => body.replace(/'[^']*'/g, "''")) // keep function bodies, drop their strings
    .replace(/'(?:[^']|'')*'/g, "''");
}

export function problems(sql) {
  const text = code(sql);
  return RULES.filter(([re]) => re.test(text)).map(([, name]) => name);
}

function reservedFromSql(sql) {
  const block = sql.match(/insert into public\.reserved_slugs[^;]*;/i)?.[0] ?? "";
  return [...block.matchAll(/\('([^']+)',/g)].map((m) => m[1]).sort();
}

function reservedFromCore() {
  const ts = readFileSync(join(ROOT, "packages/core/src/slugs.ts"), "utf8");
  const block = ts.match(/export const reservedSlugs = \[([\s\S]*?)\] as const/)?.[1] ?? "";
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
}

if (process.argv.includes("--self-test")) {
  const bad = [
    "alter table public.x drop column y;",
    "DROP TABLE public.x;",
    "alter table public.x rename to z;",
    "alter table public.x rename column a to b;",
    "alter table public.x alter column y type bigint;",
    "truncate public.click_events;",
  ];
  const good = [
    "-- we never drop column data\ncreate table public.y (id int);",
    "comment on table public.y is 'do not rename or drop table';",
    "create or replace function f() returns int language sql as $$ select 1 $$;",
    "drop policy p on public.y; create policy p on public.y using (true);",
  ];
  const missed = bad.filter((s) => problems(s).length === 0);
  const wrong = good.filter((s) => problems(s).length > 0);
  if (missed.length || wrong.length) {
    console.error("self-test failed", { missed, wrong });
    process.exit(1);
  }
  console.log(`self-test ok: ${bad.length} bad samples caught, ${good.length} good samples passed`);
}

let failed = false;
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
let reservedSql = [];
for (const file of files) {
  const sql = readFileSync(join(DIR, file), "utf8");
  const found = problems(sql);
  if (found.length) {
    failed = true;
    console.error(`FAIL ${file}: ${found.join(", ")} (migrations only add, D-021)`);
  } else {
    console.log(`ok   ${file}`);
  }
  if (/insert into public\.reserved_slugs/i.test(sql)) reservedSql = reservedSql.concat(reservedFromSql(sql));
}
const reservedCore = reservedFromCore();
reservedSql = [...new Set(reservedSql)].sort();
if (JSON.stringify(reservedSql) !== JSON.stringify(reservedCore)) {
  failed = true;
  console.error("FAIL reserved slugs differ between packages/core/src/slugs.ts and the migrations", {
    onlyInCore: reservedCore.filter((s) => !reservedSql.includes(s)),
    onlyInSql: reservedSql.filter((s) => !reservedCore.includes(s)),
  });
} else {
  console.log(`ok   reserved slugs match (${reservedCore.length})`);
}
process.exit(failed ? 1 : 0);
