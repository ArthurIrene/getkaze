# Feature 2: Editor part 1 (info, contacts, map, hours, languages, photos)
Module: Content editor   Priority: P1   Preset: both
Decisions: D-024, D-029, D-048, D-050, O-Editor (hub, Business info, Photos, Languages). Overview points 1, 2, 4, 5, 6, 9.

Goal: From a 360 px phone, the owner fixes the basics and adds photos, and the site shows them at once.

## Screens (`/owner/b/<id>/edit…`, also `/rw/…`)
- **Hub** `/owner/b/<id>/edit`: rows Business info, Photos, Languages (and, after feature 3, Rooms, Sections, Look & colors, Changes) with a done/to-do mark and "x% complete" (core `editorProgress`). `/owner` cards get "Edit your site".
- **Business info:** name; contacts (phone, WhatsApp, email; Rwanda numbers normalised to +250 by core); address and directions (translatable); map: a Google Maps link field plus "Use my location" (browser geolocation fills latitude and longitude; no map library); opening hours: a list of lines, area + hours (translatable), add, remove, move up/down.
- **Languages:** EN (always on), RW, FR switches (business `languages`), with per-language progress ("12 of 15 texts").
- **Photos:** grid of the business's photos, "+ Add photo", each opens its detail: place (hero, room, dining, host, gallery; room photos pick a room after feature 3), alt text EN (required) with RW/FR, and Delete (confirm).
  - **Compression on the phone, no new dependency:** `createImageBitmap` → canvas, long edge 1600 px, WebP (JPEG where the browser can't encode WebP), quality stepped down until ≤ 120 KB target (hard limit 300 KB). EXIF (with GPS) is dropped by the redraw. Shows "We shrink photos so they load fast, even on slow networks."
  - The compressed file goes to a server action, which checks it with core `photoProblems`, uploads with the owner's session (RLS), and writes the `media` row.
- **Translatable fields:** EN, RW, FR side by side (stacked at 360 px), each with a marker: "Missing" when empty, "Draft · tap when checked" when filled and unchecked (D-048), nothing when checked.

## Guest site
The template shows the placed photo (overview point 4); otherwise the drawing as today.

## Rules in `packages/core` (unit tested)
Zod schemas `businessInfoInput`, `photoInput`; `normalizeRwPhone`; `mapUrlFromCoords`; `editorProgress`; `translationState(text, checked)`; `canEditSite(member, admin)`; `siteCacheTags(business, config)`.

## Database
- Policy + column guard on `businesses` (overview point 5).
- `site_settings.translations_checked jsonb default '{}'` (new column).
- Tests: owner of A updates A's name and languages but not `status`, `slug` or `preset`; cannot update B.

## Acceptance criteria
1. Given the owner changes the WhatsApp number and taps Save, then `/` shows the new number on the next load (tag revalidated) and the change log has a row.
2. Given a 4 MB phone photo, when added, then the stored file is ≤ 300 KB (target 120 KB), WebP or JPEG, without EXIF, and the hero shows it once placed there.
3. Given RW is filled for the address but not checked, then the field shows "Draft · tap when checked"; tapping it saves the checked state.
4. Given a 360×640 screen, then no editor screen scrolls sideways.

Playwright: business info save → guest page shows it; photo upload (a generated 4 MB image) → hero; languages switch. Owner-screen JS reported.
