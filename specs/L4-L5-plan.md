# Luxe L4 & L5 Plan

Base: `bb59692` (staging tip after L3c merges; L4 branch will be rebased on top).  
L1 migration: `supabase/migrations/20261121100000_luxe_l1.sql` — **no migration needed for L4/L5**; all data fields (experiences, dining groups/items, gallery photos, stay plan) already added in L1. `rowToSiteData` maps them. `get_published_site` returns groups, extra item fields, settings keys.

Each step = one commit. CI green after each. No `registry.ts` changes. Plain `<img srcset>` only. Zero Luxe JS on home/rooms/contact/book/privacy. Optional ≤2 KB vanilla script allowed on `/my-stay` only (spec §2, line 12; §78). No hardcoded English. No new stored data. `luxePageIds` extended only for pages actually built. No links to unbuilt pages. Home stays at 3 photos (hero, first room, first activity). No Luxe CSS/JS on Field Journal. New CSS appended to `public/luxe.css` in one clearly marked `/* L4/L5 additions */` block.

**Order changed per spec requirement**: `/my-stay` and `/my-stay/send` built **first** (L5-1, L5-2), then Experiences, Dining, Gallery — so no link points to an unbuilt page.

---

## L5 — /my-stay (2 commits, built first)

### Step L5-1: `/my-stay` GET form (no-JS)
**Files to add/change**
- `apps/web/src/templates/luxe/my-stay.tsx` — page component (uses `LuxePage`; title `t("myStayTitle")`; reads `query`: `item` (room handle or activity handle), `group` (`room`|`experience`|`dining`), optional `checkIn`, `checkOut`, `guests`; builds a single HTML form with: check-in/out (native date inputs, `min` = today Kigali, `max` = +12 months), guests (adults/children), name, note; hidden fields echo the picked items; submit → `POST /my-stay/send`; privacy line under submit: `t("myStayPrivacy")`)
- `apps/web/src/app/[locale]/site/[site]/my-stay/page.tsx` — Next.js page (calls `renderPage("myStay", ...)`; `force-dynamic` like `/book`)
- `apps/web/src/templates/luxe/pages.ts` — append `"myStay"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-my-stay`, `.tl-my-stay-item`, `.tl-my-stay-form`, `.tl-my-stay-privacy`

**Messages (en + rw draft)**
- `Luxe.myStayTitle` — "Your stay plan" / "Itegerezo ryawe ry'ijoro"
- `Luxe.myStayLine` — "review and send" / "reba kandi uhereze"
- `Luxe.myStayItemRoom` — "Room: {name}" / "Icyumba: {name}"
- `Luxe.myStayItemExperience` — "Experience: {name}" / "Ikorwa: {name}"
- `Luxe.myStayItemDining` — "Dining: {name}" / "Kurya: {name}"
- `Luxe.myStayCheckIn` — "Check-in" / "Kwinjira"
- `Luxe.myStayCheckOut` — "Check-out" / "Kugenda"
- `Luxe.myStayGuests` — "Guests" / "Abashyitsi"
- `Luxe.myStayAdults` — "Adults" / "Abakuru"
- `Luxe.myStayChildren` — "Children" / "Abana"
- `Luxe.myStayName` — "Your name" / "Izina ryawe"
- `Luxe.myStayNote` — "Note (optional)" / "Icyitonderwa (si ngombwa)"
- `Luxe.myStaySend` — "Send plan" / "Ohereza itegerezo"
- `Luxe.myStayPrivacy` — "This plan stays on your phone until you send it." / "Iyi teregezo iria mu telefoni yawe gushika uyihereze."
- `Luxe.myStaySendNote` — "Goes straight to {name} from your own WhatsApp. Nothing to pay now." / "Bijya kuri {name} biturutse kuri WhatsApp yawe. Nta kwishyura ubu."

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
- `apps/web/src/app/[locale]/site/[site]/my-stay/send/route.ts` — route (copies `/book/send` behaviour exactly: parses form, builds WhatsApp message in `packages/core` via new `stayMessage()`, `stayTarget()`; caps: name 80, note 500, message 1,200 chars, body 8 KB; target **only** from `site.contacts.whatsapp` — no open redirect; **ESLint `no-console` error**; returns **303** to `wa.me`; logs nothing). **Differences from `/book/send`**: message body includes stay plan items (rooms, experiences, dining) instead of single room; no email fallback (WhatsApp only per spec); no `?error=` redirect page (submission errors shown inline or via toast — but no JS, so inline via re-render with error params).
- `packages/core/src/stay.ts` — new module: `parseStayRequest(formData)`, `stayMessage(parsed, site, locale)`, `stayTarget(parsed, site)`; unit tests
- `apps/web/src/templates/luxe/parts/stay-script.ts` — optional vanilla script (≤ 2 KB gzipped): reads/writes `localStorage` key `stay:<businessId>`; updates header count badge in `StickyBar`; only included on Luxe pages (loaded via `<script>` in `LuxePage` when `page === "myStay"`); does not run on Field Journal (not imported there)
- `apps/web/src/templates/luxe/parts/sticky-bar.tsx` — add count badge element (hidden when 0); script updates it
- `apps/web/src/templates/luxe/my-stay.tsx` — include the script via `<script src="/luxe-stay.js" defer></script>` (or inline if ≤ 2 KB) only on this page
- `apps/web/public/luxe-stay.js` — the compiled vanilla script (built by a tiny `esbuild` step in `package.json` or committed as static file; either way ≤ 2 KB gzipped)
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-bar-count` (badge style)

**Messages (en + rw draft)**
- `Luxe.myStaySent` — "Your plan was sent." / "Itegerezo ryawe ryahezwe."
- `Luxe.myStayError` — "Something went wrong. Please try again." / "Hari icyo bitaye. Ongera ugerageze."

**Tests**
- Unit (core): `stay.test.ts` — `parseStayRequest` validates required fields, caps, date order; `stayMessage` builds correct lines for room/experience/dining; `stayTarget` returns only `wa.me` with business WhatsApp; no open redirect; body size cap; message length cap
- Unit (web): `my-stay-send.test.ts` — route returns 303; `Location` header is exact `wa.me` URL; `no-console` lint passes
- Playwright: `e2e/luxe-my-stay-send.spec.ts` — POST to `/my-stay/send` with valid form returns 303 to `wa.me`; oversized fields rejected; oversized body rejected; `/rw/my-stay/send` works; console not written (spy)
- Script: manual smoke test — add item on `/rooms`, count badge increments; refresh `/my-stay`, items persist; send clears storage

**Weight**
- `pnpm weight-check -- --pages=/my-stay,/rw/my-stay` — must PASS (page itself ≤ 300 KB; JS ≤ 160 KB — the optional script is separate and only on `/my-stay`)

**Migration**
- None (no stored data)

---

## L4 — Experiences, Dining, Gallery (4 commits, built after L5)

### Step L4-1: `/experiences` list page
**Seed data check**: demoLuxe activities have `id`: `gorillas`, `golden-monkeys`, `caves`, `twin-lakes`, `village`. L1 migration adds `category` (wildlife|hiking|culture), `duration`, `what_to_bring`, `arranged_by`, `good_to_know`, `photos[]`, `signature`. Current seed has none of these. **Category filter removed** until seed data populates categories. Filters as links `?category=wildlife|hiking|culture` kept in code but hidden via CSS when no activities have a category (progressive enhancement). Tests use real seed slugs: `gorillas`, `golden-monkeys`.

**Files to add/change**
- `apps/web/src/templates/luxe/sections/experiences.tsx` — section component (filters as links `?category=wildlife|hiking|culture`; CSS-only `<details>` fallback; each card: photo `srcset` 480/960/1440 via `PhotoSpot` with `loading="lazy"` `fetchPriority="high"` on first card only, never eager; name, line, distance, category badge if present, "Plan this experience" → `/my-stay?activity=<handle>&group=experience`)
- `apps/web/src/templates/luxe/experiences.tsx` — page component (uses `LuxePage` shell; title from `t("experiencesTitle")`; renders `Experiences` section)
- `apps/web/src/templates/luxe/pages.ts` — append `"experiences"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-experiences`, `.tl-activity-card`, filter links, category badge, CSS-only `<details>` toggle

**Messages (en + rw draft)**
- `Luxe.experiencesTitle` — "Experiences" / "Ibikorwa"
- `Luxe.experiencesLine` — "what you can do around here" / "ibyo ushobora gukora hafi"
- `Luxe.experiencesFilterAll` — "All" / "Byose"
- `Luxe.experiencesFilterWildlife` — "Wildlife" / "Ibisokozo"
- `Luxe.experiencesFilterHiking` — "Hiking" / "Guhinga"
- `Luxe.experiencesFilterCulture` — "Culture" / "Umuco"
- `Luxe.experiencesPlan` — "Plan this experience" / "Tegura icyo korwa"
- `Luxe.experiencesCategoryWildlife` — "Wildlife" / "Ibisokozo"
- `Luxe.experiencesCategoryHiking` — "Hiking" / "Guhinga"
- `Luxe.experiencesCategoryCulture` — "Culture" / "Umuco"

**Tests**
- Unit: `experiences.test.tsx` — filters render correct links; category badge maps `category` to label; "Plan this experience" href includes `activity=<handle>&group=experience`; empty state when no visible activities
- Playwright: `e2e/luxe-experiences.spec.ts` — `/experiences` returns 200 on Luxe demo; filters work as links (no JS); `/rw/experiences` renders Kinyarwanda; category badge visible when data has category; clicking "Plan this experience" reaches `/my-stay` with correct query; uses real seed slugs (`gorillas`, `golden-monkeys`)

**Weight**
- `pnpm weight-check -- --pages=/experiences,/rw/experiences` — must PASS (≤ 300 KB total, JS ≤ 160 KB)

**Migration**
- None

---

### Step L4-2: `/experiences/[slug]` detail page
**Seed data check**: uses real seed slugs (`gorillas`, `golden-monkeys`, `caves`, `twin-lakes`, `village`). Extra fields (`duration`, `category`, `what_to_bring`, `arranged_by`, `good_to_know`, `photos[]`) render if present in data; gracefully omitted if null.

**Files to add/change**
- `apps/web/src/templates/luxe/experience-detail.tsx` — page component (dynamic route `app/[locale]/site/[site]/experiences/[slug]/page.tsx`); reads `site.activities.find(a => a.id === slug)`; renders: hero photo (first of `photos[]` or `photo`, `srcset` 480/960/1440 via `PhotoSpot` with `loading="lazy"` `fetchPriority="high"`, never eager), name, line, distance, duration, category, both prices or "Enquire", body, `what_to_bring` list, `arranged_by` badge, `good_to_know`, "Plan this experience" → `/my-stay?activity=<handle>&group=experience`; 404 if not found or not visible
- `apps/web/src/app/[locale]/site/[site]/experiences/[slug]/page.tsx` — Next.js page (calls `renderPage("experience-detail", ...)`)
- `apps/web/src/templates/luxe/pages.ts` — append `"experience-detail"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-experience-detail`, `.tl-experience-hero`, `.tl-experience-meta`, `.tl-experience-body`, `.tl-experience-list`, `.tl-experience-badge`

**Messages (en + rw draft)**
- `Luxe.experienceDuration` — "Duration: {duration}" / "Igihe: {duration}"
- `Luxe.experiencePrice` — "Price: {price}" / "Igiciro: {price}"
- `Luxe.experienceEnquire` — "Enquire" / "Buza"
- `Luxe.experienceArrangedByOwn` — "With our guides" / "N'abahangamyi bacu"
- `Luxe.experienceArrangedByPartner` — "With a licensed partner" / "N'umushayashya wemewe"
- `Luxe.experienceWhatToBring` — "What to bring" / "Icyo ukwiye kugira"
- `Luxe.experienceGoodToKnow` — "Good to know" / "Byiza kubizi"
- `Luxe.experiencePlan` — "Plan this experience" / "Tegura icyo korwa"

**Tests**
- Unit: `experience-detail.test.tsx` — renders all fields; price shows both or "Enquire"; `arranged_by` badge maps correctly; `what_to_bring` and `good_to_know` lists render; 404 for unknown slug
- Playwright: `e2e/luxe-experience-detail.spec.ts` — `/experiences/gorillas` returns 200; all sections visible; `/rw/...` renders Kinyarwanda; "Plan this experience" reaches `/my-stay` with correct query; unknown slug returns clean 404; uses real seed slugs

**Weight**
- `pnpm weight-check -- --pages=/experiences/gorillas,/rw/experiences/gorillas` — must PASS

**Migration**
- None

---

### Step L4-3: `/dining` page (groups + items)
**Seed data check**: demoLuxe has `dining.dishes` (3 items), no `groups` yet. L1 migration adds `catalog_groups` with `handle`, `kind` (dish|drink), `position`. Code renders groups if `site.groups.length > 0` (by `position`), else flat list. Items filtered by `groupId`. Tests use real seed slugs (`brochettes`, `isombe`, `coffee`).

**Files to add/change**
- `apps/web/src/templates/luxe/sections/dining.tsx` — section component (if `site.groups.length > 0`, render each group as `<section>` with group name, then dishes/drinks in that group; else flat list; each item: photo `srcset` via `PhotoSpot` with `loading="lazy"`, name, description (`body`), price, signature badge; "Reserve a table" → `/my-stay?group=<groupHandle>&item=<dishId>`)
- `apps/web/src/templates/luxe/dining.tsx` — page component (uses `LuxePage`; title from `site.dining.name` or `t("diningTitle")`; renders `Dining` section)
- `apps/web/src/templates/luxe/pages.ts` — append `"dining"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-dining`, `.tl-dining-group`, `.tl-dish-card`, `.tl-dish-signature`, `.tl-dish-desc`

**Messages (en + rw draft)**
- `Luxe.diningTitle` — "Dining" / "Kurya"
- `Luxe.diningLine` — "at our table" / "ku meza yacu"
- `Luxe.diningReserve` — "Reserve a table" / "Fata ameza"
- `Luxe.diningReserveMessage` — "Hello {name}, I'd like to reserve a table." / "Muraho {name}, ndashaka gufata ameza."
- `Luxe.diningSignature` — "Signature" / "Iby'ingenzi"

**Tests**
- Unit: `dining.test.tsx` — groups render in `position` order; items filtered by `groupId`; flat fallback when no groups; signature badge shows; "Reserve a table" href includes `group=` and `item=`
- Playwright: `e2e/luxe-dining.spec.ts` — `/dining` returns 200; groups and items render; `/rw/dining` renders Kinyarwanda; "Reserve a table" reaches `/my-stay` with correct query; no groups → flat list works; uses real seed slugs

**Weight**
- `pnpm weight-check -- --pages=/dining,/rw/dining` — must PASS

**Migration**
- None

---

### Step L4-4: `/gallery` page
**Weight cap**: gallery photos = `media.place === 'gallery'`. Demo seed has ~10 gallery photos (from demo-photos: life moments + host + dining photo + activity photos with `place: gallery`). Each photo: 3 widths (480/960/1440 WebP), ~40/80/160 KB targets. At 360×800 1×: only first 4 photos in viewport (lazy), ~40 KB each = ~160 KB images. CSS + HTML + JS ~150 KB. Total ~310 KB — **over budget**. Cap: render **max 8 gallery photos** on first view (CSS `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` + `content-visibility: auto` on items beyond 8th). Remaining photos accessible via "Load more" link (no-JS, goes to same page with `?offset=8`) or paginated. This keeps first-view ≤ 300 KB.

**Files to add/change**
- `apps/web/src/templates/luxe/sections/gallery.tsx` — section component (all photos where `place === "gallery"`; grid of `<a href=".../1440.webp"><img srcset=".../480.webp 480w, .../960.webp 960w, .../1440.webp 1440w" sizes="(min-width: 760px) 33vw, (min-width: 480px) 50vw, 100vw" loading="lazy" /></a>`; CSS-only lightbox via `:target` on a full-screen overlay wrapper, or plain `<a href>` to the 1440 file; max 8 photos rendered initially, `content-visibility: auto` on rest; "Load more" link if more exist)
- `apps/web/src/templates/luxe/gallery.tsx` — page component (uses `LuxePage`; title `t("galleryTitle")`; renders `Gallery` section; empty state when no gallery photos)
- `apps/web/src/templates/luxe/pages.ts` — append `"gallery"` to `luxePageIds`
- `apps/web/public/luxe.css` — append to `/* L4/L5 additions */`: `.tl-gallery`, `.tl-gallery-grid`, `.tl-gallery-link`, `.tl-gallery-lightbox` (CSS `:target` overlay), `.tl-gallery-empty`, `.tl-gallery-load-more`

**Messages (en + rw draft)**
- `Luxe.galleryTitle` — "Gallery" / "Amafoto"
- `Luxe.galleryLine` — "photos of the lodge and around" / "amafoto y'ishamba n'ahandi"
- `Luxe.galleryEmpty` — "No photos yet." / "Nta mafoto binyuze."
- `Luxe.galleryLoadMore` — "Load more" / "Ongeraho"

**Tests**
- Unit: `gallery.test.tsx` — only `place === "gallery"` photos render; grid uses correct `srcset` widths; lightbox overlay works via `:target` (no JS); max 8 photos initially
- Playwright: `e2e/luxe-gallery.spec.ts` — `/gallery` returns 200; all gallery photos visible (load more works); clicking opens 1440 file (new tab or overlay); `/rw/gallery` renders Kinyarwanda; empty state when no gallery photos; weight check passes with capped first view

**Weight**
- `pnpm weight-check -- --pages=/gallery,/rw/gallery` — must PASS (first view ≤ 300 KB via 8-photo cap)

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

**No new migrations needed for L4 or L5.** Confirmed from `supabase/migrations/20261121100000_luxe_l1.sql`: all data fields (experiences: `category`, `duration`, `what_to_bring`, `arranged_by`, `good_to_know`, `photos[]`, `signature`; dining: `catalog_groups`, `groupId` on items; gallery: `media.place = 'activity'`; stay plan: no table) already added in L1. `rowToSiteData` maps them. `get_published_site` returns groups, extra item fields, settings keys.

---

## Commit Order

1. L5-1: `/my-stay` GET form
2. L5-2: `POST /my-stay/send` + optional script
3. L4-1: `/experiences` list
4. L4-2: `/experiences/[slug]` detail
5. L4-3: `/dining`
6. L4-4: `/gallery`

After each commit: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm weight-check` (relevant pages), Playwright for new pages. CI must be green.

---

## Deviations from Spec (if any)

- Gallery first-view capped at 8 photos with `content-visibility: auto` + "Load more" link (no-JS) to stay ≤ 300 KB — spec says "real `/gallery` page" but weight budget is hard
- Category filter on experiences kept in code but hidden via CSS until seed data populates categories — progressive enhancement, no broken UI
- Detail and hero images use `PhotoSpot` with `loading="lazy"` `fetchPriority="high"` on first card only, never eager — matches "shrunk, lazy-loaded" (D-041) and L3b fix (no double-fetch)
- Optional stay script included per spec §2/§78 ("optional vanilla script of 2 KB or less")
- `luxePageIds` extended incrementally as each page component is built — matches "extended only as each page component is built, so no link points to an unbuilt page"
- No Luxe CSS/JS on Field Journal verified by `e2e/luxe-isolation.spec.ts` and weight-check file lists