# BATCH_LOG.md

Batch mode (D-052): after each feature, add a short entry here. A new session resumes from the last entry.

Entry format:

```
## Batch <n>, <feature> | <date>
- Built:
- Tests: (unit, Playwright, CI run)
- Page weight: (first view of / and /rw from `pnpm weight-check`, JS separately)
- Deviations: (from the spec, and why)
- Next:
```

## Batch 0, automatic checks and docs | 2026-11-12
- Built: CI workflow (`.github/workflows/ci.yml`: build, lint, typecheck, unit tests, page weight, Playwright on every PR and on pushes to staging and main); `scripts/weight-check.mjs`; Playwright (`@playwright/test` 1.64.1, Chromium) with `e2e/home.spec.ts` and `e2e/hero.spec.ts`; batch mode in CLAUDE.md; D-052 to D-058; BUILD_GUIDE §1, PROJECT §10, EXECUTION_PLAN and COMPLIANCE updated.
- Tests: 22 unit tests; 3 Playwright tests (home happy path, hero card after the pin, reduced-motion card). The hero test was checked to fail when the `animation: linear both` shorthand comes back.
- Page weight: `/` 164.2 KB and `/rw` 164.3 KB transferred (budget 300 KB). JS 144.9 KB transferred in 7 files on both (reported, not enforced).
- Deviations: no spec file (tooling and docs only). The JS number: earlier PRs reported 147.7 KB (browser counter, headers included) and 187.8 KB (every file in `.next/static/chunks` gzipped, including the 112 KB `noModule` polyfill file that modern browsers never download). The weight check counts only what the browser downloads, body bytes only.
- Next: Batch 1, guest site (see EXECUTION_PLAN.md).

## Batch 1, guest site: specs | 2026-11-12
- Built: specs only. They are specs/batch-1-guest-site.md (overview, conflicts, Kinyarwanda list), rooms-page.md, contact-page.md, site-navigation.md, privacy-notice.md, seo-basics.md, booking-request.md, pwa-manifest.md and speed-pass.md. field-journal-template.md now points part 2 to them.
- Tests: none yet.
- Page weight: unchanged (Batch 0: 161.8 KB in CI).
- Deviations: none yet. Conflicts and choices are listed at the top of batch-1-guest-site.md.
- Next: wait for one approval, then build in the order 3 → 1 → 2 → 6 → 4 → 5 → 7 → 8.

## Batch 1, feature 3: site navigation | 2026-11-12
- Built: the shared page layout (`parts/page.tsx`) and a template page registry (`templates[id].home/rooms/...`), plus `renderPage()`. Core `sitePages`/`menuPages` decide which pages the site has. The header has the `<details>` menu on phones and inline links on desktop, the logo links home, and the language pills link to the same page. The footer shows Contact · Privacy links once those pages exist, and the sticky bar has a Call or WhatsApp second button.
- Tests: 25 unit tests (3 new) and 7 Playwright tests (4 new: menu, language pills, desktop inline, no-JS menu). The local CI run is green.
- Page weight: `/` 164.9 KB, `/rw` 165.0 KB (HTML +0.3 KB, CSS +0.4 KB). JS 144.9 KB (7 files).
- Deviations: none.

## Batch 1, feature 1: rooms page | 2026-11-12
- Built: `/rooms` and `/rw/rooms` from T1-Rooms. Each room has a swipe gallery (3 placeholder frames), Nº tag, name and price, amenity icons, "More +" (`<details>`, CSS `:has`), and "Check dates". A "Check-in, children & payment" fold follows the rooms. Home room cards now link to `/rooms#room-<id>`, and "All rooms →" sits in the section head. Core data adds room `amenities`, `roomsLine` and `stay`.
- Tests: 26 unit tests (1 new) and 10 Playwright tests (3 new: rooms happy path, `/rw/rooms`, and nav to Rooms plus the RW pill on `/rooms`). The local CI run is green.
- Page weight: `/` 165.6 KB, `/rooms` 162.5 KB, `/rw/rooms` 162.6 KB. JS 144.9 KB on every page.
- Deviations: until `/book` exists, "Check dates" opens WhatsApp with a "check dates for the {room}" message. That message (`Rooms.datesMessage`, RW draft "Muraho {name}, ndashaka kumenya amatariki ya {room}.") is new wording that was not in the approved list. Demo owner texts in Kinyarwanda (amenity labels, rooms line, stay notes) are drafts for the D-048 check.

## Batch 1, feature 2: contact page | 2026-11-12
- Built: `/contact` and `/rw/contact` as in the approved wireframe. Call, WhatsApp (prefilled "Hello {name}, I have a question.") and email buttons; the drawn map card plus an "Open in Google Maps" button (no iframe); Address, Getting here, Hours and Payment blocks. Desktop has two columns with a sticky map. Home "Find us" gets "All contact details →". The map drawing is now a shared `MapCard`. Core adds `mailLink` and `location.directions`, and the demo lodge gets `hello@example.com`.
- Tests: 28 unit tests (2 new, mailLink) and 13 Playwright tests (3 new: contact happy path, `/rw/contact` fallback, footer Contact link on every page). The local CI run is green.
- Page weight: `/` 166.1 KB, `/contact` 161.7 KB, `/rw/contact` 161.8 KB. JS 144.9 KB.
- Deviations: new wording not in the approved list: `Contact.allDetails` "All contact details →" (RW draft "Aho mwatubariza hose →"). The demo directions in Kinyarwanda are drafts.

## Batch 1, feature 6: WhatsApp booking request | 2026-11-12
- Built: `/book` (and `/rw/book`), a plain HTML form for room, native date inputs (`min` = today in Kigali, `max` = +18 months), guests, payment choice (radio cards from `bookingPayments`, with the method note via `:has`), name, note, and two submit buttons (WhatsApp, email). The header RWF/USD radios join the form (`form="fj-book"`), so the quoted total uses the guest's currency. `POST /book/send` builds the message in core and answers 303 to `wa.me` or `mailto:`. `/book/error?reason=…` explains what to fix. The sticky bar, the menu and each room's "Check dates" now open `/book`.
- Core (`booking.ts`): `parseBookingRequest`, `bookingMessage`, `bookingTarget`, `todayIn`, `addMonths`, `formatStayDate`, `bookingLimits`. **The target is built only from the business's stored WhatsApp number and email** (no open redirect). Caps: name 80, note 500, other fields 40, message 1,200 characters (the note is shortened to fit), and the request body 8 KB.
- Privacy: nothing is stored and the route logs nothing. ESLint `no-console` is an error in `src/app/**/route.ts`. A unit test spies on the console. The error URL carries only the reason.
- Tests: 42 unit tests (14 new: parse rules, dates, guests, caps, message lines in both currencies, the no-open-redirect target, URL length, no console) and 18 Playwright tests. The 5 new ones are: the full flow with `wa.me` intercepted, the error page, a route POST with planted targets and oversized fields, `/rw/book` in Kinyarwanda, and the form without JavaScript. The approved Batch 0 change is in: the home test now asserts that Check availability goes to `/book`. The local CI run is green.
- Page weight: `/book` 162.8 KB, `/rw/book` 163.0 KB. JS 144.9 KB. `/book` renders per request (the `min` date and `?room=`).
- Deviations: no availability calendar, live total, steppers or message preview (they need JavaScript; approved, point 3). There are no phone or email fields (data minimisation, as specced). New wording not in the approved list: the `Book.methodNote.*` texts (mockup wording; RW drafts in rw.json), the error lines (the dates line now says "at most 30 nights"; "missing" now mentions payment), and the plural forms in `Book.msg.*`.

## Batch 1, feature 4: privacy notice | 2026-11-12
- Built: `/privacy` and `/rw/privacy`. One platform text (`messages/en.json`, `Privacy`) filled from business data by core `privacyFacts`: controller, contacts (email only if set), processor (`platform.company` Altavision), no cookies, no analytics, hosting logs, booking requests (not stored), hosting (`platform.hosting`), rights under Law 058/2021 and the NCSA complaint route. The **"Draft, pending legal review"** line shows while `platform.privacyNotice.status` is `"draft"`, and registration numbers appear only once set. The footer "Privacy" link is on every page. **The `NEXT_LOCALE` cookie is off** (`localeCookie: false`), so guest pages set no cookies. The lawyer questions (transient processing, roles, access logs, text review) were added to COMPLIANCE.md §2 step 6.
- Tests: 44 unit tests (2 new) and 22 Playwright tests (4 new: footer link and filled notice with the draft line, `/rw/privacy` headings with English body, no `Set-Cookie` on 7 pages, the Privacy link on every page). The local CI run is green.
- Page weight: `/privacy` 162.0 KB, `/rw/privacy` 162.2 KB. JS 144.9 KB.
- Deviations: the Kinyarwanda body falls back to English (approved, point 4). New Kinyarwanda heading not in the list: "Changes" → "Impinduka". The list's "Contact" heading was not needed.

## Batch 1, feature 5: SEO basics | 2026-11-12
- Built: core `seo.ts` provides `pageSeo` (title, description ≤ 160, canonical, hreflang alternates only for translated languages plus x-default, og locale), `indexedLocales` (D-029), `localePath`, `lodgingJsonLd` (type from `propertyStyle`: LodgingBusiness, Hotel or BedAndBreakfast), `jsonLdText` (escapes `<`) and `clip`. The web side has `pageMetadata()` for every page (metadataBase, Open Graph, twitter summary), JSON-LD on home, `/sitemap.xml` (all pages × translated languages with alternates) and `/robots.txt` (Allow all, Sitemap, **no Disallow**). New data: `baseUrl`, `propertyStyle`, `location.address`, optional `seoDescription`, and room `priceValue` in the view. **noindex is unchanged** (meta + `X-Robots-Tag`, also on sitemap and robots).
- Tests: 53 unit tests (9 new, including an untranslated language pointing its canonical to English with no alternates) and 25 Playwright tests (3 new: the metadata check across all 10 pages, the home JSON-LD, sitemap and robots). The local CI run is green.
- Page weight: `/` 167.5 KB (HTML +0.9 KB for metadata and JSON-LD). JS 144.9 KB.
- Deviations: Next writes the home canonical as `https://getkaze.vercel.app` (no trailing slash), which is the same URL. The "untranslated language" rule is checked by unit tests, not Playwright, because the demo lodge has both languages. New Kinyarwanda wording not in the list: `Seo.*` (style words "Hoteli", "Inzu y'abashyitsi"; title and description frames).

## Batch 1, feature 7: PWA manifest | 2026-11-12
- Built: `/manifest.webmanifest` from `app/manifest.ts`, per business: name, `short_name` (core `shortName`), description (home meta description), `start_url` and `scope` `/`, `display: standalone`, colours from the template theme (`templateThemes`), and 192, 512, maskable-512 and SVG icons. The placeholder icons show the business initials (core `initials`, "KH") on the accent colour, from `app/icons/[file]/route.tsx`: an SVG string, plus PNGs made at build time with `ImageResponse` (`next/og`, part of Next.js). `apple-touch-icon` is 180 px. `theme-color` is set per scheme via `generateViewport`. **The Next.js starter `favicon.ico` is removed** and the first view now loads `/icons/icon.svg` (0.2 KB instead of 2.5 KB). No service worker.
- **Open check for G2:** confirm `ImageResponse` works on Cloudflare Workers before production moves (gate G2). The fallback is the SVG icon plus pre-rendered PNGs. Recorded in specs/pwa-manifest.md.
- Tests: 55 unit tests (2 new) and 28 Playwright tests (3 new: head tags and no service worker, manifest fields and icon sizes from the PNG headers, no favicon.ico in the first view). The local CI run is green.
- Page weight: `/` 165.8 KB, down 1.7 KB, with images now 0.2 KB. JS 145.4 KB (+0.5 KB, all in Turbopack's runtime chunk `turbopack-*.js`, 3.9 → 4.3 KB, which lists the app's routes; the icon and manifest routes added to it).
- Deviations: none.

## Batch 1, feature 8: speed pass | 2026-11-12
- Built: the weight check now measures all nine guest pages (`/`, `/rw`, `/rooms`, `/rw/rooms`, `/contact`, `/rw/contact`, `/book`, `/rw/book`, `/privacy`). It prints one row per page, groups the JS file list by pages that share it, **fails over 300 KB**, and **prints `FLAG` when a page's JS is over 160 KB** (checked with a lowered threshold: FLAG printed, exit 0). It writes `weight.json`. New `scripts/speed-check.mjs` (`pnpm speed-check`) is a report-only slow-3G run (400 ms, 500 kbit/s down and up, no CPU throttling, 360 × 800, empty cache, median of 3) of first contentful paint and `loadEventEnd` for `/`, `/rooms`, `/contact` and `/book`, written to `speed.json`. CI runs both and keeps the two JSON files with `actions/upload-artifact@cf430e0…` (v7.0.2, released 2026-10-07, 36 days old).
- The pass itself: the favicon swap (feature 7) took the first-view image from 2.5 KB to 0.2 KB. There are no webfonts, no images in the first view and no client components of our own, and CSS is one shared file per template (9.8 KB). Nothing else was cheap to cut. **JS: 145.4 KB on every page, all Next.js/React runtime, so it is under the 160 KB flag.**
- Slow 3G (median of 3): `/` first paint 1.36 s, load 3.58 s; `/rooms` 1.38 s, 3.60 s; `/contact` 1.36 s, 3.58 s; `/book` 1.37 s, 3.58 s. All are within the guide (≤ 1.5 s, ≤ 4 s).
- Page weight (transferred): `/` 165.8 KB, `/rw` 165.9 KB, `/rooms` 161.9 KB, `/rw/rooms` 162.1 KB, `/contact` 160.8 KB, `/rw/contact` 160.9 KB, `/book` 161.7 KB, `/rw/book` 161.9 KB, `/privacy` 160.7 KB.
- Tests: 55 unit tests and 28 Playwright tests. The local CI run is green.
- Deviations: none.

## Batch 1, wrap-up | 2026-11-12
- All 8 features are built in the agreed order (3 → 1 → 2 → 6 → 4 → 5 → 7 → 8), with the local CI run green after each. Screenshots at 360 × 800 and 1440 × 900 are in `docs/screenshots/batch-1/`. One PR goes into staging; its first CI run is the remote check.
- **Open items carried forward:** the `ImageResponse` check on Cloudflare Workers at G2; the lawyer review of the privacy text and the questions in COMPLIANCE.md §2 step 6; the native-speaker check of all new Kinyarwanda (the approved list plus the additions noted per feature above); the JS budget decision (145.4 KB today, all framework runtime).
- Next: Batch 2 (data and access). It starts with core data, RLS and the isolation test, then a checkpoint.

## Batch 1, CI fix on PR #5 | 2026-11-12
- Failure: 3 booking tests (the full flow, the Kinyarwanda message, no JavaScript) timed out waiting for `wa.me`. Playwright routes only the first URL of a redirect chain, and `wa.me` is reached through the server's 303, so the `wa.me` route never fired. The tests passed locally only because the local browser was not the pinned one (v1243 instead of v1248). Reproduced locally on v1248 with the old test file: 3 failed.
- Fix (approved): the tests route the form's `POST /book/send`, send it to the real server with `route.fetch({ maxRedirects: 0 })`, and keep status and `Location`. Every earlier assertion stays. Added: status is exactly 303, and `Location` is exactly `https://wa.me/250700000000?text=<full message>`, checked in English, Kinyarwanda and without JavaScript. A new test checks that "Send by email" gives exactly `mailto:hello@example.com?subject=…&body=…`. The direct `request.post` test is unchanged.
- Local runs now use the pinned browser: `pnpm exec playwright install chromium` (CLAUDE.md, e2e commands). This needed `cdn.playwright.dev`, allowed in a new personal cloud environment "getkaze".
- Tests: 29 Playwright tests (1 new), all passing locally on v1248.

## Batch 2, item 0: docs | 2026-11-12
- Built: CLAUDE.md Batch mode now says a draft PR opens at the start of each batch, screenshots go to CI artifacts or the PR (never committed), and environment, network or account changes outside the repo need asking first. D-059 owner login (email and password, invite only, no sign-up, no SMS, custom sender before G2), D-060 admin TOTP 2FA (aal2 on admin screens and data) and D-061 Wording editor (Batch 3: database override, then the messages file, then English). ROLES §3, PROJECT §12 and the batch list, FEATURES (Languages row), EXECUTION_PLAN, ROADMAP and BUILD_GUIDE are updated (Batch 3 adds the Wording editor and owner dashboard). New docs/kinyarwanda-glossary.md (all draft; check-in and check-out have two words in use) and docs/how-to-edit-wording.md.
- Note: Batch 1 committed `docs/screenshots/batch-1/` (about 1.5 MB) before this rule. It is left as is; say if it should be removed.

## Batch 2, specs | 2026-11-12
- Built: specs only. They are batch-2-data-access.md (overview with 13 conflicts and open questions), core-data.md, row-level-security.md, db-testing-and-migrations.md, auth.md, platform-admin.md, owner-your-site.md, business-by-host.md and demo-lodge-database.md.
- Sandbox findings: Docker works; Docker Hub works; AWS ECR (Supabase's default image registry) is blocked; running the downloaded Supabase CLI was denied by the session's permission check (not worked around).
- Next: wait for one approval. Then features 1–3, then the **checkpoint**.

## Batch 2, approval answers and my choices | 2026-11-12
- **Approved:** `@supabase/supabase-js` 2.118.0 and `@supabase/ssr` 0.12.7 (both over 14 days old; installed when first used, in feature 4). `supabase/setup-cli` v3.0.1, the CLI 2.122.0, and `db-deploy.yml` (runs only after CI passes on a push to `staging`, never on PRs). Option (a): the local CLI is the official release, verified with `sha256sum -c` against the release's `checksums.txt` (`scripts/supabase-cli.sh`). The service role key goes in Vercel **Production only**, server only, used only by the invite route behind admin 2FA, with a CI check. `role_permissions` and the `/s/<slug>/` fallback are approved. **D-062** records the domains: `<slug>.altavision.rw` (`PLATFORM_DOMAIN`), our screens on `kaze.altavision.rw` (`APP_HOST`), and the reserved names. You run the first-admin SQL on staging yourself.
- **My choices on the other overview points** (following the recommendations): built-in email sender for testing only, Mailpit locally and in CI (point 10). Platform screens EN + RW with drafts in the glossary (point 11). No guest tables, and `click_events` without IP or user agent (point 12). The staging demo seed comes only through the deploy workflow's manual `seed-demo` job (point 13). Supabase auth cookies only on platform paths (point 7). Images from Docker Hub (`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`), because AWS ECR is blocked here, so no network change was needed.
- **Open, waiting for you:** the staging Postgres major version (`major_version = 17` is set for now), and the list of subdomains Altavision already uses (to add to the reserved names).

## Batch 2, feature 1: core data | 2026-11-12
- Built: `supabase/config.toml` (sign-up off, TOTP on, site URL `127.0.0.1:3200`, Postgres 17). Migration `20261112100000_core_schema.sql` creates `reserved_slugs`, `businesses`, `site_settings`, `modules`, `business_modules`, `role_permissions` (seeded from ROLES.md), `memberships`, `platform_admins`, `catalog_items`, `media` (a composite FK keeps photos in their own business), `click_events` (no IP or user agent), `content_changes` and `support_access`. Checks cover LocalizedText (English required, known languages), both prices or neither, a complete room type, the slug format, styles fitting their preset, and a published site needing its key texts. Migration `20261112100100_change_log.sql` adds the change-log triggers (changed fields only, actor and kind), the append-only guard, the keep-`business_id` guard and the module-switch stamp. Core gains `slugProblems`, `normalizeSlug`, `reservedSlugs`, `presetDefaults` and `styleFitsPreset`. `scripts/check-migrations.mjs` is the additive-only guard plus the reserved-list match, with a self-test. `scripts/supabase-cli.sh` provides the verified pinned CLI.
- Tests: pgTAP `schema.test.sql` (19 checks: business_id everywhere and indexed, no guest columns, prices, English required, slugs and reserved names, publish completeness, change log, append-only, no moving rows, the media FK, role permissions). 61 unit tests (6 new). Run locally on Supabase 2.122.0: all pass.
- Page weight: no change (no app code changed).
- Deviations: `rowToSiteData` (core-data.md) moves to feature 8, where `getSite()` first uses it; the public JSON shape is fixed in feature 2. Supabase's slug and reserved checks raise `23514`.

## Batch 2, feature 2: row-level security and the isolation test | 2026-11-12
- Built: migration `20261112100200_rls.sql`.
  - Private helpers `app.is_platform_admin()` (needs `aal2` **and** a `platform_admins` row), `app.is_member()` and `app.has_permission()` (memberships × `role_permissions` by preset): `security definer`, `search_path = ''`.
  - All table privileges revoked from `anon` and `authenticated`, and default privileges revoked for future tables.
  - RLS **enabled and forced** on every table, with per-table grants and policies as specced. Owners edit content only; switches, memberships, status and slug belong to the admin; the change log is read-only; support access is written by admins and read by owners. Disabled members see nothing, not even their own row.
  - Migration `20261112100300_public_site.sql`: `get_published_site(p_slug, p_host)` and `list_published_slugs()`, the only door for `anon`: active and published businesses only, explicit fields, no personal data.
- Tests: pgTAP `isolation.test.sql` has 104 checks in the 9 groups of the spec. It loops over every table with `business_id` and every table for anon, so new tables are covered. **Checked that it catches a leak:** with one policy widened to `using (true)` on the local database, 4 checks failed; after a reset, all passed. Both test files together: 123 checks pass.
- Found and fixed while writing the tests (before anything reached staging): the check constraints call `app.is_localized`, so `authenticated` needs EXECUTE on it; and a disabled member could read their own membership row, which is now hidden.
- Page weight: no change.
- Deviations: none.

## Batch 2, feature 3: how tests run, and how migrations reach staging | 2026-11-12
- Built:
  - **CI** (`ci.yml`): `supabase/setup-cli@45a513f…` (v3.0.1) with CLI 2.122.0, then the migration guard (`pnpm db:check`), `supabase start` (unused services off), `supabase test db` (isolation and schema checks), and the local URL and keys (the CLI's public local defaults) written into the job env for the app. A new **client bundle guard** (`pnpm check:bundle`) runs after the build: it fails if any browser file contains the service role key value, its name, or Supabase client code. Checked that it fails on a planted file.
  - **`db-deploy.yml`:** runs only after **CI succeeds on a push to `staging`** (`workflow_run`, `event == push`, `head_branch == staging`), or by manual dispatch on `staging`; **never on PRs**. GitHub environment `supabase-staging`, then guard, link, dry run and push. The demo seed is applied only by a manual run with `seed_demo`. It deploys the exact commit CI tested.
  - `.env.example` (names only) and CLAUDE.md commands (CLI, stack, reset, `db:test`, `db:check`, `check:bundle`, the staging migrate rule).
- Tests: the local CI run is green (build, lint, typecheck, 61 unit tests, weight check, 29 Playwright tests) plus 123 database checks. The remote CI run on this push is the first with Supabase in it.
- Page weight: no change (no app code changed). JS 145.4 KB.
- Deviations: none.

## Batch 2, checkpoint notes applied | 2026-11-12
- The checkpoint was approved. Staging Postgres is 17.11.0.018, so `major_version = 17` is right. Altavision's subdomains will be added to the reserved names when you send them (a new migration plus `reservedSlugs`; the guard keeps them equal).
- **Change-log deletion path** (migration `20261112100400_change_log_deletion.sql`): `admin_delete_change_log(business, reason)` is admin with aal2 only, deletes that business's log rows, and records the deletion in `support_access`. The append-only guard lets only this function through. Tests: `change_log.test.sql` (16 checks: the path works for admin aal2 and touches only that business; owner, admin aal1, anon, the service role and the database owner are refused direct edits and deletes; logging continues afterwards).
- **Public fields locked:** `public_site_fields.test.sql` (11 checks) confirms both public functions are `security definer` with `search_path = ''`, compares the exact field names at every level (top, business, settings, contacts, items, media), and checks that an owner's email and an unlisted contact key never appear. The field list is in specs/row-level-security.md.
- Database tests: 4 files, 152 checks, all pass locally.

## Batch 2, CI fix: local Supabase ports | 2026-11-12
- Failure on `4e62b4d`: `supabase start` could not bind `0.0.0.0:54322` ("address already in use") on the runner. **Root cause:** the CLI's default ports (54321–54329) are inside Linux's ephemeral port range (32768–60999), so an outgoing connection on the runner can hold one. **Fix:** all local Supabase ports moved to 25320–25329 (`supabase/config.toml`), below that range. Tests are unchanged. The previous green run had simply not collided.

## Batch 2, feature 4: owner and admin login | 2026-11-12
- Built:
  - **Packages:** `@supabase/supabase-js` 2.118.0 and `@supabase/ssr` 0.12.7 (exact, approved), server only.
  - **Supabase code:** `lib/supabase/{env,server,refresh}.ts`. Cookies are forced **HttpOnly** and **SameSite=Lax**, and Secure over HTTPS; there is no browser Supabase client. The proxy refreshes the session **only on platform paths** (core `isPlatformPath`), so guest pages still set no cookies.
  - **Screens and routes:** `/login`, `/auth/reset`, `/auth/confirm` (verifies the email link's token hash on the server; fixed target per link type), `/auth/accept` (invite → first password), `/auth/update-password`, `/auth/signout` (POST), and a first `/owner` page. All are plain forms with server actions (they work without JS), EN + RW.
  - **Rules in core:** `canEnter`, `landingFor`, `safeNext`, `passwordProblems`, `confirmTarget`, `isPlatformPath`.
  - **Email templates** (`supabase/templates/invite.html`, `recovery.html`) link to `/auth/confirm?token_hash=…&type=…`. **Staging needs the same templates** pasted in Dashboard → Authentication → Emails (invite and reset password).
  - The ESLint `no-console` rule now also covers the platform routes and the auth and Supabase helpers.
- Found while testing:
  - In the CLI config, `[auth.email] enable_signup = false` disables email login entirely, so it is back to `true`. Public sign-up stays off through `[auth] enable_signup = false`, and the test proves sign-up is refused.
  - The local email limit was 2 per hour, so it is raised to 200 locally only.
  - Redirects now use the request's own host, so cookies follow the visitor.
- Tests: 69 unit tests (7 new) and 37 Playwright tests (8 new, against the local Supabase): the invite → accept → `/owner` flow, password rules, the same answer for a wrong password and an unknown email, reset by email → new password → sign out → sign in, the same reset answer for unknown emails, sign-up refused, bad email links → login, no guest-page cookie for a signed-in owner (whose cookies are HttpOnly), and a disabled owner seeing "No active site". 152 database checks.
- Page weight: guest pages are +0.8 KB of CSS (the shared Tailwind file now includes the platform classes); JS is **145.4 KB, unchanged**. `/` is 166.4 KB.
- Deviations: invites and resets use token-hash links to `/auth/confirm` instead of a `/auth/callback` code exchange, because admin-API invites carry no PKCE code. `/owner` is a first version; feature 6 completes it.

## Batch 2, feature 5: platform admin with TOTP 2FA | 2026-11-12
- Built:
  - **2FA gate:** `/admin/mfa/enroll` shows a QR code and the key as text, then asks for a 6-digit code; earlier unfinished enrolments are removed first. `/admin/mfa` asks for the code on every new session. Every admin page and every admin action re-checks admin + aal2 on the server (`requireArea`, core `canEnter`), and RLS checks it again in the database.
  - **Screens:** `/admin` lists clients (name, slug, status, style, modules on, owner status; filter by status, search by name). `/admin/new` creates a business from name, slug (from the name if empty), type and style (the preset comes from the style, core `presetOfStyle`), currency and languages: it is a **draft** with the preset's sections and modules (the others off). `/admin/b/<id>` holds basics (name, legal name, slug, custom domain, status; "active" needs a published site, core `canSetStatus`), module switches, owner invite and the member list with disable and enable, support sessions (open with a reason and close, with a banner while open), and the last 20 changes.
  - **Owner invite:** the only use of the service role (`lib/supabase/admin.ts`). An ESLint `no-restricted-imports` rule forbids that file everywhere except the admin actions (checked with a planted import), and the bundle guard checks the browser files.
  - **New migration** `20261112100500_accept_invites.sql`: `accept_my_invites()` turns only the caller's own invited memberships to active (never disabled ones). It is called when an invite is accepted.
  - Core adds `siteBaseUrl`, `sitePath`, `supportReasonProblems`, `canSetStatus`, `looksLikeEmail` and `presetOfStyle`.
- Tests: pgTAP `accept_invites.test.sql` (6 checks; 5 database test files and 158 checks in all). 74 unit tests (5 new). 41 Playwright tests (4 new: TOTP enrolment, including a wrong code, then the code required on a new session; a non-admin sent away; create a business with a reserved-slug refusal, draft modules, the "must publish" rule, a module switch logged as `platform_admin`, the owner invite email and membership, support session open and close; invite acceptance → membership active). The local CI run is green.
- Page weight: no change for guests (JS 145.4 KB). `/` is 166.8 KB.
- Deviations: the slug for a new business comes from its name when left empty. Admin wording RW drafts are in rw.json under `Admin` (also for the glossary). There is no "publish site" button yet; the editor (Batch 3) publishes, and the demo seed is published.

## Batch 2, feature 6: owner "Your site" | 2026-11-12
- Built: `/owner` (`/rw/owner`) shows one card per business the owner belongs to: name, a status pill (Live, Not live yet, Paused), the site address with "Open your site ↗" (core `siteBaseUrl`: `/s/<slug>` on getkaze.vercel.app until `PLATFORM_DOMAIN` is set), languages, modules switched on, and **our support visits** (when, reason, open or closed; ROLES.md §5), plus "Need a change? WhatsApp us" (`platform.supportWhatsApp`, a placeholder number). Everything is read through RLS as the owner, never the service role. With no active membership it shows "No active site for this account". An admin without a business is sent to `/admin`. Core `ownerSiteSummary` builds the cards.
- Found while testing:
  - The **service role could not evaluate the check constraints** (no USAGE on schema `app`), so any server-side service-role write to `site_settings`, `catalog_items` or `media` would have failed. New migration `20261112100600_service_role_checks.sql` grants only `is_localized` and `is_localized_or_null`, with a database test.
  - The isolation and change-log fixtures touched every business in the database, so they are now scoped to their own rows. The database tests pass even with leftover data.
- Tests: 159 database checks, 75 unit tests (1 new), and 43 Playwright tests (2 new: live site card with address, modules and a support visit while another business's data stays invisible, no sideways overflow at 360 px; draft card "Not live yet", "No support visits yet" and the `/rw/owner` wording). The local CI run is green.
- Page weight: guests unchanged (JS 145.4 KB). `/` is 166.9 KB.
- Deviations: none.

## Batch 2, feature 7: business by host | 2026-11-12
- Built:
  - **Core `hosts.ts`:** `parseHost` (subdomain of `PLATFORM_DOMAIN`, app host, bare/www domain → demo, platform hosts with the `/s/<slug>` fallback or the demo, any other valid host → custom domain, junk/IP/reserved/nested → unknown), `servesPlatformScreens`, `splitLocale`, `siteKey`/`parseSiteKey` (a slug, `p~<slug>` for the fallback, or a custom host with dots), `normalizeHost` and `fallbackSlug`.
  - **The proxy** has no database call. Platform screens are served only on platform hosts or `APP_HOST`, with the session refresh; on a business host they 404. Every guest path is rewritten to the internal route `/<locale>/site/<key>/…`, and **the internal route itself is a 404 from outside**.
  - **Guest pages** moved to `app/[locale]/site/[site]/…`. They are static with `revalidate = 300`; demo keys are pre-rendered, and `/book` stays per request.
  - **Links keep the prefix:** `pageHref` takes the site's `linkBase` (`""` or `/s/<slug>`), and so does the booking form's action and error path.
  - **Root files per host:** `sitemap.xml`, `robots.txt`, `manifest.webmanifest` and `/icons/*` read the site for the request's host. Icons are rendered per request and cached for a day.
  - **Clean 404 page** (`app/[locale]/not-found.tsx`): "This site is not available", no business data, noindex.
  - Settings: `PLATFORM_DOMAIN`, `APP_HOST`, `PLATFORM_HOSTS`, `DEMO_SITE_SLUG`, `FALLBACK_HOST`.
- Tests: 84 unit tests (9 new) and 49 Playwright tests (6 new, `e2e/hosts.spec.ts`):
  - every link on `/s/kinigi-hills/rooms` keeps the prefix; the booking form posts and errors within it;
  - the bare host shows the demo; unknown slugs, reserved slugs and the internal route give a 404 with noindex;
  - with a second server on `PLATFORM_DOMAIN=altavision.test` and Chromium mapping `*.altavision.test` to this machine: `kinigi-hills.altavision.test/rw/contact` works with prefix-free links; unknown, reserved and nested subdomains and `/login` and `/admin` on a business host give a 404; `kaze.altavision.test/login` works.

  The SEO test's base moved to the demo's own address, as the spec says (canonical = the demo's `siteBaseUrl`); its assertions are unchanged.
- Page weight: every page passes; JS is 145.4 KB (unchanged); `/` is 167.2 KB.
- Deviations: `PLATFORM_DOMAIN` is a **build-time** setting for canonical and sitemap addresses (static pages), so it needs a redeploy after a change; routing reads it per request. Noted in the spec. `/en/...` paths are now a 404 instead of a redirect to `/...`. The layout's theme colour is the template's (one template for now).

## Batch 2, feature 8: demo lodge in the database, getSite() from the database | 2026-11-12
- Built:
  - **Seed:** `supabase/seed.sql` is **generated** from `apps/web/src/data/demo-lodge.ts` by `scripts/gen-demo-seed.mjs` (`pnpm db:seed:gen`): fixed name-based ids, upserts, marked DEMO DATA — FAKE. Checked idempotent by applying it twice (same counts). `pnpm db:check` (in CI) now also fails when the seed is out of date.
  - **New migration** `20261112100700_item_handles.sql`: `catalog_items.handle` (readable ids for `#room-…` and `?room=…`, unique per business and kind), now also returned by `get_published_site`. The locked field list and its test are updated with exactly this one field.
  - **Core `rowToSiteData`** maps the public JSON to `SiteData` with plain checks (template, style, currency, name, contacts, map link, English hero title, both prices); a broken published site raises an error instead of rendering half empty.
  - **`getSite()`** (server-only) calls `get_published_site` with a cookie-less anonymous client and Next caching (`revalidate` 300 s, tag `site:<slug|host>`). `publishedSlugs()` feeds static generation. The app no longer imports `demo-lodge.ts` (an ESLint rule enforces it; it only feeds the seed). The restricted-import rules are regrouped so the two restrictions don't override each other.
  - **Build without database settings** stops with "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY", so there is no silent fallback to the file.
  - Glossary: platform-screen terms added (all draft).
- Tests: 87 unit tests (3 new: mapping, ordering and handles, refusing a broken site); 159 database checks; 52 Playwright tests (3 new: the demo exists in the database; a new active, published business shows at `/s/<slug>` without a rebuild, with its own canonical; draft, unpublished and paused businesses give a clean 404 with no business data). **All Batch 1 guest tests pass unchanged against the database.** Bundle guard: no Supabase code in any browser file.
- Page weight: **JS 145.4 KB on every guest page, unchanged** (within ±1 KB of Batch 1); every page is under 300 KB (`/` 167.2 KB).
- Deviations: pages stay cached for up to 5 minutes after a change (including a pause) until the Batch 3 editor revalidates on save. Room and dish photos are `media` rows; other photos (hero, moments, dining, host) stay in `site_settings` JSON until the editor's photo upload (Batch 3).

## Batch 2, final fixes | 2026-11-12
- Built:
  - **Reserved names:** `www`, `send`, `resend`, `zmail`, `mail`, `webmail`, `email`, `smtp`, `mx`, `autodiscover` are reserved in core and in the database. The new additive migration `20261112100800_reserved_mail_names.sql` uses `on conflict do nothing`. Names starting with `_` stay invalid by the slug format. The migration guard now reads every `reserved_slugs` insert, and core and SQL match (33 names).
  - **The build never reads the database:**
    - `generateStaticParams` returns no sites once Supabase is configured. Pages render on their first visit, then are cached (5 minutes, tag `site:<slug|host>`).
    - **Settings missing** (both `NEXT_PUBLIC_SUPABASE_*` unset): `getSite()` serves the bundled demo for the demo slug only, pre-rendered, with one server warning. Every other site is a 404, and every platform path shows "Not configured yet" (503, EN and RW). The proxy skips the session refresh, and `/auth/confirm` and `/auth/signout` never call Supabase.
    - **Settings present:** a database error is a 500, never the demo. Only one of the two set is also an error.
    - Settings are read when used, not inlined at build time. ESLint allows the demo import in `src/data/get-site.ts` only.
  - **db-deploy:** when all three `supabase-staging` settings are missing, it ends green with the notice "staging not configured" and every later step is skipped. When only some are missing, it fails and names them.
  - **No deploy order:** Vercel and the migrations can happen in any order (spec and PR comment updated).
  - Spec fixes: the staging redirect URLs and the local `additional_redirect_urls` are now `/auth/confirm`, the route actually built in feature 4. auth.md now says the same.
- Tests:
  - 162 database checks (3 new: `resend`, `zmail` and `_mail` refused).
  - 88 unit tests (the reserved-names and underscore tests extended).
  - **`pnpm check:build`** (`scripts/check-build-independence.mjs`, a new CI step) runs two production builds and starts each one:
    - **Settings missing:** the build passes; `/`, `/s/kinigi-hills/rooms`, `/s/kinigi-hills/rw` and `/book` show the demo; another slug is a 404; `/login`, `/admin`, `/owner`, `/rw/login`, `/auth/reset` and `/auth/confirm` answer "Not configured yet" (503); exactly one warning; no server error.
    - **Database unreachable:** the build passes; `/` and `/s/kinigi-hills` are a 500, not the demo; no not-configured warning.
  - The db-deploy check step was run locally in all three cases (none set → skip, some set → fail, all set → run).
- Found while testing: with no sites pre-rendered, `/book` and `/book/error` (which read `?room=` and `?reason=`) were treated as cached pages and failed with `DYNAMIC_SERVER_USAGE`. They are now marked `force-dynamic`, so they are rendered per request as before. The full Playwright suite caught it (52 tests pass now), and `check:build` covers `/book` too.
- Page weight: unchanged. Every guest page has 145.4 KB of JS; `/` is 167.1 KB and `/book` 163.1 KB.
- Deviations and choices:
  - Guest pages are no longer pre-rendered once configured, so the first visit after a deploy or after 5 minutes renders on the server.
  - Platform paths answer 503 while not configured, so nothing caches the notice as a real page.
  - **At G2: remove the demo fallback, or keep it to the demo slug only.**

## Nav polish (feature/nav-polish) | 2026-11-12
- Built (CSS only, no JavaScript):
  - **Sticky header** on every page: 56 px, solid paper background with a hairline, full width.
    - On the home page it sits on the pinned hero with no background, as before. When the pin ends, a step on the hero's scroll timeline (longhands only) makes it solid and it stays at the top.
    - Anchors land below it, and the contact map's sticky offset clears it.
  - **No "Home" link:** the name links home, so the nav is Rooms and Contact (core `menuPages`).
  - **One "Check availability" per screen:** the bottom bar on phones (it is left out of the header and menu), the header button on desktop (the bar is hidden). Room cards keep "Check dates".
- Tests: 88 unit (`menuPages` updated) and 58 Playwright (6 new in `nav.spec.ts`):
  - one "Check availability" on phone and on desktop;
  - no Home link;
  - room cards keep "Check dates";
  - sticky solid header on /rooms, /contact, /book and /privacy, and full width on desktop;
  - home header transparent over the pinned hero, then stuck and solid;
  - 360×640: at least 70% of the screen for content (about 507 of 640 px), no sideways scroll.

  The hero tests are unchanged and pass. `check:build` passes.
- Page weight: every guest page passes, with JS at 145.4 KB (unchanged); `/` is 167.1 KB.
- Deviations: none. The unused `Nav.home` wording stays (no rename or removal needed).

## Next session starts here
**Done (Batch 2, PR #6, ready for review):**
- Core data, RLS and the isolation test.
- Database tests and the staging deploy workflow.
- Login, admin with TOTP 2FA, owner "Your site".
- Business by host, and the demo lodge in the database.
- The controlled change-log deletion.
- The locked `get_published_site` fields.
- Reserved mail names.
- Builds that don't depend on the database.

**Manual steps pending, in order** (you do these; none touch the repository):
1. **GitHub** → Settings → Environments → `supabase-staging`: secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`, variable `SUPABASE_PROJECT_REF`. Optionally add yourself as a required reviewer, and allow deployments from `staging` only. Until then, db-deploy skips with a notice.
2. **Vercel** → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production and Preview).
   - `SUPABASE_SERVICE_ROLE_KEY` (Production only, Sensitive).
   - `DEMO_SITE_SLUG=kinigi-hills`.
   - Leave `PLATFORM_DOMAIN` and `APP_HOST` unset until DNS points here.

   Until then the site shows the bundled demo and login says "Not configured yet".
3. **Supabase staging** → Authentication:
   - Email on, sign-ups off.
   - TOTP on.
   - Site URL `https://getkaze.vercel.app`.
   - Redirect URLs `…/auth/confirm` (db-testing-and-migrations.md).
   - Paste the **Invite** and **Reset password** templates from `supabase/templates/`.
4. **Merge PR #6 into `staging`.** CI runs, then db-deploy applies the migrations (after your approval, if set).
5. **Actions → DB deploy (staging) → Run workflow** on `staging`, with `seed_demo` ticked (the fake demo lodge, idempotent).
6. **First platform admin:** invite or create your user in the Supabase dashboard (Authentication → Users), then run in the staging SQL editor:
   `insert into public.platform_admins (user_id) select id from auth.users where email = 'YOUR-EMAIL' on conflict do nothing;`
7. Sign in at `https://getkaze.vercel.app/login` and enrol TOTP at `/admin/mfa/enroll`.

No special order between steps 1–3 and 4: the build never reads the database.

**Open:**
- Altavision's existing subdomains, to add as reserved names (additive), when you send them.
- Kinyarwanda checks of the platform wording, marked draft in the glossary.
- The cache window (5 minutes) until Batch 3's editor revalidates on save.
- Where screenshots go (CI artifacts or the PR, never the repository).
- At G2: the demo fallback (remove, or keep to the demo slug), noindex per business, the custom email sender, and a check of icons on Cloudflare.

**Next batch:** Batch 3 (editor, revalidation on save, photos in Storage), after the review of PR #6.

## Batch 3a, content editor: started | 2026-11-13
- Built: branch `feature/batch-3a-editor` from `staging` (PR #7 merged), draft PR opened.
- Next: item 0 (header WhatsApp button), then specs for features 1–4, then one approval.

## Batch 3a, item 0: desktop WhatsApp button | 2026-11-13
- Built: a compact (34 px) WhatsApp icon button in the desktop header, right after "Check availability" (`.fj-nav-wa`, inside `.fj-nav-inline`, so phones never show it; they keep the bottom bar). No JavaScript.
- Tests: nav.spec.ts: phone asserts it is hidden; new desktop test on `/`, `/rooms`, `/contact`, `/book` (visible, named "WhatsApp", `wa.me` link, sits right of the button). Guest Playwright tests pass locally; database-backed tests need Docker, which this session lacks, so GitHub CI covers them.
- Page weight: `/` 167.2 KB (+0.1 KB), JS 145.4 KB (unchanged).
- Deviations: none.
