# Feature: Demo lodge in the database, getSite() from the database
Module: Templates / Platform core   Priority: P1   Preset: Hotel/Lodge
Decisions: D-040 (Field Journal), D-041 and FEATURES.md §5 (budget), D-053 (staging shows the demo), D-054 (noindex), CLAUDE.md "Never do" (no live database writes; templates only read).
Conflicts: overview point 13 (staging seed through the deploy workflow).

Goal: The demo lodge is a real row set in the database, so every guest page now reads the same way a client site will, without getting heavier.

## Seed (`supabase/seed.sql`, header `-- DEMO DATA — FAKE. NEVER USE FOR A REAL SITE.`)
- **Generated** from `apps/web/src/data/demo-lodge.ts` by `scripts/gen-demo-seed.mjs` (`pnpm db:seed:gen`). CI fails if `seed.sql` is out of date, so the file and the database never drift.
- **Idempotent:** fixed UUIDs, `insert … on conflict do update`. The business `kinigi-hills` is `active`, `published_at` is set, and the modules are `menu` on, others off.
- No users and no memberships in the shared seed. The test-only users (owner A and B, admin) live in `supabase/tests/fixtures.sql`, which runs only in local and CI, never on staging.
- Staging gets the seed only through `db-deploy.yml` → `seed-demo` (manual dispatch, db-testing-and-migrations.md).

## getSite() from the database
- `getSite({ slug } | { host })` in `apps/web/src/data/get-site.ts` calls `get_published_site` with a **server-only, cookie-less** anon client (`@supabase/supabase-js`, no session, `fetch` with Next caching tags `site:<slug>`). It maps the JSON with core `rowToSiteData` and returns `SiteData | null`.
- Supabase code runs **only on the server** (server components, route handlers). No client component imports it, and a build check (`scripts/check-client-bundle.mjs`) fails if `@supabase` appears in any client chunk.
- `demo-lodge.ts` stays as the **source for the seed** and as a unit-test fixture. The app imports it in one place only: the not-configured fallback below (`get-site.ts`; an ESLint rule blocks every other import).

## Cached, and rendered on demand (the build never reads the database)
- Guest pages (home, rooms, contact, privacy) are **rendered on their first visit, then cached**:
  - `generateStaticParams` returns no sites once Supabase is configured, so the build never calls the database. A missing function, a missing seed or an unreachable project cannot fail a build.
  - `export const revalidate = 300` (5 minutes), and each read is tagged `site:<slug|host>`. Batch 3's editor will call `revalidateTag("site:<slug>")` after a save, so changes show at once.
- `/book` stays rendered per request (its date `min`, as in Batch 1). `/book/send` reads the site in the same cookie-less way.

## Build without a database (final fixes, Batch 2)
- **Settings missing** (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` both unset, e.g. a Vercel project before setup, or a fork): `getSite()` returns the bundled demo lodge for the demo slug (`DEMO_SITE_SLUG`) only; every other site is the clean 404. The demo is pre-rendered. The server logs **one** warning ("Supabase is not configured …"). Every platform path (login, auth links, owner, admin) shows **"Not configured yet"** (status 503) instead of crashing.
- **Settings present**: the fallback never applies. A database error (unreachable, function missing, broken row) is a real error (status 500), never hidden behind the demo. Only one of the two settings set is a broken setup and also an error.
- **At G2** this fallback is removed, or kept to the demo slug only (decided at G2; BATCH_LOG lists it).
- Checked by `pnpm check:build` (`scripts/check-build-independence.mjs`, in CI): two production builds, one without settings and one with an unreachable database, each started and requested.

## Guest pages: no JS growth
- The weight check must still pass (≤ 300 KB) with **JS within ±1 KB of Batch 1 (145.4 KB)**; it is flagged in BATCH_LOG otherwise.
- All Batch 1 Playwright tests pass unchanged against the database-backed demo (same text, prices, links and noindex), plus the `/s/kinigi-hills` and subdomain variants (business-by-host.md).

## Acceptance criteria
1. Given local Supabase with the seed, when `/`, `/rooms`, `/contact`, `/book` and `/privacy` load (both languages), then they match Batch 1 (all Batch 1 Playwright tests pass).
2. Given `seed.sql` edited by hand or `demo-lodge.ts` changed without regenerating, when CI runs, then the seed-freshness check fails.
3. Given a guest page build, when the client chunks are scanned, then no `@supabase` code is in them, and JS per page is 145.4 KB ± 1 KB.
4. Given the demo business set to `paused` in the database, when its pages are requested after revalidation, then they return the clean 404.
5. Given the build without the Supabase settings, when it runs and is started, then the build passes, `/` and `/s/kinigi-hills` show the demo lodge, another slug is a 404, `/login` says "Not configured yet", and the server warns once.
6. Given the settings set but the database unreachable (or its functions or seed missing), when the app is built and a guest page is requested, then the build passes and the page is an error (500), not the demo.

## Out of scope
On-demand revalidation from the editor (Batch 3), real photos in Storage (Batch 3), more demo businesses (prospect demos, after Batch 3).

## Definition of Done
BUILD_GUIDE.md §2. The weight check passes.
