# PROJECT.md: Musanze Business Platform

Status: v1.1 (7 Nov 2026). Chat 1 (Master Plan) complete; hosting and compliance updated. Source of truth for vision, rules, and stack. Changes go through DECISIONS.md.

## 1. Vision
One shared platform that serves local businesses in Musanze, Rwanda (hotels, lodges, restaurants, bars; others later). We sell visibility first, then daily operations tools. Businesses win through more direct bookings, fewer waiting customers, and better control of stock and staff. We win through setup fees and recurring fees.

Pitch lines:
- Hotels and lodges: "Be found on Google Maps and get booked directly."
- Restaurants and bars: "We make logistics easy. No client waits."

## 2. Who we serve (presets, see BUSINESS_TYPES.md)
- **Hotel/Lodge:** main pain is visibility. Tourists search Google Maps first; most lodges book by phone and platform listings (TripAdvisor, Booking.com) and rely on regulars.
- **Restaurant & Bar:** one preset (bars here also run kitchens). Main pain is operations: orders, waiting, staff, stock, cash.
- **Later (only when a paying client asks):** tour and trekking operators, guesthouses, shops, salons, car rentals.
- **Target:** international guests first, so English content is required.

## 3. Product shape and pricing
One core, many modules, switched on or off per business.

- **Starter (fixed per preset):** website, room list or menu/drinks list, Call and WhatsApp buttons, Google Maps / Business Profile setup, basic SEO checklist, basic phone photos, live on the visit.
- **Add-ons (chosen per business):** every module beyond Starter. Locked modules are visible in the owner dashboard to show what is possible.
- **Growth and Premium:** suggested bundles for sales pitches only, not fixed tiers.

**Price = sum of chosen modules (setup + monthly).** List prices (D-025):

| Module | Setup (RWF) | Monthly (RWF) |
|---|---|---|
| Starter | 500,000 | 20,000 |
| Booking requests (hotels) | 100,000 | 10,000 |
| Menu + WhatsApp orders | 100,000 | 10,000 |
| Manager orders page | 100,000 | 15,000 |
| Staff management | 150,000 | 15,000 |
| Stock | 150,000 | 20,000 |
| Reports and sales | 100,000 | 10,000 |
| Professional photo shoot (service) | 100,000 to 250,000 | — |

- Discounts agreed per client, floor about 70% of list, discount setup before monthly, every discount recorded. 3 to 5 founding clients may get discounts or a free shoot for testimonials and photos.
- Setup paid 50% at signing, 50% at go-live. Monthly fee starts at go-live (D-030).
- Billing monthly, or yearly with 2 months free. Clients pay us by our MoMo/Airtel merchant code; invoices by WhatsApp. Domain billed yearly at cost, in the client's name.
- **Owned:** quoted per client (guideline 1.5M to 3M RWF), 3 months support included, then optional paid maintenance plan (D-026).
- Price review after the first 5 clients.

## 4. Core rules (default architecture)
1. One shared backend and database. Every record carries a `business_id`. Data isolation is enforced by the database (row-level security), not only by code.
2. Features are modules that can be switched on or off per business.
3. A business type is a preset: default modules, wording, roles, and default template.
4. Templates only read data. No client-specific code, ever. Paid custom requests become general modules (on for that client first, offered to others later), or go to Owned or a paid custom front end (D-018).
5. Customization order: settings first, then templates, then paid custom work.
6. Clients own their domain and their data (export on request). We never hold domain or data hostage.
7. Two service models: **Managed** (we host, recurring fee) and **Owned** (one-time price, handover, 3-month support window).
8. Roles are permission settings, not fixed code. One person can hold several roles.
9. Mobile-first, light, and fast. Web (PWA) first for everyone. Native staff app (Expo) later, when time allows (D-037). Guests always use the web, never an app.
10. WhatsApp and MTN MoMo / Airtel Money are first-class.
11. Content: English required; Kinyarwanda and French optional, with English fallback. Platform screens: English and Kinyarwanda, French optional (D-029).
12. Build in small slices. Design everything, build only the sellable core. Paying clients set the order of later features.
13. No client versions: every Managed client runs the latest code. We sell plans. New features arrive switched off; data changes only add (D-021).
14. Guests always pay the business directly. We never hold guest money (D-027).
15. Comply with Rwanda's data protection law (Law No. 058/2021): registration filed before going live; guest data only after storage authorization or on a Rwanda host (D-033, COMPLIANCE.md).
16. All business rules live in the database and `packages/core`, never inside screens, so any future app can connect (D-036).

## 5. Modules (full map in FEATURES.md)
- **Shared:** business settings, templates, content editor, platform admin, module switches, click stats, customers, staff and roles, stock, sales and reports, payments.
- **Hotel/Lodge:** room list, booking requests, booking calendar, guest requests (QR in room), housekeeping, check-in.
- **Restaurant & Bar:** menu, WhatsApp orders, QR table requests, manager orders page, staff order flow (kitchen and bar routing), tabs.

## 6. Roles (full detail in ROLES.md)
Owner, manager, receptionist, housekeeping, waiter, kitchen, bar, plus our platform admin. Individual staff logins (phone number + PIN). Every action logged. Owner can disable staff instantly.

## 7. Customization model
- **Settings:** name, logo, colors from safe palettes, fonts from a short list, photos, texts, languages, currency display, contacts, prices, items, hours, sections on or off.
- **Templates:** start with 3 (warm lodge, modern/minimal, bold safari). Neighbouring competitors get different templates or color sets.
- **Custom work (paid):** custom front end on the same backend, new general module, or Owned system.
- **Content editor:** owners edit through simple phone-friendly forms (no page builder). Same editor used for live setup during sales visits. Photos compressed; safe limits; every change logged (D-024).

## 8. Data and hosting
- Shared database and backend, one monorepo, one folder per template.
- Each client has its own domain in their name, pointed to our system; the system identifies the business by domain. Free subdomain fallback for demos and before a domain is bought.
- Prices in RWF and USD, both entered manually. Online payments, when added, charge RWF.
- **Managed:** full data access in the app with an export button. No direct database access.
- **Owned:** separate database and deployment in their own account, built by copying their rows. No automatic platform updates.
- **Data location:** personal data stored in Rwanda, or with NCSA authorization naming Supabase and Cloudflare. Phase 1 stores only owner logins. Stack kept portable so the database and app can move to a Rwanda host behind Cloudflare Tunnel (D-033, D-035).
- Daily backups (30 days), monthly restore test, staging and live environments, demo client with fake data.

## 9. Stack (D-035, D-036)
- TypeScript everywhere; Turborepo + pnpm monorepo: `apps/web` now, `apps/mobile` later, `packages/core` shared.
- Next.js (web + PWA), Tailwind, shadcn/ui; next-intl for languages; Zod for validation.
- Supabase (Postgres, Auth, Storage, Realtime), row-level security in plain SQL, no lock-in.
- Hosting: Vercel during the build (previews, fake data); Cloudflare in production from the first paying client (Workers, CDN, client domains, R2 photos); Supabase for database and logins. DNS on Cloudflare from day one. No Vercel-only features. Rwanda host via Cloudflare Tunnel if needed.
- Expected cost at start: about $45/month (about 65,000 RWF) or less with startup credits.
- Speed rules for guest pages: server-rendered, almost no JavaScript, compressed images, menu page budget about 300 KB, tested on slow 3G.
- Mobile later: Expo (React Native) reusing `packages/core`.
- v0 optional for UI scaffolding only; Claude Code builds all logic.

## 10. Build approach
- Spec first, then small slices, built in batches (D-052): several features per session, all specs approved once, one commit group per feature, CI green after each (D-058), progress in `specs/BATCH_LOG.md`. Tested on the demo client, committed after each working step.
- Batch order: Batch 0 automatic checks (done) → Batch 1 guest site (rooms, contact, privacy notice, SEO basics, WhatsApp booking message, PWA manifest, speed pass, with Playwright happy paths for new pages) → Batch 2 data and access (core data and RLS with isolation test, then a checkpoint; then login, platform admin with 2FA, module switches, subdomain routing, demo lodge in the database, `getSite()` on the database) → Batch 3 (editor, owner dashboard, Wording editor (D-061), click stats, security checklist, backups with restore test) → the prospect demos.
- Chat 1 (done): master plan and documents. Chat 2: mockups. Then scaffold and Claude Code.
- Build order (by product): compliance tasks → hotel website kit with editor → menu + WhatsApp orders → booking requests and QR table requests → manager orders page → the rest when clients pay; native staff app when time allows.
- First sellable milestone: hotel website kit with editor and demo client, about 2 to 2.5 weeks at 5+ hours a day.
- Full execution plan: EXECUTION_PLAN.md, ROADMAP.md, and BUILD_GUIDE.md. Compliance steps: COMPLIANCE.md.

## 11. Known risks
- **Legal:** NCSA registration (about 30 working days) and storage authorization (no published timeline) are slow; file in week 1. Short lawyer consult before the first client.
- **Payments:** online payment integration later through one licensed aggregator (D-027).
- **Google Business Profile** verification can take days to weeks; start day one per client.
- **Support load** grows with clients; reserve about 1 hour per day (D-034).
- **Building features before the first sale.**
- **A bug in one module breaking others:** module separation, staging tests, backups.
- **Late content:** reduced by live setup and photos during visits.
- **Weak connections:** light pages, PWA caching, retry, WhatsApp backup (D-028).

## 12. Open (tracked in DECISIONS.md)
Platform name and domain; Owned maintenance price; NCSA outcome for the chosen provider; client agreement text; payment aggregator choice; WhatsApp Business API timing; full offline mode; channel manager sync; other business types.

Settled since: owner login method (D-059), platform admin 2FA method (D-060), wording editor (D-061).

## Chat 2 addendum (2026-11-10)
- §7 Templates are now Field Journal, Imigongo, Cinematic (D-039). Launch with Field Journal only (D-040).
- §9 Speed rules: light motion kit, photo backgrounds, optional hero video under strict conditions (D-041).
- §3 Starter for hotels includes a basic menu and a "Reserve a table" WhatsApp button (D-046).
- Mockups: see docs/MOCKUPS.md.
- Working product name: **GetKaze** (D-051).
