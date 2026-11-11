# Feature: Field Journal template (launch template)
Module: Templates   Priority: P1   Preset: Hotel/Lodge
Decisions: D-039 (three templates), D-040 (launch with Field Journal only), D-041 (light motion kit), D-042 (home sections), D-023 (RWF and USD entered by hand), D-029 / D-048 (languages), D-046 (basic menu + "Reserve a table").
Replaces: `specs/field-journal-home.md` for the home page. That file stays as it is; this spec wins where they differ (for example, desktop is now in scope).

Goal: A lodge looks designed and bookable on a cheap phone, even with few photos.

Users: Guests (no login) see the site. The owner changes the content later in the editor (`specs/content-editor.md`); the template never writes data.

## Parts
| Part | Pages | Status |
|---|---|---|
| **Part 1** | Business data type and rules in `packages/core`, demo lodge data, **home page** (phone 360 px first, then desktop), language switch | This branch |
| **Part 2** | **Rooms** page, **Contact** page, links from home to both | Later branch |

## Screens
- **Home (part 1):** `mockups/canvas/T1-Home.dc.html`; motion: `mockups/motion-previews/field-journal-motion-preview.html`.
  - Header: business name, language switch (EN, RW), RWF/USD switch.
  - Sections, in the owner's order, each switchable: hero (title, handwritten line, rotating "Chat with us" stamp), quick facts (tap for detail), life strip (scrapbook photos with captions), rooms (cards with price), at our table (dining room and three dishes, "Reserve a table"), around us (activity cards that flip to a line and "Ask us to arrange"), your host (photo, greeting, note on tap), reviews (quote and scores), find us (map drawing, Directions, Call, WhatsApp, hours and payment on tap).
  - Footer: name, "murakaza neza" line, copyright.
  - Sticky bar: "Check availability" and Call.
- **Rooms (part 2):** `mockups/canvas/T1-Rooms.dc.html`: swipe gallery per room, name, price, amenity icons, "More +", "Check dates", folded check-in / children / payment.
- **Contact (part 2):** no mockup yet. Must be designed before part 2 starts; until then the home "Find us" section covers contact.
- **Not designed yet (MOCKUPS.md, "Still to design"):** desktop views, the open menu (burger) and the language list. Part 1 uses a simple desktop layout from the phone design and shows EN / RW as two links instead of a menu.

## Data (DATA.md, read only)
- **Business:** name, legal name for the footer, template (`field-journal`), default currency (`defaultCurrency`: `rwf` or `usd`; the RWF/USD switch starts on it), languages on.
- **Contacts:** phone (Call), WhatsApp number, email (optional).
- **Location:** map link (Directions), area line, distance note on the map drawing.
- **Hours and payment:** short lines (for example "Reception every day, 6:00 to 22:00"; accepted payment methods).
- **Sections:** ordered list of section ids, each with visible on or off.
- **Hero:** title, handwritten line, photo.
- **Quick facts:** short value, icon, detail text.
- **Life strip:** photo and caption per moment.
- **Rooms (catalog items):** name, short line, price in RWF and in USD (both typed by the owner, D-023), photo(s), amenities (part 2), max guests (part 2).
- **At our table:** room name ("the fireside room"), photo, featured dishes (name, RWF and USD price, photo).
- **Around us (catalog items):** name, distance, one line, icon, "Ask us to arrange" flag.
- **Host:** name, photo, greeting, note.
- **Reviews:** quote, scores with source (entered by the owner).
- **Photos:** file, alt text, place shown (hero, room, dining room, host, gallery). Part 1 uses grey placeholders only.
- **Texts written by the owner** are stored per language: English required, Kinyarwanda and French optional.
- No guest data is read or stored. No new database fields yet (no Supabase in part 1).

## Rules (in `packages/core`, unit tested)
- **Language fallback:** a text shows in the chosen language; if that language is missing or empty, the English text shows.
- **Price by currency:** RWF shows the RWF price, USD shows the USD price. There is no exchange rate; both are the owner's numbers.
- **Price format:** "RWF 45,000" and "USD 4.50" (whole numbers without decimals).
- **Sections:** only visible sections render, in the owner's order; "At our table" also needs the menu module on.
- **Contact links:** Call is a `tel:` link and WhatsApp is a `wa.me` click-to-chat link with a prefilled message, both built from the owner's numbers.

## Permissions
Public, read only. Templates only read data (CLAUDE.md rule 4). The owner edits content through the editor (later feature). Platform admin sets the template.

## Module switch
- Templates module is always on for a hotel website.
- "At our table" shows only when the menu module is on (Starter includes a basic menu, D-046). "Menu →" links only once the menu page exists.
- Ordering buttons show only with the ordering add-on (not in this template yet).
- "Check availability": until the booking form ships (D-044, weeks 3–5) it opens WhatsApp with a prefilled message.

## Languages
- Template wording (section titles, buttons, labels) lives in `apps/web/messages/en.json` and `rw.json` under `FieldJournal`. English required; Kinyarwanda needs a native-speaker check (D-048).
- Owner content uses the language fallback rule above.
- English at `/`, Kinyarwanda at `/rw`. French later.

## Acceptance criteria
**Part 1 (home)**
1. Given a business with a section switched off, when the home page loads, then that section does not render, and the others follow the owner's order.
2. Given the Kinyarwanda page and an owner text with no Kinyarwanda version, when the page loads, then the English text shows (no blank, no raw key).
3. Given the RWF/USD switch, when the page loads it starts on the business's default currency; when the guest picks the other currency, then every price on the page shows the owner's price in that currency.
4. Given no photo for a spot, when the page loads, then a grey placeholder of the right size shows.
5. Given reduced motion, when the page loads, then no animation runs and all content is visible.
6. Given a 360 px wide phone and a desktop screen, when the page loads, then nothing overflows sideways and all content is readable.
7. Given slow 3G, when the page loads, then the first view stays within the guest-page budget (FEATURES.md §5, about 300 KB) with almost no JavaScript of our own.

**Part 2 (rooms, contact)**
1. Given a room card on the home page, when the guest taps it, then the rooms page opens at that room.
2. Given the rooms page and USD chosen, when it loads, then prices show in USD.
3. Given the contact page, when the guest taps Call, WhatsApp or Directions, then the phone, WhatsApp or map opens with the owner's details.

## Out of scope
- Booking form, booking inbox, My booking, ordering and checkout (separate specs).
- Menu page, privacy notice page, burger menu.
- Real photos, photo upload and compression (editor feature).
- Supabase, business lookup by domain or subdomain (day 7).
- Templates 2 and 3 (Imigongo, Cinematic): later, reading the same data.
- Webfonts: system fonts only until the cost is approved.
- End-to-end test: the Playwright happy path (BUILD_GUIDE.md §3) is deferred to part 2; it needs `@playwright/test` added.

## Search engines
The whole app is `noindex` for now (robots meta, `X-Robots-Tag` header and `robots.txt`), because only demo data is live. Remove it at gate G2 (first real client live, BUILD_GUIDE.md §8), per business, once that business's own content is in.

## Definition of Done (BUILD_GUIDE.md §2)
- [ ] Acceptance criteria in the spec all pass.
- [ ] Data has `business_id`; row-level security added; isolation test still passes. *(Part 1: no database yet; the type carries `businessId`.)*
- [ ] Module switch works (off = invisible or locked, on = works).
- [ ] Permissions follow ROLES.md.
- [ ] Works on a phone screen (360 px wide) and on desktop.
- [ ] English text complete; Kinyarwanda added for platform screens; fallback works.
- [ ] Guest pages within the speed budget on slow 3G.
- [ ] Database change only adds (no removes or renames); migration tested on staging. *(Part 1: no migration.)*
- [ ] Actions logged where the user changes data. *(Not applicable: read only.)*
- [ ] Tested on the demo client.
- [ ] Docs updated (FEATURES.md, ROADMAP.md, DECISIONS.md if needed).
- [ ] Kinyarwanda checked by a native speaker (D-048).
