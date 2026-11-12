# Feature: Site navigation (Field Journal)
Module: Templates   Priority: P1   Preset: both
Decisions: D-029, D-039/D-040, D-041 (no JavaScript, no scroll hijacking), D-042. MOCKUPS.md lists "open menu (burger) and language list" under "Still to design".
Conflicts: **no design for the open menu.** This spec proposes one (below). The language list stays as the EN/RW pills from PR #2 rather than the mockup's "EN ▾".

Goal: With several pages, a guest can always reach Rooms, Contact and the booking request in one or two taps, with no JavaScript.

Users: Guests.

## Screens
**Proposal: a `<details>` menu.** This is the lightest option. The browser opens and closes it natively, keyboard and screen readers handle it, and it needs no script.
```
closed (phone):
│ Kinigi Hills        EN RW  RWF USD ☰ │

open (tap ☰; tap ✕ or a link to close):
│ Kinigi Hills        EN RW  RWF USD ✕ │
├──────────────────────────────────────┤
│  Home                                │  serif 28 px, one per line,
│  Rooms                               │  dashed rules between,
│  Contact                             │  current page underlined
│  ─────────────────────────────────── │  (aria-current="page")
│  [   Check availability   ]          │  accent button → /book
│  murakaza neza                       │  handwritten
└──────────────────────────────────────┘  panel: paper, full width, under the header,
                                          drops in with fj-fade (opacity + translate)
```
- Markup: `<details class="fj-menu"><summary aria-label="Menu">` with a two-line burger drawn in CSS. The summary icon becomes ✕ via `details[open]`. Inside is a `<nav aria-label="Site">` list.
- The panel is absolutely positioned under the header (z-index above content), so it does not push the page down. It stays open on same-page links; following a link to a new page closes it, because the page reloads. There is no click-outside close (that would need JavaScript).
- Links only for pages that exist: Home always; Rooms when the business has rooms; Contact always; Menu later, when the menu page exists (D-046). Privacy is in the footer only.
- **Desktop (≥ 768 px):** no burger. The same links show inline in the header, with "Check availability" as a small accent pill.
- **Language pills on every page** link to the *same page* in the other language (`/rooms` ↔ `/rw/rooms`). They keep `hreflang` and `aria-current`.
- **Logo** links to Home (as in the mockup).
- **Footer:** name, "murakaza neza", © line, plus links Contact · Privacy.
- **Shared page shell:** a `FieldJournalPage` component renders header, main, footer and sticky bar, used by every page (home, rooms, contact, book, privacy). The template registry maps a template id to its pages: `{ home, rooms, contact, book, privacy }`.
- **Header on pages without a hero:** normal flow (only the home page with the hero first uses the pinned-hero header rules). The pinned-hero CSS stays untouched.

## Data
Read only: page list is derived from the data (rooms present or not) in `packages/core` (`sitePages(view)`, unit tested). No new fields.

## Permissions
Public.

## Module switch
Links hide when their page is off (no rooms → no Rooms link; menu module + menu page later).

## Languages
nav.* wording is in batch-1-guest-site.md.

## Acceptance criteria
1. Given a 360 px phone, when the guest taps ☰, then the menu opens with Home, Rooms, Contact and "Check availability"; when they tap Rooms, then `/rooms` opens.
2. Given `/rooms`, when the guest taps RW, then `/rw/rooms` opens (same page, other language).
3. Given a desktop screen, when any page loads, then the links show inline and there is no burger.
4. Given a page, when the menu is open, then the current page's link has `aria-current="page"`.
5. Given no client JavaScript (scripts disabled), when the guest uses the menu, then it still opens and links work.

Playwright: open menu → Rooms; language pill on /rooms → /rw/rooms; the same test with JavaScript disabled (`javaScriptEnabled: false`).

## Out of scope
A burger design for the other templates, a language list beyond EN/RW (French is later), search.

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
