# Luxe L4 & L5 Plan

Base: `bb59692` (staging tip after L3c merges; L4 branch will be rebased on top).  
L1 migration: `supabase/migrations/20261121100000_luxe_l1.sql` — **no migration needed for L4/L5**; all data fields already added in L1. `media_place_check` allows exactly: `'hero', 'room', 'dining', 'dish', 'host', 'gallery', 'activity'`. `rowToSiteData` maps them. `get_published_site` returns groups, extra item fields, settings keys.

Each step = one commit. CI green after each. No `registry.ts` changes. Plain `<img srcset>` only. Zero Luxe JS on home/rooms/contact/book/privacy. Optional ≤2 KB vanilla script allowed on `/my-stay` only (spec §2, line 12; §78). No hardcoded English. No new stored data. `luxePageIds` extended only for pages actually built. No links to unbuilt pages. Home stays at 3 photos (hero, first room, first activity). No Luxe CSS/JS on Field Journal. New CSS appended to `public/luxe.css` in one clearly marked `/* L4/L5 additions */` block.

**Order**: `/my-stay` and `/my-stay/send` built **first** (L5-1, L5-2), then Experiences, Dining, Gallery — so no link points to an unbuilt page.

---

## Step 0: Extend Luxe demo data with L1 fields
**Files to change**
- `apps/web/src/data/demo-lodge.ts` — extend `demoLuxe`:
  - Activities: add `category` (wildlife/hiking/culture), `duration`, `whatToBring`, `arrangedBy`, `goodToKnow`, `signature`, `photos[]` (using existing demo photo handles with `place: "activity"`). Keep real handles: `gorillas`, `golden-monkeys`, `caves`, `twin-lakes`, `village`.
  - Dining: add `groups` (CatalogGroup with `handle`, `kind`, `position`, `name`); add `groupId` to dishes.
  - Rooms: add `body`, `size` (optional).
  - Site settings: add `featuredRoomHandles` (e.g., `["garden-double"]`), `intro`, `closing`.
- `scripts/gen-demo-seed.mjs` — ensure it loops over both businesses and writes `catalog_groups`, extra `catalog_items` fields, `media` rows with `place: "activity"`, `site_settings` extras.
- Run: `node scripts/gen-demo-seed.mjs --check` — must pass (Kinigi Hills block byte-identical, Luxe Musanze ids unique per business).
- Regenerate `supabase/seed.sql`.

**Tests**
- Unit: `demo-lodge.test.ts` — verifies all L1 fields present on `demoLuxe`, handles valid, categories allowed, groups have handles.
- DB: `seed.test.sql` — seed applies idempotently, Luxe demo has groups, activity extras, gallery photos with `place: "activity"`.

**Migration**
- None (seed only).

---

## L5 — /my-stay (2 commits, built first)

### Step L5-1: `/my-stay` GET form (no-JS)
**Files to add/change**
- `apps/web/src/templates/luxe/my-stay.tsx` — page component (uses `LuxePage`; title `t("myStayTitle")`; reads `query`: `item` (room handle or activity handle), `group` (`room`|`experience`|`dining`), optional `checkIn`, `checkOut`, `guests`; builds a single HTML form with: check-in/out (native date inputs, `min` = today Kigali, `max` = +12 months), guests (adults/children), name, note; hidden fields echo the picked items; submit → `POST /my-stay/send`; privacy line under submit: `t("myStayPrivacy")`)
- `apps/web/src/app/[locale]/site/[site]/my-stay/page.tsx` — Next.js page (calls `renderPage("myStay", ...)`; `force-dynamic` like `/book`)
- `apps/web/src/templates/luxe/pages.ts` — append `"myStay"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-my-stay`, `.tl-my-stay-item`, `.tl-my-stay-form`, `.tl-my-stay-privacy`

**Messages (en + rw draft — all rw marked draft for D-048)**
- `Luxe.myStayTitle` — "Your stay plan" / "Itegerezo ryawe ry'ijoro" (draft)
- `Luxe.myStayLine` — "review and send" / "reba kandi uhereze" (draft)
- `Luxe.myStayItemRoom` — "Room: {name}" / "Icyumba: {name}" (draft)
- `Luxe.myStayItemExperience` — "Experience: {name}" / "Ikorwa: {name}" (draft)
- `Luxe.myStayItemDining` — "Dining: {name}" / "Kurya: {name}" (draft)
- `Luxe.myStayCheckIn` — "Check-in" / "Kwinjira" (draft)
- `Luxe.myStayCheckOut` — "Check-out" / "Kugenda" (draft)
- `Luxe.myStayGuests` — "Guests" / "Abashyitsi" (draft)
- `Luxe.myStayAdults` — "Adults" / "Abakuru" (draft)
- `Luxe.myStayChildren` — "Children" / "Abana" (draft)
- `Luxe.myStayName` — "Your name" / "Izina ryawe" (draft)
- `Luxe.myStayNote` — "Note (optional)" / "Icyitonderwa (si ngombwa)" (draft)
- `Luxe.myStaySend` — "Send plan" / "Ohereza itegerezo" (draft)
- `Luxe.myStayPrivacy` — "This plan stays on your phone until you send it." / "Iyi teregezo iria mu telefoni yawe gushika uyihereze." (draft)
- `Luxe.myStaySendNote` — "Goes straight to {name} from your own WhatsApp. Nothing to pay now." / "Bijya kuri {name} biturutse kuri WhatsApp yawe. Nta kwishyura ubu." (draft)

**Tests**
- Unit: `my-stay.test.tsx` — form renders with prefilled items from query; date inputs have correct `min`/`max`; hidden fields carry `item` and `group`; privacy line present; no JS in component
- Playwright: `e2e/luxe-my-stay.spec.ts` — `/my-stay?item=garden-double&group=room` returns 200; form fields prefilled; `/rw/my-stay` renders Kinyarwanda; submitting with valid data reaches `/my-stay/send` (tested in L5-2); privacy line visible; uses real seed slugs (`garden-double`, `gorillas`, `the-mountain-table`)

**Weight**
- `pnpm weight-check -- --pages=/my-stay,/rw/my-stay` — must PASS (total ≤ 300 KB, JS ≤ 160 KB)

**Migration**
- None (no stored data)

---

### Step L5-2: `POST /my-stay/send` + optional ≤2 KB vanilla script
**Spec allowance**: "An **optional vanilla script of 2 KB or less** may persist the plan in `localStorage` under `stay:<businessId>`" (spec §2, line 12; §78). Script included.

**Files to add/change**
- `apps/web/src/app/[locale]/site/[site]/my-stay/send/route.ts` — route (copies `/book/send` behaviour exactly: parses form, builds WhatsApp message in `packages/core` via new `stayMessage()`, `stayTarget()`; caps: name 80, note 500, message 1,200 chars, body 8 KB; target **only** from `site.contacts.whatsapp` — no open redirect; **ESLint `no-console` error**; returns **303** to `wa.me`; logs nothing). **Differences from `/book/send`**:
  1. Message body includes stay plan items (rooms, experiences, dining) instead of single room booking.
  2. No email fallback (WhatsApp only per spec).
  3. No `?error=` redirect page — validation errors shown inline via re-render with error params (since no JS, the route re-renders `/my-stay` with `?error=` and the form shows error messages; same pattern as `/book` but `/book` has a separate `/book/error` page — `/my-stay` keeps it on one page).
  4. `stayMessage` in core builds a different message format (multiple items, dates, guests, name, note).
  5. No `via` radio (WhatsApp only).
- `packages/core/src/stay.ts` — new module: `parseStayRequest(formData)`, `stayMessage(parsed, site, locale)`, `stayTarget(parsed, site)`; unit tests
- `apps/web/src/templates/luxe/parts/stay-script.ts` — optional vanilla script (≤ 2 KB gzipped): reads/writes `localStorage` key `stay:<businessId>`; updates header count badge in `StickyBar`; only included on Luxe pages (loaded via `<script>` in `LuxePage` when `page === "myStay"`); does not run on Field Journal (not imported there)
- `apps/web/src/templates/luxe/parts/sticky-bar.tsx` — add count badge element (hidden when 0); script updates it
- `apps/web/src/templates/luxe/my-stay.tsx` — include the script via `<script src="/luxe-stay.js" defer></script>` (or inline if ≤ 2 KB) only on this page
- `apps/web/public/luxe-stay.js` — the compiled vanilla script (built by a tiny `esbuild` step in `package.json` or committed as static file; either way ≤ 2 KB gzipped)
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-bar-count` (badge style)

**Messages (en + rw draft — all rw marked draft for D-048)**
- `Luxe.myStayErrorTitle` — "Something to fix" / "Hari icyo gukosora" (draft)
- `Luxe.myStayErrorDates` — "Check-out must be after check-in, from today on, for at most 30 nights." / "Itariki yo kugenda igomba kuba nyuma y'iyo kwinjira, uhereye uyu munsi, amajoro atarenze 30." (draft)
- `Luxe.myStayErrorGuests` — "This room sleeps up to {n}." / "Iki cyumba cyakira abantu bagera kuri {n}." (draft)
- `Luxe.myStayErrorMissing` — "Please pick dates, guests, your name and how you'd like to pay." / "Hitamo amatariki, abashyitsi, izina ryawe n'uko wishyura." (draft)
- `Luxe.myStayErrorBack` — "Use your browser's back button to fix it; your answers are kept." / "Kanda 'subira inyuma' muri mushakisha yawe; ibyo wujuje biracyahari." (draft)

**No `Sent` / `Error` success page messages** — `/my-stay/send` returns 303 directly to `wa.me`; no intermediate page. Removed unused `myStaySent` / `myStayError` messages.

**Tests**
- Unit (core): `stay.test.ts` — `parseStayRequest` validates required fields, caps, date order; `stayMessage` builds correct lines for room/experience/dining; `stayTarget` returns only `wa.me` with business WhatsApp; no open redirect; body size cap; message length cap
- Unit (web): `my-stay-send.test.ts` — route returns 303; `Location` header is exact `wa.me` URL; `no-console` lint passes; invalid input re-renders `/my-stay` with `?error=` and error messages
- Playwright: `e2e/luxe-my-stay-send.spec.ts` — POST to `/my-stay/send` with valid form returns 303 to `wa.me`; oversized fields rejected; oversized body rejected; `/rw/my-stay/send` works; console not written (spy); validation errors show inline
- Script: manual smoke test — add item on `/rooms`, count badge increments; refresh `/my-stay`, items persist; send clears storage

**Weight**
- `pnpm weight-check -- --pages=/my-stay,/rw/my-stay` — must PASS (page itself ≤ 300 KB; JS ≤ 160 KB — the optional script is separate and only on `/my-stay`)

**Migration**
- None (no stored data)

---

## L4 — Experiences, Dining, Gallery (4 commits, built after L5)

### Step L4-1: `/experiences` list page
**Seed data**: demoLuxe activities now have `category`, `duration`, `whatToBring`, `arrangedBy`, `goodToKnow`, `signature`, `photos[]` (from Step 0). Real handles: `gorillas` (wildlife), `golden-monkeys` (wildlife), `caves` (culture), `twin-lakes` (hiking), `village` (culture). Category filter links work with real data.

**Files to add/change**
- `apps/web/src/templates/luxe/sections/experiences.tsx` — section component (filters as links `?category=wildlife|hiking|culture`; CSS-only `<details>` fallback; each card: photo `srcset` 480/960/1440 via `PhotoSpot` with `loading="lazy"` `fetchPriority="high"` on first card only, never eager; name, line, distance, category badge, "Plan this experience" → `/my-stay?activity=<handle>&group=experience`)
- `apps/web/src/templates/luxe/experiences.tsx` — page component (uses `LuxePage` shell; title from `t("experiencesTitle")`; renders `Experiences` section)
- `apps/web/src/templates/luxe/pages.ts` — append `"experiences"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-experiences`, `.tl-activity-card`, filter links, category badge, CSS-only `<details>` toggle

**Messages (en + rw draft — all rw marked draft for D-048)**
- `Luxe.experiencesTitle` — "Experiences" / "Ibikorwa" (draft)
- `Luxe.experiencesLine` — "what you can do around here" / "ibyo ushobora gukora hafi" (draft)
- `Luxe.experiencesFilterAll` — "All" / "Byose" (draft)
- `Luxe.experiencesFilterWildlife` — "Wildlife" / "Ibisokozo" (draft)
- `Luxe.experiencesFilterHiking` — "Hiking" / "Guhinga" (draft)
- `Luxe.experiencesFilterCulture` — "Culture" / "Umuco" (draft)
- `Luxe.experiencesPlan` — "Plan this experience" / "Tegura icyo korwa" (draft)
- `Luxe.experiencesCategoryWildlife` — "Wildlife" / "Ibisokozo" (draft)
- `Luxe.experiencesCategoryHiking` — "Hiking" / "Guhinga" (draft)
- `Luxe.experiencesCategoryCulture` — "Culture" / "Umuco" (draft)

**Tests**
- Unit: `experiences.test.tsx` — filters render correct links; category badge maps `category` to label; "Plan this experience" href includes `activity=<handle>&group=experience`; empty state when no visible activities
- Playwright: `e2e/luxe-experiences.spec.ts` — `/experiences` returns 200 on Luxe demo; filters work as links (no JS); `/rw/experiences` renders Kinyarwanda; category badge visible; clicking "Plan this experience" reaches `/my-stay` with correct query; uses real seed slugs (`gorillas`, `golden-monkeys`, `caves`, `twin-lakes`, `village`)

**Weight**
- `pnpm weight-check -- --pages=/experiences,/rw/experiences` — must PASS (≤ 300 KB total, JS ≤ 160 KB)

**Migration**
- None

---

### Step L4-2: `/experiences/[slug]` detail page
**Seed data**: uses real seed slugs (`gorillas`, `golden-monkeys`, `caves`, `twin-lakes`, `village`). Extra fields render if present.

**Files to add/change**
- `apps/web/src/templates/luxe/experience-detail.tsx` — page component (dynamic route `app/[locale]/site/[site]/experiences/[slug]/page.tsx`); reads `site.activities.find(a => a.id === slug)`; renders: hero photo (first of `photos[]` or `photo`, `srcset` 480/960/1440 via `PhotoSpot` with `loading="lazy"` `fetchPriority="high"`, never eager), name, line, distance, duration, category, both prices or "Enquire", body, `what_to_bring` list, `arranged_by` badge, `good_to_know`, "Plan this experience" → `/my-stay?activity=<handle>&group=experience`; 404 if not found or not visible
- `apps/web/src/app/[locale]/site/[site]/experiences/[slug]/page.tsx` — Next.js page (calls `renderPage("experience-detail", ...)`)
- `apps/web/src/templates/luxe/pages.ts` — append `"experience-detail"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-experience-detail`, `.tl-experience-hero`, `.tl-experience-meta`, `.tl-experience-body`, `.tl-experience-list`, `.tl-experience-badge`

**Messages (en + rw draft — all rw marked draft for D-048)**
- `Luxe.experienceDuration` — "Duration: {duration}" / "Igihe: {duration}" (draft)
- `Luxe.experiencePrice` — "Price: {price}" / "Igiciro: {price}" (draft)
- `Luxe.experienceEnquire` — "Enquire" / "Buza" (draft)
- `Luxe.experienceArrangedByOwn` — "With our guides" / "N'abahangamyi bacu" (draft)
- `Luxe.experienceArrangedByPartner` — "With a licensed partner" / "N'umushayashya wemewe" (draft)
- `Luxe.experienceWhatToBring` — "What to bring" / "Icyo ukwiye kugira" (draft)
- `Luxe.experienceGoodToKnow` — "Good to know" / "Byiza kubizi" (draft)
- `Luxe.experiencePlan` — "Plan this experience" / "Tegura icyo korwa" (draft)

**Tests**
- Unit: `experience-detail.test.tsx` — renders all fields; price shows both or "Enquire"; `arranged_by` badge maps correctly; `what_to_bring` and `good_to_know` lists render; 404 for unknown slug
- Playwright: `e2e/luxe-experience-detail.spec.ts` — `/experiences/gorillas` returns 200; all sections visible; `/rw/...` renders Kinyarwanda; "Plan this experience" reaches `/my-stay` with correct query; unknown slug returns clean 404; uses real seed slugs

**Weight**
- `pnpm weight-check -- --pages=/experiences/gorillas,/rw/experiences/gorillas` — must PASS

**Migration**
- None

---

### Step L4-3: `/dining` page (groups + items)
**Seed data**: demoLuxe has `dining.groups` (CatalogGroup with handles, e.g., `starters`, `mains`, `drinks`), `dishes` with `groupId`. Code renders groups by `position`, else flat list.

**Files to add/change**
- `apps/web/src/templates/luxe/sections/dining.tsx` — section component (if `site.groups.length > 0`, render each group as `<section>` with group name, then dishes/drinks in that group; else flat list; each item: photo `srcset` via `PhotoSpot` with `loading="lazy"`, name, description (`body`), price, signature badge; "Reserve a table" → `/my-stay?group=<groupHandle>&item=<dishId>`)
- `apps/web/src/templates/luxe/dining.tsx` — page component (uses `LuxePage`; title from `site.dining.name` or `t("diningTitle")`; renders `Dining` section)
- `apps/web/src/templates/luxe/pages.ts` — append `"dining"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-dining`, `.tl-dining-group`, `.tl-dish-card`, `.tl-dish-signature`, `.tl-dish-desc`

**Messages (en + rw draft — all rw marked draft for D-048)**
- `Luxe.diningTitle` — "Dining" / "Kurya" (draft)
- `Luxe.diningLine` — "at our table" / "ku meza yacu" (draft)
- `Luxe.diningReserve` — "Reserve a table" / "Fata ameza" (draft)
- `Luxe.diningReserveMessage` — "Hello {name}, I'd like to reserve a table." / "Muraho {name}, ndashaka gufata ameza." (draft)
- `Luxe.diningSignature` — "Signature" / "Iby'ingenzi" (draft)

**Tests**
- Unit: `dining.test.tsx` — groups render in `position` order; items filtered by `groupId`; flat fallback when no groups; signature badge shows; "Reserve a table" href includes `group=` and `item=`
- Playwright: `e2e/luxe-dining.spec.ts` — `/dining` returns 200; groups and items render; `/rw/dining` renders Kinyarwanda; "Reserve a table" reaches `/my-stay` with correct query; no groups → flat list works; uses real seed slugs

**Weight**
- `pnpm weight-check -- --pages=/dining,/rw/dining` — must PASS

**Migration**
- None

---

### Step L4-4: `/gallery` page (server-side pagination, max 6 photos per page)
**Weight cap**: gallery photos = `media.place === 'gallery'`. Demo seed has ~10 gallery photos. Each photo: 3 widths (480/960/1440 WebP), ~40/80/160 KB targets. **Server-side pagination**: at most 6 photos per page. Query param `?page=1` (default). Previous/Next links (no-JS). First view loads 6 photos × ~40 KB (480w at 360px 1×) = ~240 KB images + ~60 KB HTML/CSS/JS = ~300 KB total. JS 145.4 KB. Weight measured on page 1 only.

**Files to add/change**
- `apps/web/src/templates/luxe/sections/gallery.tsx` — section component (photos where `place === "gallery"`; paginated: `site.galleryPhotos.slice((page-1)*6, page*6)`; grid of `<a href=".../1440.webp"><img srcset=".../480.webp 480w, .../960.webp 960w, .../1440.webp 1440w" sizes="(min-width: 760px) 33vw, (min-width: 480px) 50vw, 100vw" loading="lazy" /></a>`; plain `<a href>` to 1440 file opens large; Previous/Next links at bottom (`?page=n`); no CSS lightbox needed)
- `apps/web/src/templates/luxe/gallery.tsx` — page component (uses `LuxePage`; reads `query.page`; title `t("galleryTitle")`; renders `Gallery` section; empty state when no gallery photos)
- `apps/web/src/templates/luxe/pages.ts` — append `"gallery"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-gallery`, `.tl-gallery-grid`, `.tl-gallery-link`, `.tl-gallery-empty`, `.tl-gallery-pagination`

**Messages (en + rw draft — all rw marked draft for D-048)**
- `Luxe.galleryTitle` — "Gallery" / "Amafoto" (draft)
- `Luxe.galleryLine` — "photos of the lodge and around" / "amafoto y'ishamba n'ahandi" (draft)
- `Luxe.galleryEmpty` — "No photos yet." / "Nta mafoto binyuze." (draft)
- `Luxe.galleryPrevious` — "Previous" / "Nyuma" (draft)
- `Luxe.galleryNext` — "Next" / "Kurikira" (draft)

**Tests**
- Unit: `gallery.test.tsx` — only `place === "gallery"` photos render; pagination slices correctly (6 per page); Previous/Next links have correct `page` param; plain `<a href>` to 1440 file
- Playwright: `e2e/luxe-gallery.spec.ts` — `/gallery` returns 200; 6 photos visible; Next link loads page 2; Previous returns to page 1; clicking photo opens 1440 file; `/rw/gallery` renders Kinyarwanda; empty state when no gallery photos; weight check passes with 6-photo first view

**Weight**
- `pnpm weight-check -- --pages=/gallery,/rw/gallery` — must PASS (first view ≤ 300 KB via 6-photo server-side pagination)

**Migration**
- None

---

**L4 Template-aware nav**
- Header (`parts/header.tsx`) and footer (`parts/footer.tsx`) already use `pages` array passed from each page. No new code needed — `availablePages()` in `render-page.tsx` already filters by `luxePageIds`. The sticky bar shows "Check availability" (book) because `pages.includes("book")`. Privacy in footer because `pages.includes("privacy")`. Experiences, Dining, Gallery automatically appear in header nav when their pages exist (desktop inline, mobile `<details>` menu).

---

## Weight Measurement (all steps)

Run after each commit with Supabase env vars set (local Supabase seeded with demoLuxe):
```
WEIGHT_PAGES=/my-stay,/rw/my-stay,/experiences,/rw/experiences,/experiences/gorillas,/rw/experiences/gorillas,/dining,/rw/dining,/gallery,/rw/gallery pnpm weight-check
```
Each page must PASS: total transferred ≤ 300 KB, JS transferred ≤ 160 KB. **Weight check output includes an Images column** (verified in `scripts/weight-check.mjs`). Field Journal pages must remain unchanged (CSS 10.2 KB / 2 files, JS 145.4 KB / 7 files).

---

## Migration Summary

**No new migrations needed for L4 or L5.** Confirmed from `supabase/migrations/20261121100000_luxe_l1.sql`: `media_place_check` allows exactly `'hero', 'room', 'dining', 'dish', 'host', 'gallery', 'activity'`. All data fields (experiences: `category`, `duration`, `what_to_bring`, `arranged_by`, `good_to_know`, `photos[]`, `signature`; dining: `catalog_groups`, `groupId` on items; gallery: `media.place = 'gallery'` and `'activity'`; stay plan: no table) already added in L1. `rowToSiteData` maps them. `get_published_site` returns groups, extra item fields, settings keys.

---

## Commit Order

0. Extend Luxe demo data with L1 fields (Step 0)
1. L5-1: `/my-stay` GET form
2. L5-2: `POST /my-stay/send` + optional script
3. L4-1: `/experiences` list
4. L4-2: `/experiences/[slug]` detail
5. L4-3: `/dining`
6. L4-4: `/gallery` (server-side pagination, max 6 photos)

After each commit: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm weight-check` (relevant pages), Playwright for new pages. CI must be green.

---

## Deviations from Spec (if any)

- Gallery uses server-side pagination (6 photos/page) with Previous/Next links (no-JS) to stay ≤ 300 KB — spec says "real `/gallery` page" but weight budget is hard
- Detail and hero images use `PhotoSpot` with `loading="lazy"` `fetchPriority="high"` on first card only, never eager — matches "shrunk, lazy-loaded" (D-041) and L3b fix (no double-fetch)
- Optional stay script included per spec §2/§78 ("optional vanilla script of 2 KB or less")
- `luxePageIds` extended incrementally as each page component is built — matches "extended only as each page component is built, so no link points to an unbuilt page"
- No Luxe CSS/JS on Field Journal verified by `e2e/luxe-isolation.spec.ts` and weight-check file lists
- All Kinyarwanda texts marked draft for D-048 native-speaker check