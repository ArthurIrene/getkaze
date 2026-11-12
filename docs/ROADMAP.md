# ROADMAP.md: Build and business order

Status: v1.0 (7 Nov 2026). Day-by-day start in EXECUTION_PLAN.md.

## Phase 0: Compliance and setup (starts day 1, runs in parallel)
- NCSA registration as data controller and processor (about 30 days).
- Request NCSA authorization naming the chosen host and region (Supabase, Vercel).
- Designate data protection officer (likely you; confirm).
- Lawyer check: client agreement, privacy notice, data roles, Owned handover terms.
- Choose platform name and domain.
- Put platform DNS on Cloudflare; apply for Cloudflare for Startups.
- Ask Strettch and AOS for quotes (Rwanda fallback host).
- Gate: go live once NCSA registration is filed (owner logins only, with consent clause). Guest data waits for storage authorization or a Rwanda host.

## Phase 1: Hotel website kit (first sellable milestone, about 2 to 2.5 weeks)
Monorepo, Supabase, core data with row-level security and isolation test, platform admin, module switches, subdomain routing, 3 templates, content editor, room list, Call and WhatsApp buttons, booking request via WhatsApp, click stats, languages with fallback, RWF/USD, privacy notice, SEO basics, speed pass, backups, demo client. Then personalized demos for the first prospects.

## Move checkpoint (before the first paying client, gate G2)
Deploy to Cloudflare, run all tests, check speed on slow 3G, then point the live domain to Cloudflare. Vercel stays for previews only.

## Phase 2: Restaurant entry (after the first sales)
Menu + WhatsApp orders, QR table requests, order-ahead pickup. Sells to restaurants, bars, and hotels with food.

## Phase 3: After the first paying clients
Manager orders page (PWA, Realtime), booking calendar, customer list (after NCSA status), payments Level 1, billing and overdue list completed.

## Phase 4: When clients pay or ask
Staff management, staff order flow, tabs, stock, reports, housekeeping, check-in, guest requests in rooms, payments Level 2 (aggregator).

## Phase 5: When time allows
Native staff app (Expo) reusing `packages/core`; WhatsApp Business API; full offline mode; more templates.

## Service work per client (not code)
Visit and live setup, basic photos, Google Business Profile claim and verification (start day one), SEO checklist, domain in client's name, 30-minute training, month 1 check-in with click stats.

## Reviews
- Price review after the first 5 clients.
- 3 to 5 founding clients: discounts or free shoot for testimonials and photos.

## Chat 2 addendum (2026-11-10)
- Phase 1 ships **one template (Field Journal)** with home, rooms, menu display, find us, and the Check availability form in launch mode (D-040, D-044).
- **Weeks 3–5 (new):** availability calendar, booking inbox, booking code and My booking, payment confirmations — demo-only until NCSA authorization (D-044, D-049).
- Phase 2 adds Imigongo with the restaurant ordering slice; Cinematic comes with the first photo-shoot client.

## Progress (2026-11-12)
- Batch 0 (CI, weight check, Playwright): done.
- Batch 1 (guest site: rooms, contact, navigation, privacy notice draft, SEO basics, booking request launch mode, PWA manifest, speed pass): built on demo data. See specs/BATCH_LOG.md.
- Next: Batch 2 (data and access), starting with core data, RLS and the isolation test, then a checkpoint.
