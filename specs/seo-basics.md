# Feature: SEO basics
Module: Website (Starter: "basic SEO", D-013, D-017)   Priority: P1   Preset: both
Decisions: D-013 (no ranking promises), D-017, **D-029** (a language gets its own indexed pages only when translated), D-043 (property style), **D-054** (noindex on every page until G2), D-035 (no Vercel-only features).
Conflicts: none. `noindex` stays (CLAUDE.md "Never do"). Everything below is ready for the day it is removed, per business, at G2.

Goal: Each client site is described correctly to search engines and link previews (WhatsApp, Facebook), so when it is opened at G2 it is found and shared well.

Users: Guests (search results, link previews). No owner screen in this batch (the editor gets an "SEO description" field later).

## What each page gets (built in `packages/core`, unit tested, rendered by Next `generateMetadata`)
- **Title:** home "{name} | {Lodge} in {locality}, {region}" (style word from `propertyStyle`: Lodge / Hotel / Guesthouse); others "{Page} | {name}" (Rooms, Contact, Check availability, Privacy notice).
- **Meta description (≤ 160 characters, cut at a word):** home: the owner's `seoDescription` if set, else "{hero title} {hero line}. {Style} in {area}. Rooms from {lowest price in default currency}."; rooms: "{n} rooms from {lowest}{, breakfast included}."; contact: "Call, WhatsApp or find {name} in {area}. {first hours line}."; book: "Send {name} a booking request by WhatsApp or email."; privacy: "How {name} handles your personal data.".
- **Canonical:** `{baseUrl}{path}`, absolute (`metadataBase` = `baseUrl`). For a language that is **not** in the business's `languages`, the canonical points to the English page (D-029).
- **Alternates (hreflang):** only for the business's translated languages that have a route (en, rw), plus `x-default` = English. None for a language that is not translated.
- **Open Graph:** `og:title`, `og:description`, `og:url` (canonical), `og:type=website`, `og:site_name={name}`, `og:locale` (`en_US`, `rw_RW`) and `og:locale:alternate` for the other translated language; `og:image` only when the hero photo has a `src` (none in the demo, so omitted). `twitter:card=summary`.
- **Structured data (home only):** one `<script type="application/ld+json">`. This is data, not executable JavaScript. `@type` from `propertyStyle` (lodge → `LodgingBusiness`, town hotel → `Hotel`, guesthouse → `BedAndBreakfast`). Fields: `name`, `url`, `telephone`, `email` (if set), `address` (`PostalAddress`: `addressLocality`, `addressRegion`, `addressCountry: "RW"`), `hasMap` (map link), `checkinTime`, `checkoutTime`, `priceRange` ("USD 35–75" in the default currency), `image` (only real photos), `containsPlace` (each room as `HotelRoom` with `name` and `occupancy.maxValue`). `<` is escaped in the JSON.
- **`/sitemap.xml`** (Next `MetadataRoute.Sitemap`): home, rooms (if any), contact, book (if rooms), privacy, for each translated language, each with `xhtml:link` alternates. It leaves out `/book/send` and `/book/error`.
- **`/robots.txt`**: `User-agent: *`, `Allow: /`, `Sitemap: {baseUrl}/sitemap.xml`. **No Disallow**, so crawlers can still fetch pages and see `noindex` (D-054).
- **noindex stays:** `<meta name="robots" content="noindex, nofollow">` and `X-Robots-Tag: noindex, nofollow` on every page, including the sitemap and robots responses. A Playwright check asserts both on every page.

## Data
- **New business fields:** `baseUrl` (demo: `https://getkaze.vercel.app`; later the client domain or subdomain, Batch 2), `propertyStyle` (`lodge | townHotel | guesthouse`, D-043; demo: `lodge`), `location.address: { locality, region, country }` (demo: Kinigi, Musanze, RW), optional `seoDescription: LocalizedText`.
- Reads `stay.checkIn/checkOut` (rooms-page.md) and room prices.

## Permissions
Public, read only.

## Module switch
Always on. At G2, `noindex` is removed per business with real content (separate change, not in this batch).

## Languages
Title and description wording (style words, page names, sentence frames) in messages (en, rw drafts, D-048). Owner texts use English fallback.

## Acceptance criteria
1. Given each page in each language, when it loads, then it has a unique `<title>`, a meta description of ≤ 160 characters, a canonical URL on `baseUrl`, and the Open Graph tags above.
2. Given a business with `languages: ["en"]`, when `/rw/rooms` loads, then its canonical is the English `/rooms` and no `hreflang="rw"` alternate appears anywhere (unit test on the core rule, plus one Playwright check with demo data).
3. Given the demo lodge (en, rw), when any page loads, then it has `hreflang` alternates for en, rw and x-default.
4. Given the home page, when it loads, then the JSON-LD parses, has `@type` `LodgingBusiness`, the name, telephone, address and 4 `HotelRoom` entries.
5. Given `/sitemap.xml` and `/robots.txt`, when fetched, then the sitemap lists every page in both languages with alternates, and robots has no Disallow and points to the sitemap.
6. Given any page, when it loads, then the robots meta and `X-Robots-Tag` still say `noindex`.

## Out of scope
Removing noindex (G2), Google Business Profile (sales step, D-017), og:image generation, per-room structured offers or prices (Hotel Center), the editor field for the SEO description.

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
