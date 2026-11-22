#!/usr/bin/env node
/**
 * Generate supabase/seed.sql from apps/web/src/data/demo-lodge.ts
 * (specs/demo-lodge-database.md). The file stays the one source of the demo;
 * the database gets the same content. Idempotent: fixed ids, upserts.
 *   node scripts/gen-demo-seed.mjs          write the seed
 *   node scripts/gen-demo-seed.mjs --check  fail if the committed seed is out of date (CI)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = `${ROOT}supabase/seed.sql`;
// demo-lodge.ts imports "./demo-photos" without an extension (as Next does); resolve such relative imports to .ts here.
register(
  "data:text/javascript," +
    encodeURIComponent(
      'export async function resolve(s, c, next) { try { return await next(s, c); } catch (e) { if (/^\\.\\.?\\//.test(s) && !/\\.[a-z]+$/.test(s)) return next(s + ".ts", c); throw e; } }',
    ),
);
const { demoLodge, demoLuxe } = await import(`${ROOT}apps/web/src/data/demo-lodge.ts`);

const PUBLISHED_AT = "2026-11-12T00:00:00Z";
const DOLLAR = "$" + "json" + "$";

/** A stable UUID from a name (same input, same id), so re-running updates rows instead of adding them.
 *  A `scope` (business key) is mixed into the hash so the same logical id is unique per business.
 *  Kinigi Hills keeps scope undefined so its block stays byte-identical; Luxe Musanze passes its bidKey. */
function id(name, scope) {
  const input = scope ? `getkaze-demo:${scope}:${name}` : `getkaze-demo:${name}`;
  const h = createHash("sha1").update(input).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v === null || v === undefined ? "null" : `${DOLLAR}${JSON.stringify(v)}${DOLLAR}::jsonb`);
const arr = (xs) => `array[${xs.map(q).join(", ")}]::text[]`;

const styleOf = { lodge: "lodge", townHotel: "town_hotel", guesthouse: "guesthouse" };

/** One demo business to seed: its SiteData, public slug and the stable id seed. */
const businesses = [
  { data: demoLodge, slug: "kinigi-hills", bidKey: "business" },
  { data: demoLuxe, slug: "luxe-musanze", bidKey: "business:luxe" },
];

/** SQL lines for one demo business (Kinigi Hills block stays byte-identical). */
function businessLines(d, slug, bidKey) {
  const style = styleOf[d.propertyStyle];
  const bid = id(bidKey);
  // Kinigi Hills keeps scope undefined (byte-identical block); Luxe Musanze mixes its bidKey in.
  const scope = bidKey === "business" ? undefined : bidKey;
  const lines = [
    `insert into public.businesses (id, slug, name, legal_name, preset, style, template, status, default_currency, languages)`,
    `values (${q(bid)}, ${q(slug)}, ${q(d.name)}, ${q(d.legalName)}, 'hotel_lodge', ${q(style)}, ${q(d.template)}, 'active', ${q(d.defaultCurrency)}, ${arr(d.languages)})`,
    `on conflict (id) do update set name = excluded.name, legal_name = excluded.legal_name, style = excluded.style, template = excluded.template,`,
    `  status = excluded.status, default_currency = excluded.default_currency, languages = excluded.languages;`,
    "",
  ];

  const settings = {
    contacts: { phone: d.contacts.phone, whatsapp: d.contacts.whatsapp, ...(d.contacts.email ? { email: d.contacts.email } : {}) },
    location: {
      map_url: d.location.mapUrl,
      area: d.location.area,
      ...(d.location.distanceNote ? { distance_note: d.location.distanceNote } : {}),
      directions: d.location.directions,
      address: d.location.address,
    },
    dining: { name: d.dining.name, photo: d.dining.photo },
    // L1 extra settings fields
    featured_room_handles: d.featuredRoomHandles ?? [],
    intro: d.intro ?? null,
    closing: d.closing ?? null,
  };
  lines.push(
    `insert into public.site_settings (business_id, contacts, location, hours, payment, booking_payments, stay, sections, hero, facts, moments, dining, host, reviews, rooms_line, seo_description, published_at, featured_room_handles, intro, closing)`,
    `values (${q(bid)}, ${j(settings.contacts)}, ${j(settings.location)}, ${j(d.hours)}, ${j(d.payment)}, ${arr(d.bookingPayments)},`,
    `  ${j(d.stay)}, ${j(d.sections)}, ${j(d.hero)}, ${j(d.facts)}, ${j(d.moments)}, ${j(settings.dining)},`,
    `  ${j(d.host)}, ${j(d.reviews)}, ${j(d.roomsLine ?? null)}, ${j(d.seoDescription ?? null)}, ${q(PUBLISHED_AT)},`,
    `  ${j(settings.featured_room_handles)}, ${j(settings.intro)}, ${j(settings.closing)})`,
    `on conflict (business_id) do update set contacts = excluded.contacts, location = excluded.location, hours = excluded.hours, payment = excluded.payment,`,
    `  booking_payments = excluded.booking_payments, stay = excluded.stay, sections = excluded.sections, hero = excluded.hero, facts = excluded.facts,`,
    `  moments = excluded.moments, dining = excluded.dining, host = excluded.host, reviews = excluded.reviews, rooms_line = excluded.rooms_line,`,
    `  seo_description = excluded.seo_description, published_at = excluded.published_at,`,
    `  featured_room_handles = excluded.featured_room_handles, intro = excluded.intro, closing = excluded.closing;`,
    "",
    `insert into public.business_modules (business_id, module_id, enabled)`,
    `select ${q(bid)}, m.id, m.id = any (${arr(d.modulesOn)}) from public.modules m where 'hotel_lodge' = any (m.presets)`,
    `on conflict (business_id, module_id) do update set enabled = excluded.enabled;`,
    "",
  );

  // catalog_groups (L1)
  if (d.groups && d.groups.length > 0) {
    lines.push(
      `insert into public.catalog_groups (id, business_id, kind, handle, position, name, visible) values`,
      d.groups
        .map(
          (g) =>
            `  (${q(id(`group:${g.id}`, scope))}, ${q(bid)}, ${q(g.kind)}, ${q(g.handle)}, ${g.position}, ${j(g.name)}, true)`,
        )
        .join(",\n"),
      `on conflict (id) do update set handle = excluded.handle, position = excluded.position, name = excluded.name, visible = excluded.visible;`,
      "",
    );
  }

  /** A media row: placeholders (no path) or a static demo photo (seed-only, demo-photos.md). */
  const mediaRow = (p, item, position) => ({
    id: id(`photo:${p.id}`, scope), item, place: p.place, position, alt: p.alt,
    source: p.source === "static" ? "static" : "storage", path: p.path ?? null, format: p.format ?? "webp",
    width: p.width ?? null, height: p.height ?? null, credit: p.credit ?? null,
  });
  const items = [];
  const media = [];
  d.rooms.forEach((r, i) => {
    const iid = id(`room:${r.id}`, scope);
    items.push({ id: iid, kind: "room_type", handle: r.id, position: i, name: r.name, line: r.line, body: r.body, size: r.size, rwf: r.price.rwf, usd: r.price.usd, maxGuests: r.maxGuests, amenities: r.amenities });
    r.photos.forEach((p, k) => media.push(mediaRow(p, iid, k)));
  });
  d.dining.dishes.forEach((x, i) => {
    const iid = id(`dish:${x.id}`, scope);
    items.push({ id: iid, kind: "dish", handle: x.id, position: i, name: x.name, line: x.line ?? null, body: x.body ?? null, rwf: x.price.rwf, usd: x.price.usd, icon: x.icon, groupId: x.groupId ?? null, signature: x.signature ?? false });
    media.push(mediaRow(x.photo, iid, 0));
    if (x.photos) {
      x.photos.forEach((p, k) => media.push(mediaRow(p, iid, k)));
    }
  });
  d.activities.forEach((a, i) => {
    const actId = id(`activity:${a.id}`, scope);
    items.push({ 
      id: actId, 
      kind: "activity", 
      handle: a.id, 
      position: i, 
      name: a.name, 
      line: a.line, 
      distance: a.distance, 
      icon: a.icon, 
      arrange: a.arrange,
      category: a.category ?? null,
      duration: a.duration ?? null,
      body: a.body ?? null,
      whatToBring: a.whatToBring ?? null,
      arrangedBy: a.arrangedBy ?? null,
      goodToKnow: a.goodToKnow ?? null,
      signature: a.signature ?? false,
    });
    if (a.photo) media.push(mediaRow(a.photo, actId, 0));
    if (a.photos) {
      a.photos.forEach((p, k) => media.push(mediaRow(p, actId, k)));
    }
  });

  lines.push(
    `insert into public.catalog_items (id, business_id, kind, handle, position, name, line, body, size, rwf, usd, max_guests, amenities, icon, distance, arrange, category, duration, what_to_bring, arranged_by, good_to_know, signature, airport, group_id) values`,
    items
      .map(
        (x) =>
          `  (${q(x.id)}, ${q(bid)}, ${q(x.kind)}, ${q(x.handle)}, ${x.position}, ${j(x.name)}, ${j(x.line)}, ${j(x.body ?? null)}, ${j(x.size ?? null)}, ${x.rwf ?? "null"}, ${x.usd ?? "null"}, ${x.maxGuests ?? "null"}, ${j(x.amenities ?? [])}, ${q(x.icon ?? null)}, ${j(x.distance ?? null)}, ${x.arrange ? "true" : "false"}, ${j(x.category ?? null)}, ${j(x.duration ?? null)}, ${j(x.whatToBring ?? null)}, ${q(x.arrangedBy ?? null)}, ${j(x.goodToKnow ?? null)}, ${x.signature ? "true" : "false"}, ${x.airport ? "true" : "false"}, ${q(x.groupId ?? null)})`,
      )
      .join(",\n"),
    `on conflict (id) do update set handle = excluded.handle, position = excluded.position, name = excluded.name, line = excluded.line,`,
    `  body = excluded.body, size = excluded.size, price_rwf = excluded.price_rwf, price_usd = excluded.price_usd, max_guests = excluded.max_guests, amenities = excluded.amenities,`,
    `  icon = excluded.icon, distance = excluded.distance, arrange = excluded.arrange, category = excluded.category, duration = excluded.duration,`,
    `  what_to_bring = excluded.what_to_bring, arranged_by = excluded.arranged_by, good_to_know = excluded.good_to_know,`,
    `  signature = excluded.signature, airport = excluded.airport, group_id = excluded.group_id;`,
    "",
    `-- The demo's own photo rows only: rows no longer in demo-lodge.ts go (fake demo data).`,
    `delete from public.media where business_id = ${q(bid)} and id not in (${media.map((m) => q(m.id)).join(", ")});`,
    `insert into public.media (id, business_id, item_id, place, position, alt, source, storage_path, format, width, height, credit) values`,
    media.map((m) => `  (${q(m.id)}, ${q(bid)}, ${q(m.item)}, ${q(m.place)}, ${m.position}, ${j(m.alt)}, ${q(m.source)}, ${q(m.path)}, ${q(m.format)}, ${m.width ?? "null"}, ${m.height ?? "null"}, ${j(m.credit)})`).join(",\n"),
    `on conflict (id) do update set item_id = excluded.item_id, place = excluded.place, position = excluded.position, alt = excluded.alt,`,
    `  source = excluded.source, storage_path = excluded.storage_path, format = excluded.format, width = excluded.width, height = excluded.height, credit = excluded.credit;`,
    "",
  );
  return lines;
}

const lines = [
  "-- DEMO DATA — FAKE. NEVER USE FOR A REAL SITE.",
  "-- Generated by scripts/gen-demo-seed.mjs from apps/web/src/data/demo-lodge.ts. Do not edit by hand:",
  "-- change demo-lodge.ts and run `pnpm db:seed:gen` (CI fails if this file is out of date).",
  "-- Idempotent: fixed ids and upserts, safe to run again.",
  "",
];
for (const { data, slug, bidKey } of businesses) {
  lines.push(...businessLines(data, slug, bidKey));
}
const sql = lines.join("\n");
if (process.argv.includes("--check")) {
  const current = readFileSync(OUT, "utf8");
  if (current !== sql) {
    console.error("FAIL supabase/seed.sql is out of date: run `pnpm db:seed:gen` and commit it.");
    process.exit(1);
  }
  console.log("ok   supabase/seed.sql matches apps/web/src/data/demo-lodge.ts");
} else {
  writeFileSync(OUT, sql);
  const counts = businesses.flatMap(({ data }) => [...data.rooms.flatMap((r) => r.photos), ...data.dining.dishes.map((x) => x.photo), ...data.activities.filter((a) => a.photo).map((a) => a.photo)]);
  console.log(`wrote supabase/seed.sql (${businesses.length} businesses)`);
}
