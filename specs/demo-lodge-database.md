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
- `demo-lodge.ts` stays as the **source for the seed** and as a unit-test fixture. The app no longer imports it at runtime.

## Static with revalidation
- Guest pages (home, rooms, contact, privacy) stay **static**:
  - `generateStaticParams` lists `list_published_slugs()` × locales.
  - `export const revalidate = 300` (5 minutes) for now.
  - Batch 3's editor will call `revalidateTag("site:<slug>")` after a save, so changes show at once.
- `/book` stays rendered per request (its date `min`, as in Batch 1). `/book/send` reads the site in the same cookie-less way.
- **Build without database env** (for example a fork): the build fails with a clear message naming the missing variables. There is no silent fallback to the file, so there is never a second source of truth.

## Guest pages: no JS growth
- The weight check must still pass (≤ 300 KB) with **JS within ±1 KB of Batch 1 (145.4 KB)**; it is flagged in BATCH_LOG otherwise.
- All Batch 1 Playwright tests pass unchanged against the database-backed demo (same text, prices, links and noindex), plus the `/s/kinigi-hills` and subdomain variants (business-by-host.md).

## Acceptance criteria
1. Given local Supabase with the seed, when `/`, `/rooms`, `/contact`, `/book` and `/privacy` load (both languages), then they match Batch 1 (all Batch 1 Playwright tests pass).
2. Given `seed.sql` edited by hand or `demo-lodge.ts` changed without regenerating, when CI runs, then the seed-freshness check fails.
3. Given a guest page build, when the client chunks are scanned, then no `@supabase` code is in them, and JS per page is 145.4 KB ± 1 KB.
4. Given the demo business set to `paused` in the database, when its pages are requested after revalidation, then they return the clean 404.
5. Given the build without `NEXT_PUBLIC_SUPABASE_URL`, when it runs, then it stops with a message naming the variable.

## Out of scope
On-demand revalidation from the editor (Batch 3), real photos in Storage (Batch 3), more demo businesses (prospect demos, after Batch 3).

## Definition of Done
BUILD_GUIDE.md §2. The weight check passes.
