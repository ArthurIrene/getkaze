# Feature: Luxe template (second guest template)
Module: Templates   Priority: P1   Preset: Hotel/Lodge
Decisions: D-063 (`luxe` beside Field Journal), D-041 / D-066 (motion and JS budget), D-042 (sections; Luxe-only ids), D-023, D-029 / D-048, D-033 / D-049 (no guest storage), D-018 (no client-specific code), D-021 (additive data), D-055 (currency CSS), D-058 / D-066 (page weight), D-067 (no Zod unless approved), D-068 (three photo widths).
Status: **specs written (L0), waiting for one approval** (D-052). Source look: `luxe-stay-musanze/template-luxury/` (port behaviour and design, not that app's client tree or "Maison Musanze" code).

Goal: A second template, photo-led and quieter than Field Journal, that any hotel/lodge can switch on. Guests can plan a stay in the browser and send it on WhatsApp; nothing about the plan is stored.

Users: Guests (no login) see the site. Owners edit content in the existing editor. Platform admin sets `businesses.template`.

## Applied choices (do not reopen in the build)
1. Template id is **`luxe`**. D-039 and D-040 are amended (D-063). Not a client skin; not Imigongo; not Cinematic.
2. **Home pages add zero of our JavaScript.** The stay basket is a no-JS **GET `/my-stay`** form and **POST `/my-stay/send`** that only 303s to `wa.me` (same pattern as `/book/send`). An **optional vanilla script of 2 KB or less** may persist the plan in `localStorage` under `stay:<businessId>`. Menu, experience filters and the gallery use CSS or `<details>` (no React islands).
3. **System font stacks first.** A self-hosted heading subset is allowed only if `pnpm weight-check` still passes (≤ 300 KB first view). No Google fonts at runtime.
4. **Luxe-only section ids**, filtered by template in the Sections editor. Field Journal ids stay as they are.
5. **Photo cap 120** (was 60) in `packages/core` `photoLimits` and the matching database check (and storage file count: 120 × 3 widths).
6. **Nothing about guest plans is stored or logged.** No plan table. ESLint `no-console` on the send route. Basket key `stay:<businessId>`.
7. **No rating field.** Do not add one. Existing `reviews.quote` / `reviews.scores` stay for Field Journal; Luxe does not show them unless a later spec says so.
8. **A real `/gallery` page**, not only a home block.

## How the template is chosen
Host-based routing is unchanged (`parseHost` → slug or custom domain → `get_published_site`). The **template is a setting on the business** (`businesses.template`), not on the host. `renderPage()` loads `templates[site.template]`. Admin "New business" and owner Look & colors offer Field Journal and Luxe. Neighbour-template check (D-007) still waits until Imigongo and Cinematic exist.

**Folder:** `apps/web/src/templates/luxe/` beside `field-journal/`. Templates only read `SiteView` (CLAUDE.md rule 4). Registry uses **dynamic `import()` by template id** so a Field Journal site never downloads Luxe CSS or JS.

## CSS and bundle isolation
- Every Luxe rule is under **`.tl`** (same idea as `.fj`). No `:root`, `html` or `@theme` leaks.
- Do not `@source` Luxe from guest `globals.css`. `luxe.css` is imported only from Luxe page shells.
- Viewport, manifest and placeholder icons use `templateThemes[site.template]`.
- After L2, **no Luxe CSS or Luxe component code loads on Field Journal pages** — check the built CSS chunks (no `.tl-` / `luxe` class names) and the Field Journal guest JS chunks. Field Journal guest JS stays under 160 KB (D-066). Playwright: a Luxe demo and Kinigi differ in computed background/fonts; Luxe JS is absent on the Field Journal first view.

## Routes (under `/[locale]/site/[site]`, same proxy rewrite)
| Public path | PageId | When it exists |
|---|---|---|
| `/` | `home` | always |
| `/rooms` | `rooms` | the business has rooms |
| `/experiences` | `experiences` | Luxe, and at least one visible activity |
| `/experiences/[slug]` | (detail; slug = `handle`) | that activity exists and is visible |
| `/dining` | `dining` | Luxe, menu module on, at least one group or dish |
| `/gallery` | `gallery` | Luxe, at least one `place = gallery` photo |
| `/my-stay` | `myStay` | Luxe only; `force-dynamic` like `/book` |
| `/contact`, `/book`, `/privacy`, `/credits` | existing | as today |

Field Journal does not implement the new page ids, so those URLs 404 via `renderPage()`. `sitePages` / `menuPages` become template-aware. Luxe menu: Rooms, Experiences, Dining, Contact (plan in the bar / header, not a duplicate Home link). Keep `/book` for a single-room request; `/my-stay` is the combined plan.

## Data mapping
Luxe `Site` is a **view** of `SiteData`. `rowToSiteData` stays the only mapper. No parallel client schema.

| Luxe field | Platform today | Change |
|---|---|---|
| name, contacts, hero, rooms, currency, location, gallery photos | present | map; hours stay localized lines (label can live in the line) |
| room summary / description / size / several photos | `line`, `photos[]` (already multi) | add localized `body`, `size` on `room_type` |
| `featuredRoomIds` | none | `site_settings` JSON, handles |
| experiences | `activity`: name, line, distance, icon, arrange, one photo | add category, duration, both prices, body, `what_to_bring`, `arranged_by`, `good_to_know`; return **all** photos; `enabled` = `visible` |
| services | `kind = service` in DB, not in `SiteData` | map into `SiteData`; both prices **or neither** (enquire) |
| dining categories and items | flat dishes; `group_id` unused | `catalog_groups` + FK; item description; `signature` boolean |
| several photos per item | rooms yes; dish/activity first only | `media.place` add `activity` (keep existing places); public JSON returns every photo |
| flags | `visible`, `arrange` | `signature`; `arranged_by` (`own_guides` \| `licensed_partner`); optional `airport` on service |
| rating | `reviews.scores` | **skip** (choice 7) |
| intro / closing copy | none | localized JSON on `site_settings` |

### Additive migrations (L1; never remove or rename)
- `catalog_groups`: `business_id`, `kind` (`dish` \| `drink`), `handle`, `name` (localized), `position`, `visible`. RLS same as `catalog_items` (`content.edit` / member / admin aal2). Isolation loop covers it via `business_id`.
- `catalog_items`: `body`, `size`, `duration`, `category` (`wildlife` \| `hiking` \| `culture`, activities only), `what_to_bring jsonb`, `arranged_by`, `good_to_know`, `signature boolean not null default false`, optional `airport boolean`. `group_id` FK to `catalog_groups`.
- `media.place` check: add `activity`.
- `site_settings`: `featured_room_handles`, `intro`, `closing` (localized JSON, English required when published if that template shows them).
- `businesses.template` check: `'field-journal' \| 'luxe'`.
- `photoLimits.photos` and `app.media_limits` / storage insert count: **120**. `pnpm db:check` keeps core and SQL equal.
- `get_published_site` and `public_site_fields.test.sql`: groups, new item fields, extra places, new settings keys. No user ids, no plan data.
- Optional module `experiences` (off for existing businesses, D-021), or always show activities when present. Default: no new module; visibility is `catalog_items.visible` plus the Luxe experiences section.

**No stay / plan / basket table.** Guest plan lines never hit Postgres.

**CHECKPOINT after L1:** isolation test green, locked public fields updated, `rowToSiteData` maps the new fields (including services and groups). No Luxe UI until that go.

## Stay basket (D-033, D-041, D-066)
- No `StayProvider`, no React client on the layout. Field Journal stays with none of our client JS.
- **No-JS:** "Request this room" / "Plan this experience" / "Arrange" / "Reserve a table" are GET links to `/my-stay` with query (`item`, `group`, optional dates). `/my-stay` is an HTML form (check-in, check-out, guests, name, note, listed items). POST `/my-stay/send` builds the WhatsApp text in `packages/core` and answers **303** to `wa.me` only (targets from the business's stored number; no open redirect; caps like `/book/send`; request body size cap; **logs nothing**).
- **Optional ≤2 KB vanilla script (Luxe only):** read/write `localStorage` key `stay:<businessId>`; update a count in the header. Must not run on Field Journal. Off for reduced motion is not required (no motion); still no scroll hijacking.
- Filters: links `?category=hiking` or CSS/`<details>`. Gallery lightbox: `<a href>` to the large file and/or CSS `:target`, not a modal client component. Currency: existing no-JS radios (D-055).
- Privacy notice: one line that the plan stays on this phone until the guest sends it. No cookies on guest pages.

## Owner editor (existing pattern)
Hub row + `EditorFrame` + server action + the user's session (never the service role) + `updateTag` on `site:<slug>` and custom domain. Plain parse functions in core (D-067).

| Hub row | Like | Fields |
|---|---|---|
| Look | existing | Luxe radio beside Field Journal |
| Sections | existing | ids for **this** template only |
| Experiences | rooms list/form | name, body, category, duration, distance, both prices, what to bring, arranged by, good to know, photos, visible, order |
| Services | short rooms | name, both prices or neither, airport flag, visible, order |
| Dining | mockup menu groups | groups add/rename/reorder/hide; item name, description, prices, signature, photos |
| Gallery | photos place | already stored; Luxe `/gallery` reads `place = gallery` |
| Rooms | existing | body, size, featured, extra photos |
| Home copy | info | intro / closing (localized, draft/checked markers) |

## Languages
Template wording under `Luxe` in `apps/web/messages/en.json` and `rw.json`. English required; Kinyarwanda drafts need a native-speaker check (D-048). Owner content uses English fallback.

## Out of scope
Imigongo, Cinematic, client-specific Maison Musanze code, storing plans, a rating field, React stay basket, Google-hosted fonts, raising photo cap beyond 120, guest money, Vercel-only APIs, connecting tools to the live database with write access.

## Acceptance criteria
1. Given two published businesses, when A uses `luxe` and B uses `field-journal`, then A's host shows Luxe and B's host shows Field Journal, and B's first view does not include Luxe CSS or JS.
2. Given a Field Journal site, when a guest opens `/experiences` or `/my-stay`, then the response is a clean 404 with no business leak.
3. Given Luxe with visible activities, when a guest opens `/experiences` and `/experiences/{handle}` with JavaScript disabled, then the list, filters (as links) and detail render, and "Plan this experience" reaches `/my-stay`.
4. Given `/gallery` with photos, when JavaScript is disabled, then every photo is visible and each can be opened at large size without a client script.
5. Given `/my-stay` filled and posted, when the send route runs, then the status is 303 to `https://wa.me/<business number>?text=…`, nothing is inserted in the database, and the console is not written to.
6. Given 120 photos on a business, when the owner adds an 121st, then the database refuses it; 120 is allowed.
7. Given the isolation test, when it runs after L1, then Business A cannot read B's groups, items or media.

## Batches (small; one commit group per feature; CI green after each; `BATCH_LOG` updated)
| Batch | Work | Done when |
|---|---|---|
| **L0** | This spec (and D-063… in DECISIONS.md). | Approved once. |
| **L1** | Additive migrations, RLS, photo cap 120, `get_published_site` fields, `rowToSiteData`, isolation + locked-fields tests. | **CHECKPOINT.** Stop for go. |
| **L2** | `templates/luxe` shell, dynamic registry, Look radio, scoped CSS, template choice at setup (locked afterwards), a second seeded/demo business or slug. | No Luxe CSS or Luxe component code loads on Field Journal pages (check the built CSS and chunks); Field Journal guest JS stays under 160 KB (D-066). |
| **L3** | Restyle home, rooms, contact, book, privacy from shared `SiteView`. Zero extra JS on home. | Luxe home within 300 KB; JS FAIL over 160 KB; no our JS on home. |
| **L4** | Routes: experiences, `[slug]`, dining, gallery; template-aware nav; Playwright; weight-check list. | New pages work with JS off. |
| **L5** | `/my-stay` GET form, `POST /my-stay/send`, optional ≤2 KB script, privacy line. | Same send rules as `/book/send`. |
| **L6** | Editor: experiences, services, dining groups/items, Luxe sections/copy, rooms extras. | Owner save appears on the guest site after revalidate. |
| **L7** | Seed, credits if needed, speed/weight, `BATCH_LOG` wrap-up. | CI green. |

Do not start L3 until L1 isolation is green and L2 proves no Luxe CSS or component code loads on Field Journal pages (check the built CSS and chunks) and Field Journal guest JS stays under 160 KB (D-066).

## Definition of Done
Spec approved; isolation test passed after L1; each later batch has unit and Playwright coverage as listed; `pnpm weight-check` includes Luxe pages (fail > 300 KB, FAIL JS > 160 KB); no guest plan storage; no client-specific code; Kinyarwanda drafts listed for D-048.
