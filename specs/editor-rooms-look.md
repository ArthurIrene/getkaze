# Feature 3: Editor part 2 (rooms, translations, sections, look)
Module: Content editor   Priority: P1   Preset: Hotel/Lodge for rooms; both for the rest
Decisions: D-023 (RWF and USD, both typed), D-029/D-048 (EN required, RW/FR optional, draft until checked), D-042 (sections on/off and order), D-040/D-043 (one template; variety from colour sets), O-Editor (Rooms list and form, Sections, Look & colors). Overview points 7, 9.

## Screens
- **Rooms** (only when the preset is Hotel/Lodge): list in order (name, price, units, hidden mark), "+ Add room". Form: name, short line (translatable, with markers), price RWF and USD (both required, whole RWF, USD to cents), max guests, units, amenities (the template's icon list as checkboxes), visible switch, move up/down, Delete (confirm; its photos are kept, unplaced). Room photos are picked from Photos.
- **Sections:** the home sections (core `sectionIds`) with a switch each and up/down; a section that needs an off module shows "Needs Menu" and can't be switched on; Save.
- **Look & colors:** template (Field Journal; others "Coming later", not selectable); colour set Day, Night, Auto; accent from the safe palette: Forest `#3F5B3A`, Clay `#B5643C`, Ochre `#8A6A2E`, Slate `#2B3A4A`, Bark `#5B4636` (from the mockup; each checked for 4.5:1 contrast with its text colour in a unit test). A small preview swatch, no live page preview.
- **Missing-translation summary** on the hub and Languages screen: count of fields missing RW (and FR if on).

## Database (additive)
- `site_settings.look jsonb default '{}'` with a check: `color_set` in day/night/auto, `accent` in the palette ids.
- `catalog_items.translations_checked jsonb default '{}'`.
- `get_published_site` returns `look` (replaced with `create or replace`; the locked-fields test is updated to the new list).
- Tests: owner of A can insert, update, reorder and delete A's rooms, cannot touch B's; a bad accent or colour set is refused.

## Guest site
The template reads `look`: accent as a CSS variable on the page root, colour set as a `data-look` attribute (about 0.3 KB CSS, no JS).

## Rules in `packages/core` (unit tested)
`roomInput` (Zod; a room needs both prices), `moveItem`, `sectionsInput` (every id once, module rules from `visibleSections`), `lookInput`, `accentPalette`, `missingTranslations(site, items, languages)`.

## Acceptance criteria
1. Given a new room with RWF 120000 and USD 90, when saved, then `/rooms` shows it in both currencies.
2. Given a room with only RWF, when saved, then the form says USD is needed and nothing is saved.
3. Given "Reviews" switched off and "Rooms" moved first, when saved, then `/` follows that order.
4. Given accent Clay and Night, when saved, then `/` uses them (CSS variable and `data-look`).
5. Given a room name without RW, then the form and the hub show "Missing RW".

Playwright: add and edit a room → `/rooms`; sections order → `/`; look → `/`.
