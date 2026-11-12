# Feature: Speed pass (guest pages)
Module: Website   Priority: P1   Preset: both
Decisions: D-028 (light pages, slow connections), D-041 (light motion kit), D-058 (weight check in CI); FEATURES.md §5 (about 300 KB, slow 3G).
Conflicts: none. The **JS budget is still open**. JS above 160 KB gzipped per page is flagged in BATCH_LOG but does not fail CI.

Goal: Every guest page opens fast on a cheap phone on slow mobile data, and stays that way, because CI measures it on every change.

Users: Guests.

## What it adds
1. **Weight check on every page** (`scripts/weight-check.mjs`): `/`, `/rw`, `/rooms`, `/rw/rooms`, `/contact`, `/rw/contact`, `/book`, `/rw/book`, `/privacy`.
   - Same method as Batch 0: 360 × 800, empty cache, first view, transferred body bytes.
   - **Fails over 300 KB** per page.
   - Prints JS per page and a `FLAG` line when a page's JS is over 160 KB (the run still passes).
   - Writes `weight.json` (CI keeps it as an artefact with `actions/upload-artifact`, pinned to a SHA at least 14 days old). If you'd rather keep CI changes minimal, it prints only.
2. **Slow-3G timing** (`scripts/speed-check.mjs`, `pnpm speed-check`), built with Playwright's Chromium:
   - CDP `Network.emulateNetworkConditions`: latency 400 ms, download and upload 500 kbit/s (the profile PR #2 used, so the numbers compare). Cache disabled, 360 × 800, no CPU throttling.
   - Pages: `/`, `/rooms`, `/contact` (plus `/book`).
   - For each page, the median of 3 runs of **first contentful paint** (`performance.getEntriesByName("first-contentful-paint")`) and **full load** (`loadEventEnd`), printed as a table.
   - **Report only**; it never fails. It runs in CI after the weight check.
   - Guide values to flag (not fail): first paint ≤ 1.5 s, full load ≤ 4 s.
3. **The pass itself:** after features 1–7, run both scripts, then fix what is cheap and safe:
   - The favicon swap (pwa-manifest.md).
   - Shared CSS kept in one file per template.
   - No webfonts.
   - No images in the first view without `loading="lazy"`, except the hero photo.
   - No new client components.
   - Any change is recorded in BATCH_LOG. JS (Next.js and React runtime, about 145 KB) is reported with its file list; cutting it needs a framework decision, so it is not attempted here.

## Data
None.

## Permissions
Not applicable (tooling).

## Module switch
Not applicable.

## Languages
None.

## Acceptance criteria
1. Given CI, when it runs, then the weight check measures all nine pages and fails if any first view is over 300 KB.
2. Given a page whose JS is over 160 KB gzipped, when the check runs, then it prints `FLAG` for that page and still passes.
3. Given `pnpm speed-check`, when it runs, then it prints first paint and full load for `/`, `/rooms` and `/contact` under the slow-3G profile.
4. Given the batch PR, when it is opened, then its description has the page weights and slow-3G timings for each page.

## Out of scope
Service worker caching, image pipeline (editor), CPU throttling, real-device tests (a cheap Android phone check stays a manual step before main, BUILD_GUIDE §3).

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
