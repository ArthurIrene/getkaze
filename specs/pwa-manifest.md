# Feature: PWA manifest per business
Module: Website   Priority: P1   Preset: both
Decisions: D-012/D-037 (PWA first), D-028 (PWA caching, see below), D-035 (no Vercel-only features), D-041, D-051 (names are config).
Conflicts: none. D-028 mentions "PWA caching"; that needs a service worker, which is **left out of this batch** as you asked (it would add client JavaScript). It is noted here for a later batch.

Goal: A guest (or owner) can add the lodge's site to the home screen with the lodge's own name, colours and icon.

Users: Guests and owners on Android, iOS and desktop.

## What it adds
- **`/manifest.webmanifest`** from Next `app/manifest.ts`, built from the business data (one manifest per business):
  - `name`: business name; `short_name`: the name if it is ≤ 12 characters, else its first word; `description`: the home meta description (seo-basics.md).
  - `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `lang: "en"`, `dir: "ltr"`.
  - `background_color` and `theme_color`: the template's day paper colour (`#f4eee3` for Field Journal), read from a template theme object, not hard-coded per client. The business "color set" (DATA addendum) replaces it later.
  - `icons`: `/icons/192.png`, `/icons/512.png` (`purpose: any`), `/icons/maskable-512.png` (`purpose: maskable`, with a safe-zone margin) and `/icon.svg` (`sizes: any`).
- **Placeholder icons:** accent background (`#3f5b3a`) with the business's initials (first letters of up to two words, "KH") in the paper colour, serif, as a rounded square. PNGs are rendered at build time with `ImageResponse` from `next/og`. That is part of Next.js, not a new dependency, and generated statically with `generateStaticParams`. It must be re-checked on Cloudflare Workers at G2 (overview, point 7). `/icon.svg` is a plain SVG string from a route handler (about 400 B).
- **Head tags:** `<link rel="manifest">`; `apple-touch-icon` (180 px PNG); `icon` → `/icon.svg`, which **replaces the Next.js starter `favicon.ico`** (2.5 KB, today the only image in the first view); `theme-color` per scheme (`#f4eee3` light, `#1e1b17` dark) through the Next `viewport` export.
- **No service worker** and no offline caching in this batch.
- **G2 check (open, recorded 2026-11-12):** before production moves to Cloudflare (gate G2), confirm that `ImageResponse` (`next/og`, used by `apps/web/src/app/icons/[file]/route.tsx`) builds and serves on Cloudflare Workers through the chosen adapter. If it does not, serve the plain SVG icon (`/icons/icon.svg`) plus pre-rendered PNGs. Also tracked in specs/BATCH_LOG.md.

## Data
Read: business name, template id, home description. Icon initials are built in `packages/core` (`initials(name)`, unit tested). No new fields.

## Permissions
Public.

## Module switch
Always on.

## Languages
The manifest uses the business name (not translated) and the English description. The description per language comes when manifests per language are needed.

## Acceptance criteria
1. Given any page, when it loads, then the head links the manifest, the SVG icon and the apple-touch-icon, and sets `theme-color` for light and dark.
2. Given `/manifest.webmanifest`, when fetched, then it is valid JSON with the business name, short name, start URL `/`, `display: standalone`, the theme colours, and 192, 512 and maskable icons that each return a PNG of the stated size.
3. Given a business named "Kinigi Hills", when `/icon.svg` is fetched, then it shows "KH".
4. Given the first view of `/`, when measured, then no `favicon.ico` is loaded and the first-view weight does not grow.
5. Given any page, when it loads, then no service worker is registered.

Playwright: manifest JSON fields, icon sizes (decoded PNG width/height), head tags, no service worker.

## Out of scope
Service worker, offline banner, install prompt UI, real logos (editor uploads), push notifications.

## Definition of Done (BUILD_GUIDE.md §2)
- [ ] Acceptance criteria in the spec all pass.
- [ ] Data has `business_id`; row-level security added; isolation test still passes. *(No database in Batch 1: data stays in the fake demo file; the type carries `businessId`.)*
- [ ] Module switch works (off = invisible or locked, on = works).
- [ ] Permissions follow ROLES.md.
- [ ] Works on a phone screen (360 px wide) and on desktop.
- [ ] English text complete; Kinyarwanda added for platform screens; fallback works.
- [ ] Guest pages within the speed budget on slow 3G.
- [ ] Database change only adds (no removes or renames); migration tested on staging. *(No migration.)*
- [ ] Actions logged where the user changes data. *(Not applicable: read only.)*
- [ ] Tested on the demo client.
- [ ] Docs updated (FEATURES.md, ROADMAP.md, DECISIONS.md if needed).
- [ ] Kinyarwanda checked by a native speaker (D-048).
