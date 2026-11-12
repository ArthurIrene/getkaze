# Feature: Rooms page (Field Journal)
Module: Templates   Priority: P1   Preset: Hotel/Lodge
Decisions: D-023, D-029, D-039/D-040, D-041, D-042, D-043, D-044 (Check dates → request form), D-048. Part 2 of specs/field-journal-template.md.
Conflicts: none. Two small mockup deviations, listed under Screens.

Goal: A guest compares every room (photos, price, what's in it) on a phone and goes straight to a request.

Users: Guests (no login). The owner edits rooms later in the editor (O-Editor "Rooms list and form").

## Screens
`mockups/canvas/T1-Rooms.dc.html` (phone), at `/rooms` and `/rw/rooms`.
- Header (shared, site-navigation.md).
- **Title block:** "Rooms" (h1), the owner's handwritten line (`roomsLine`, e.g. "four rooms, one view"; hidden if empty), dashed chips "PER NIGHT" and, when `stay.breakfastIncluded`, "BREAKFAST INCL.".
- **One block per room**, in the owner's order, `id="room-<roomId>"` so `/rooms#room-<id>` opens at that room:
  - **Swipe gallery:** a horizontal scroll-snap row of the room's photos, each 310 × 300 px with 22 px corners. The next photo peeks in, which shows the guest they can swipe. A "Nº n" tag sits top left. With no photo, one grey placeholder frame is shown. The mockup's position dots are left out, because they need JavaScript.
  - Name (h2) and price on one line (`<Price>`, so it follows the RWF/USD switch).
  - **Amenity icons** (24 px line icons, mono labels): from `room.amenities`, at most 5 in a row, wrapping.
  - **"More +"** is a `<details>` that shows the room's line (handwritten) and "Sleeps {n}". Its label changes to "Less −" when open (CSS only).
  - **"Check dates"** (accent button) links to `/book?room=<id>`, which opens the request form with that room picked.
- **"Check-in, children & payment"** is a `<details>` with check-in and check-out times, the stay notes and the payment lines.
- Footer (with Privacy, site-navigation.md). Sticky bar: "Check availability" plus a WhatsApp button, as in the mockup. The home page keeps Call.
- **Desktop (≥ 768 px):** room blocks sit in a 2-column grid, centred, max width 1072 px. The gallery row stays swipeable inside each block.
- **Home page changes:** each home room card becomes a link to `/rooms#room-<id>`, and an "All rooms →" link sits under the row.
- Motion: `fj-rise` on room blocks (longhand animation properties), and `fj-fade` on the opened `<details>` content. Off with reduced motion.

## Data (DATA.md, read only)
- **Rooms (catalog items):** existing name, line, price (RWF and USD), max guests and photos. **New:** `amenities: { icon: AmenityIcon, label: LocalizedText }[]`, where AmenityIcon is `bed | people | shower | wifi | view | fire | desk`.
- **Business, new:** `roomsLine?: LocalizedText`; `stay: { checkIn: "14:00", checkOut: "10:00", breakfastIncluded: boolean, notes: LocalizedText[] }`. The notes are, for example, "early check-in for trekkers on request" and "Children under 5 stay free".
- Demo lodge: 4 rooms with the mockup's amenities and 3 placeholder photos each.
- `SiteView` gains `rooms[].amenities` (labels picked by language), `roomsLine` and `stay`. Rules stay in `packages/core` (`toSiteView`, unit tested).

## Permissions
Public, read only. Templates only read data.

## Module switch
The rooms page belongs to the Hotel/Lodge website (Starter). With no rooms in the data, `/rooms` returns 404 and the nav and home links to it are hidden.

## Languages
Template wording is in batch-1-guest-site.md (rooms.*, amenity labels are owner text). Owner texts use English fallback.

## Acceptance criteria
1. Given a room card on the home page, when the guest taps it, then `/rooms` opens scrolled to that room's block.
2. Given USD as the default currency, when `/rooms` loads, then every price shows in USD; when the guest picks RWF, then every room price shows the owner's RWF price.
3. Given a room, when the guest taps "More +", then its line and "Sleeps {n}" show and the label reads "Less −".
4. Given a room, when the guest taps "Check dates", then `/book` opens with that room picked.
5. Given `/rw/rooms` and a room name with no Kinyarwanda, when it loads, then the English name shows.
6. Given a 360 px phone and a desktop screen, when the page loads, then nothing overflows sideways.
7. Given a business with no rooms, when `/rooms` is requested, then it returns 404 and no link points to it.

Playwright: home card → /rooms#room-…, currency switch, More +, Check dates → /book?room=….

## Out of scope
Availability per room, real photos and image sizes (editor), units per room type, the mockup's gallery dots.

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
