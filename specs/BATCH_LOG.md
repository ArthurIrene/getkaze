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
