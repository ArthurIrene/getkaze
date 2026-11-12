# Feature: Owner "Your site" page (minimal)
Module: Owner app   Priority: P1   Preset: both
Decisions: D-059 (owner login), D-024 (owners edit later through simple forms), D-034 and ROLES.md §5 (our support access is visible to the owner), D-050 (owner app patterns, plain platform style), D-029 (EN + RW). The full dashboard (O-Dashboard: today card, click stats, locked modules) is **Batch 3**.
Conflicts: none.

Goal: After signing in, an owner sees that their site exists, is live or not, where it is, and who from our side looked at it.

Users: owners (an active membership with `site.view`).

## Screen: `/owner` (`/rw/owner`), phone first, platform style
- **Header:** "Your site", the owner's business name, and a Sign out button (POST).
- **Site card:**
  - Business name and a status pill: draft "Not live yet", active "Live", paused "Paused".
  - The site address (from core `siteBaseUrl`: `https://<slug>.<root>` once a domain exists, else `https://getkaze.vercel.app/s/<slug>`), with "Open your site ↗".
  - Languages on (EN, RW).
- **Modules:** the list of modules switched on (names in the page language). The locked upgrade cards come in Batch 3.
- **Support visits:** the last 10 `support_access` rows for this business (when, reason, open or closed), with the empty state "No support visits yet." Required by ROLES.md §5.
- **"Need a change? WhatsApp us"** links to the platform support number (a config value; the demo uses a placeholder).
- **Several businesses** (one person can own more than one): one card per business.
- **No membership, or disabled:** "No active site for this account" plus the WhatsApp support link.
- No editing in this batch (the editor comes in Batch 3).

## Data
Reads `businesses`, `business_modules`, `modules` and `support_access` through RLS as the signed-in owner. It never uses the service role.

## Rules in `packages/core`
`siteBaseUrl` (shared) and `ownerSiteSummary(rows)` → cards (status wording key, address, modules). Unit tested.

## Permissions
An owner with an active membership (`site.view`). The support log needs `changes.view` (Owner has it).

## Module switch
Shows which modules are on; changes none.

## Languages (Kinyarwanda drafts)
| Key | English | Kinyarwanda draft |
|---|---|---|
| Owner.title | Your site | Urubuga rwawe |
| Owner.live | Live | Rurakora |
| Owner.notLive | Not live yet | Ntirurajya ahagaragara |
| Owner.paused | Paused | Rwahagaritswe |
| Owner.open | Open your site ↗ | Fungura urubuga rwawe ↗ |
| Owner.modules | Switched on | Ibikora |
| Owner.support | Support visits | Gusurwa n'abafasha |
| Owner.noSupport | No support visits yet. | Nta gusurwa n'abafasha kurabaho. |
| Owner.help | Need a change? WhatsApp us | Ukeneye impinduka? Twandikire kuri WhatsApp |

## Acceptance criteria
1. Given an owner of an active business, when they sign in, then `/owner` shows the business name, "Live", the site address and the modules on.
2. Given an admin opened and closed a support session for this business, when the owner opens `/owner`, then the visit shows with its reason and times.
3. Given an owner of business A, when they try `/owner` data for B (e.g. a crafted query), then nothing of B is visible (RLS; the isolation test covers the data).
4. Given a disabled membership, when the owner signs in, then "No active site for this account" shows.
5. Given a phone at 360 px and desktop, when the page loads, then nothing overflows sideways.

Playwright: owner sign-in → card content, support visit visible, disabled owner. Kinyarwanda page loads.

## Out of scope
Editing, click stats, locked module cards, the bookings list (Batch 3 and later).

## Definition of Done
BUILD_GUIDE.md §2.
