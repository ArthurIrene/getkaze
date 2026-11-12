# DECISIONS.md: Decision log

Rule: when an idea conflicts with a rule in PROJECT.md, name the conflict, explain the tradeoff, propose the change, and wait for confirmation. Once confirmed, add an entry below.

Entry format: ID / Date, Decision, Replaces, Reason, Status.

---

## D-001 | 2026-11-07
- **Decision:** Start in Musanze with hotels and lodges that have no website, using a template website kit as the door-opener.
- **Replaces:** none
- **Reason:** They already have guests and lack online presence; fastest path to first income. Reconfirmed in Chat 1: hotels first, restaurants next.
- **Status:** Confirmed

## D-002 | 2026-11-07
- **Decision:** Three service tiers: Starter, Growth, Premium.
- **Replaces:** none
- **Reason:** Easy entry offer with clear upsells.
- **Status:** Replaced in part by D-017 (Growth and Premium are now suggested bundles, not fixed tiers)

## D-003 | 2026-11-07
- **Decision:** One shared system serving all clients, not a copy per client.
- **Replaces:** Option A (copy and edit per client)
- **Reason:** Fixes reach everyone at once; adding a client is a form, not new code.
- **Status:** Confirmed

## D-004 | 2026-11-07
- **Decision:** One shared backend and database, with `business_id` on every record and row-level security.
- **Replaces:** one database per client
- **Reason:** Cheaper and simpler to run, back up, and update at 5 to 50 clients.
- **Status:** Confirmed

## D-005 | 2026-11-07
- **Decision:** Two service models: Managed and Owned (handover of code, data, hosting, domain, and logins, plus a fixed support window).
- **Replaces:** none
- **Reason:** Clients choose between low cost and full ownership.
- **Status:** Confirmed (support window set by D-026)

## D-006 | 2026-11-07
- **Decision:** Domains are registered in the client's name. Clients can export their data any time.
- **Replaces:** none
- **Reason:** Builds trust; we charge for hosting, updates, and support, not for owning their business.
- **Status:** Confirmed

## D-007 | 2026-11-07
- **Decision:** Variety through 3 to 5 templates plus per-client theme settings. Neighbouring competitors get different templates. Custom front end is a paid upgrade.
- **Replaces:** none
- **Reason:** Avoids identical sites without a design per client.
- **Status:** Confirmed (start with 3)

## D-008 | 2026-11-07
- **Decision:** Monorepo with shared components, one folder per template, one backend.
- **Replaces:** none
- **Reason:** Easier testing and AI-assisted development.
- **Status:** Confirmed

## D-009 | 2026-11-07
- **Decision:** Hotels and restaurants/bars on the same core and login, with separate modules.
- **Replaces:** completely separate products
- **Reason:** A hotel with a restaurant is one business with two modules on.
- **Status:** Confirmed

## D-010 | 2026-11-07
- **Decision:** Guest Requests and Orders module via QR (browser page, no app); staff see live requests on mobile web.
- **Replaces:** none
- **Reason:** Strong value; works on cheap Android phones.
- **Status:** Confirmed (phased by D-020)

## D-011 | 2026-11-07
- **Decision:** Role-based access; permissions are settings; every action logged.
- **Replaces:** none
- **Reason:** Protects owners; flexible per business.
- **Status:** Confirmed

## D-012 | 2026-11-07
- **Decision:** PWA first; native app only after paying clients ask. Shared backend.
- **Replaces:** none
- **Reason:** Fastest to build; one codebase.
- **Status:** Confirmed (refined by D-037)

## D-013 | 2026-11-07
- **Decision:** Pitch with a personalized demo and "what you're missing" audit; include Google Business Profile and basic SEO; no ranking promises.
- **Replaces:** none
- **Reason:** Showing beats telling; honest expectations.
- **Status:** Confirmed

## D-014 | 2026-11-07
- **Decision:** First sellable demo in about 2 weeks; later features only after a client pays or asks.
- **Replaces:** a longer phased plan
- **Reason:** Sales drive priorities.
- **Status:** Confirmed

## D-015 | 2026-11-07
- **Decision:** Chat 1 master plan, Chat 2 mockups, then scaffolding. Project documents are the source of truth.
- **Replaces:** none
- **Reason:** Scaffold from a clear picture.
- **Status:** Confirmed

## D-016 | 2026-11-07
- **Decision:** Two launch presets: Hotel/Lodge and Restaurant & Bar. Restaurant & Bar has a venue-style setting (restaurant-first or bar-first) that changes wording and template only. Other types postponed until a paying client asks.
- **Replaces:** separate Restaurant and Bar presets (draft)
- **Reason:** Bars here also run kitchens; same modules and roles; less to build and support.
- **Status:** Confirmed

## D-017 | 2026-11-07
- **Decision:** Starter is fixed per preset and includes Google Maps / Business Profile and basic SEO setup. Add-ons are chosen per business; locked modules visible as upgrades. Growth and Premium become suggested bundles.
- **Replaces:** fixed tiers in D-002
- **Reason:** Businesses have different needs; Maps is the main gap for tourists.
- **Status:** Confirmed

## D-018 | 2026-11-07
- **Decision:** Paid custom features are built as general modules (switched on for that client first, offered to others later). Fully independent systems go to the Owned model or a paid custom front end.
- **Replaces:** clarifies rule 4 (no client-specific code)
- **Reason:** Flexibility without maintaining many versions.
- **Status:** Confirmed

## D-019 | 2026-11-07
- **Decision:** Design the full product now (FEATURES.md and mockups); build only the sellable core; sell further modules from mockups; module switches from day one.
- **Replaces:** proposal to build the full restaurant product first
- **Reason:** Avoid months without income and unused features.
- **Status:** Confirmed

## D-020 | 2026-11-07
- **Decision:** Orders grow in steps: WhatsApp orders (free click-to-chat), then manager-only orders page, then full staff flow. Order-ahead at launch: restaurant confirms, guest pays on pickup.
- **Replaces:** none
- **Reason:** Smallest working slice first; no outside approval needed.
- **Status:** Confirmed

## D-021 | 2026-11-07
- **Decision:** No client versions. All Managed clients run the latest code; we sell plans. New features arrive switched off; data changes only add; releases tested on staging and demo client; onboarding checklist per module. Only Owned clients have snapshot versions.
- **Replaces:** none
- **Reason:** Growing the system without breaking existing clients.
- **Status:** Confirmed

## D-022 | 2026-11-07
- **Decision:** Individual staff logins (phone number + PIN), set up by the owner; several roles per person; instant disable; no SMS at launch; shared-device mode later.
- **Replaces:** none
- **Reason:** Most staff have smartphones; meaningful action logs; no SMS cost.
- **Status:** Confirmed

## D-023 | 2026-11-07
- **Decision:** Prices shown in RWF and USD, both entered manually by the owner; guest switches currency. Online payments charge RWF.
- **Replaces:** none
- **Reason:** Supports resident and international rates; no exchange-rate dependency.
- **Status:** Confirmed

## D-024 | 2026-11-07
- **Decision:** Owners edit their own content through simple phone-friendly forms (no page builder). The same editor is used for live setup during sales visits. Photos compressed; safe limits; changes logged.
- **Replaces:** none
- **Reason:** Scales without support load; doubles as the sales tool.
- **Status:** Confirmed

## D-025 | 2026-11-07
- **Decision:** Modular pricing: setup + monthly per module (Starter 500k + 20k/month; add-ons per price list in PROJECT.md). Discounts agreed per client, floor about 70%, setup discounted first, recorded. Monthly or yearly billing (2 months free). Clients pay us via our MoMo/Airtel merchant code.
- **Replaces:** none
- **Reason:** Price follows chosen services; protects recurring income.
- **Status:** Confirmed (review after 5 clients)

## D-026 | 2026-11-07
- **Decision:** Owned: quoted per client (guideline 1.5M to 3M RWF), 3 months support included, then optional paid maintenance plan.
- **Replaces:** open support window (3 to 6 months) in D-005
- **Reason:** Free support on a copy without our updates is costly for a solo builder.
- **Status:** Confirmed (maintenance plan price open)

## D-027 | 2026-11-07
- **Decision:** Guests always pay the business directly; we never hold guest money. Launch: show the business's own payment details, staff confirm by hand. Later: one licensed aggregator with per-business sub-merchant accounts and direct payout. Gateway choice postponed until a client needs it.
- **Replaces:** none
- **Reason:** Holding others' payments likely needs a central bank licence; one aggregator avoids repeating approvals per business.
- **Status:** Confirmed

## D-028 | 2026-11-07
- **Decision:** Most businesses are connected (Wi-Fi or mobile bundles). No full offline mode at launch. Light guest pages, PWA caching, offline banner with automatic retry, WhatsApp as backup.
- **Replaces:** none
- **Reason:** Full offline sync is complex for a solo builder; connection is mostly available.
- **Status:** Confirmed

## D-029 | 2026-11-07
- **Decision:** Business content: English required, Kinyarwanda and French optional, missing translations fall back to English. Platform screens in English and Kinyarwanda, French optional. A language gets its own indexed pages only when translated.
- **Replaces:** clarifies rule 11
- **Reason:** International guests are the main target; sites never look broken.
- **Status:** Confirmed

## D-030 | 2026-11-07
- **Decision:** Client journey in 9 steps (find, prepare demo, visit, pay, live setup, Google profile, go live, train, month 1 check-in). Setup paid 50% at signing, 50% at go-live; monthly fee starts at go-live.
- **Replaces:** none
- **Reason:** Fast, repeatable onboarding; protects cash flow.
- **Status:** Confirmed

## D-031 | 2026-11-07
- **Decision:** Non-payment: reminder at due date; grace period 14 days by default, adjustable per client; day 15 add-ons pause (data kept, login and export work); day 30 site shows "temporarily unavailable"; day 90 final notice with export offer, then deletion. Paying again restores everything. Reminders manual at launch from an overdue list.
- **Replaces:** none
- **Reason:** Fair and clear; never holds domain or data hostage (rule 6).
- **Status:** Confirmed

## D-032 | 2026-11-07
- **Decision:** Basic phone photos (about 10 to 15) included in setup, plus existing Maps/Facebook photos. Professional shoot is a paid add-on (100k to 250k RWF), possibly a perk for founding clients. The client owns the photos; portfolio use only with permission.
- **Replaces:** none
- **Reason:** No site goes live empty; strong upsell for lodges.
- **Status:** Confirmed

## D-033 | 2026-11-07 (updated)
- **Decision:** Comply with Law No. 058/2021 (steps in COMPLIANCE.md). File NCSA registration (controller and processor) in week 1, designate a data protection officer, then apply for authorization to store outside Rwanda naming Supabase and Cloudflare. Sell and go live once registration is filed, storing only owner logins, with a consent clause in the client agreement. Guest data (bookings, customers, stored orders) waits until storage authorization is granted or that data moves to a Rwanda host. One short lawyer consult before the first client.
- **Replaces:** first version (no real client data until the lawyer confirms the NCSA path)
- **Reason:** Keeps selling from day one; only what truly needs authorization waits.
- **Status:** Confirmed

## D-034 | 2026-11-07
- **Decision:** Support: one WhatsApp business number, fixed hours, same-day replies, urgent = site down or orders not arriving, how-to videos in Kinyarwanda and English. Security: row-level security with isolation test, platform admin 2FA, PIN lockout, HTTPS, secrets out of code, logged support access. Backups daily, 30 days, monthly restore test, stored per data-location rules. Breach notification template ready.
- **Replaces:** none
- **Reason:** Keeps support and risk manageable for one person.
- **Status:** Confirmed

## D-035 | 2026-11-07 (updated)
- **Decision:** Stack: TypeScript, Turborepo + pnpm, Next.js (web + PWA), Tailwind, shadcn/ui, next-intl, Zod, Supabase (Postgres, Auth, Storage, Realtime). Hosting: Vercel during the build phase (previews, fake data only); Cloudflare for production from the first paying client (app on Workers, CDN, client domains, R2 for photos). DNS on Cloudflare from day one. No Vercel-only features in the code. If needed, a Rwanda server connected through Cloudflare Tunnel. Apply for Cloudflare for Startups and keep applying for grants.
- **Replaces:** first version (Vercel + Supabase for production)
- **Reason:** Easy previews while building; lower long-run cost, startup credits, one paid plan across products, and a clean path to Rwandan hosting.
- **Status:** Confirmed

## D-036 | 2026-11-07
- **Decision:** v0 optional for UI scaffolding only; Claude Code builds all logic. Business rules live in the database and `packages/core`, so any client app can connect.
- **Replaces:** open "scaffold vs Claude Code split"
- **Reason:** The scaffold tool never owns the backend; future mobile only needs new screens.
- **Status:** Confirmed

## D-037 | 2026-11-07
- **Decision:** Web (PWA) first for owners, managers, and staff. Guests always use the web. A native staff app (Expo) is in the roadmap, built when time allows.
- **Replaces:** refines D-012
- **Reason:** Start with what works and sells; staff app is valuable but not needed first.
- **Status:** Confirmed

## D-038 | 2026-11-07
- **Decision:** Chat 2 mockups in three levels: full detail for P1 (templates, editor, owner dashboard, platform admin, login), medium for P2 (guest ordering, QR requests, booking form, manager orders page), sketch for P3 (one main screen per role, staff, stock, reports). Shared states (empty, loading, offline, error, locked module) shown once.
- **Replaces:** clarifies D-015 ("mockups for every business type and role")
- **Reason:** Covers every type and role without weeks of design for features built months later.
- **Status:** Proposed

---

## Open / Postponed
- **Platform name and domain** (day 1 of execution).
- ~~**Owner login method**~~ settled by D-059.
- **Owned maintenance plan price.**
- **NCSA outcome** for Supabase and Cloudflare; fallback to a Rwanda host (Strettch or AOS quotes).
- **Lawyer question:** does our storage authorization cover Managed clients, or does each business need its own?
- **Compliance pack** for clients as a paid service.
- **Grants and credits:** Cloudflare for Startups, others as found.
- **Client agreement text** (lawyer).
- **NCSA registration help for clients** as a paid service.
- **Payment aggregator choice** (when a client needs online payment).
- **WhatsApp Business API** (automated replies and reminders; Meta approval).
- **Full offline mode** (on client demand).
- **SMS login codes** (on client demand).
- **Channel manager sync** with booking platforms.
- **Other business types** (when a paying client asks).
- **Price review** after the first 5 clients.

---

## Chat 2 (mockups) decisions — 2026-11-10

## D-038 (status update)
- **Status:** Confirmed, with the booking request form and the booking system moved to full detail.

## D-039 | 2026-11-10
- **Decision:** Three templates: **Field Journal** (sketch-led scrapbook, one long story), **Imigongo** (bold poster, clear order, Rwandan geometric patterns, two colors + clay accent), **Cinematic** (full-screen photo scenes with an "All info" list fallback). Each has its own structure and motion; the action flows (booking, ordering, My booking, payment) are shared and only restyled.
- **Replaces:** template names in D-007 and PROJECT.md §7 (warm lodge, modern/minimal, bold safari).
- **Reason:** Original, Rwanda-rooted looks that still work with weak photos; one set of flows to maintain.
- **Status:** Confirmed

## D-040 | 2026-11-10
- **Decision:** Launch with **one template (Field Journal)** for hotels and lodges. Imigongo is built when we approach restaurants (Phase 2); Cinematic with the first client who buys the photo shoot. Variety until then comes from color sets, night mode and sections. Remaining pages of later templates can be generated after the first product is done.
- **Replaces:** G1 requirement of 3 templates (BUILD_GUIDE §8). D-007 (neighbours get different templates) applies once all 3 exist.
- **Reason:** Faster first sale, fewer bugs, sales target hotels first.
- **Status:** Confirmed

## D-041 | 2026-11-10
- **Decision:** Light motion kit for guest pages: CSS and native browser motion only (scroll-driven animation, View Transitions), transform and opacity only, about 2 KB of script, off for reduced motion and data saver, no scroll hijacking. Each template has its own motion language. Photo backgrounds allowed in all templates (shrunk, lazy-loaded). Optional hero video only: hero only, 5–8 s, muted, under ~600 KB, loads after the page, never on slow connections or data saver, never on menu/order/booking pages; mainly for Cinematic with the photo shoot.
- **Replaces:** refines PROJECT.md rule 9 and §9 speed rules.
- **Reason:** Modern feel inside the 3G budget.
- **Status:** Confirmed

## D-042 | 2026-11-10
- **Decision:** Guest pages are visual-first and minimal: titles and pictures first, details on tap. Home sections (each switchable and reorderable by the owner): hero, quick facts, life at the lodge, rooms, at our table, around us (activities with "Ask us to arrange"), your host, reviews, find us; plus facilities and meetings & events for town hotels. Activities and halls are catalog items.
- **Replaces:** none
- **Reason:** Drawn from inspiration review (The Vineyard, Casa Momo, Terreno, Pier88) and matched to small businesses.
- **Status:** Confirmed

## D-043 | 2026-11-10
- **Decision:** Hotel/Lodge preset gets a **property style** setting: lodge, town hotel, guesthouse. It sets default sections, wording and default template.
- **Replaces:** extends D-016
- **Reason:** Serve mid-range hotels without a template per category.
- **Status:** Confirmed

## D-044 | 2026-11-10
- **Decision:** Professional booking: "Check availability" form (room, dates with availability, guests, payment choice, details). At launch it is delivered through the guest's own WhatsApp or email (nothing stored). After NCSA storage authorization it goes into the owner's booking inbox. No guest accounts: the guest gets a booking code and private link; "My booking" needs code + last 4 phone digits and shows status, payment, messages and "We can help with" extras. Availability calendar stores no guest data (room, date, status only) and lets owners block rooms booked elsewhere. Booking system built in weeks 3–5, demo-only until authorization.
- **Replaces:** WhatsApp-only booking request (D-020 for hotels); refines D-033 timing.
- **Reason:** More professional than chat; stays legal at launch.
- **Status:** Confirmed

## D-045 | 2026-11-10
- **Decision:** Payments in the booking flow (Level 1): guest chooses at the lodge, MTN MoMo, Airtel Money or bank transfer; deposit rules and accepted methods are owner settings; owner taps "Mark as paid". Every status change reaches the guest by email (automatic) and optionally WhatsApp (one tap from the owner's phone). Card online waits for Level 2.
- **Replaces:** none (applies D-027)
- **Reason:** Guests always pay the business directly; no accounts needed.
- **Status:** Confirmed

## D-046 | 2026-11-10
- **Decision:** Basic menu display included in the hotel Starter, with a plain "Reserve a table" WhatsApp button. Ordering add-on (Menu + WhatsApp orders) includes: QR knows the table or room (no "where are you"); website orders ask Pick up / Delivery / Eat here (table reservation with pre-order); date and time picker limited by prep time (slowest dish) and notice hours; one step at a time from the bottom bar. Delivery is an owner setting, off by default.
- **Replaces:** extends D-020 and BUSINESS_TYPES §1
- **Reason:** Hotels with restaurants serve outside guests; ordering must be simple.
- **Status:** Confirmed

## D-047 | 2026-11-10
- **Decision:** "Today's menu": all dishes with one-tap sold out until next opening time, plus today-only specials. Orders are requests until the business confirms; the orders page (later) gets "Item unavailable → offer swap → mark sold out".
- **Replaces:** none
- **Reason:** Stop orders for finished dishes even when the owner forgets.
- **Status:** Confirmed

## D-048 | 2026-11-10
- **Decision:** Translations: owners fill English and Kinyarwanda side by side (suggested text has a "draft, tap when checked" badge; French optional). Platform wording lives in one translation file per language, editable in a platform admin "Translations" screen; owners can suggest a better word. Definition of Done adds a native-speaker check for Kinyarwanda.
- **Replaces:** clarifies D-029
- **Reason:** Wrong Kinyarwanda costs trust; fixes reach every client at once.
- **Status:** Confirmed

## D-049 | 2026-11-10
- **Decision:** Compliance gate in platform admin: booking inbox, guest lists and the manager orders page stay locked for all clients until the NCSA storage authorization number is entered.
- **Replaces:** none (enforces D-033)
- **Reason:** Make the legal rule impossible to forget.
- **Status:** Confirmed

## D-050 | 2026-11-10
- **Decision:** Owner app patterns: every list row opens its edit form, every "+" opens the same form empty, every form ends with Save ("live on your site"); photos auto-shrink on upload and are assigned to places; locked modules show price and "Ask to switch on via WhatsApp". Owner app and platform admin use a plain platform style ([PLATFORM NAME] placeholder), separate from client brands.
- **Replaces:** none
- **Reason:** Predictable for owners; sells upgrades without pressure.
- **Status:** Confirmed

## Open after Chat 2
- Platform/product name (working name GetKaze, see D-051).
- Owner login method (email + password shown in mockups).
- Kinyarwanda wording in owner app (native check).
- Reviews: owners may only post reviews they are allowed to use (lawyer).
- Remaining mockup pages for Imigongo and Cinematic (generate later).

## D-051 | 2026-11-10
- **Decision:** Working product name **GetKaze** ("Kaze" in the owner app and admin; guests only see each business's own brand). Repository: `getkaze`. The name is a config setting, not hard-coded, so it can change cheaply.
- **Replaces:** "Musanze Business Platform" as the working name; [PLATFORM NAME] placeholder in mockups.
- **Reason:** Short, warm ("welcome"), easy for owners; the "Get" prefix makes the domain and search ownable since plain "Kaze" is used by other Rwandan businesses (real estate, crafts, a tour operator named Ikaze).
- **Status:** Confirmed as working name. Before final: check getkaze.rw / getkaze.com, RDB trademark search (software, class 42), social handles. Company remains Altavision; temporary hosting under altavision.rw until the domain is bought.

## D-052 | 2026-11-12
- **Decision:** Batch mode. A batch is several features in one session. All specs are written first and approved once; then the build runs without stopping. One commit group per feature, CI green after each feature, and `specs/BATCH_LOG.md` updated after each feature (built, tests, page weight, deviations) so a new session can resume from it. Stop and ask only for: a conflict with a rule or decision, a migration that removes or renames, a new dependency, a test still failing after three honest tries, or anything touching the live Supabase project. Data and security work (row-level security, isolation test) ends with a checkpoint before anything is built on it.
- **Replaces:** "one feature per session" (PROJECT.md section 10) and per-feature plan approval (BUILD_GUIDE.md section 1).
- **Reason:** Fewer stops per session; CI (D-058) and the batch log keep each feature checked and resumable.
- **Status:** Confirmed

## D-053 | 2026-11-12
- **Decision:** During the build, `staging` is the GitHub default branch and Vercel's production branch, so getkaze.vercel.app shows the latest staging. `main` stays untouched until gate G2.
- **Replaces:** none (refines BUILD_GUIDE.md section 4 for the build phase)
- **Reason:** One always-current demo URL without merging unfinished work to `main`.
- **Status:** Confirmed

## D-054 | 2026-11-12
- **Decision:** Every page sends noindex (robots meta and `X-Robots-Tag: noindex, nofollow`; no robots.txt Disallow, so crawlers can see the noindex) until gate G2. At G2 it is removed per business with real content.
- **Replaces:** none
- **Reason:** Demo and fake data must not be indexed.
- **Status:** Confirmed

## D-055 | 2026-11-12
- **Decision:** The RWF/USD switch is CSS only (both prices in the HTML, radio buttons with `:has()`, no JavaScript). `defaultCurrency` is a data setting per business; the demo lodge uses USD.
- **Replaces:** none (applies D-023 and D-041)
- **Reason:** No JavaScript on guest pages for a basic switch; the owner picks what guests see first.
- **Status:** Confirmed

## D-056 | 2026-11-12
- **Decision:** Field Journal hero: full screen at the start, pinned while it shrinks to the card (shrink distance `--fj-hero-shrink`, default `60svh`), then it scrolls away together with the header. Transform and opacity only (D-041). The plain card (16 px margins, 20 px corners) is the fallback without scroll-driven animation, with reduced motion, and when the hero is not the first section. Card rows wrap and center.
- **Replaces:** none (extends D-041 for the Field Journal template)
- **Reason:** A strong first view that stays within the motion kit and falls back cleanly.
- **Status:** Confirmed

## D-057 | 2026-11-12
- **Decision:** Vercel runs Node 22.x to match `.nvmrc`.
- **Replaces:** none
- **Reason:** Same runtime for local, CI and previews.
- **Status:** Confirmed

## D-058 | 2026-11-12
- **Decision:** CI (build, lint, typecheck, unit tests, page weight, Playwright) runs on every pull request and on pushes to `staging` and `main`, and is the gate in batch mode (D-052). Page weight fails over 300 KB transferred for the first view of a page; JS is reported but not enforced until the JS budget is set.
- **Replaces:** none
- **Reason:** Automatic checks replace per-feature manual approval.
- **Status:** Confirmed

## D-059 | 2026-11-12
- **Decision:** Owner login: email and password through Supabase Auth. Invite only (the platform admin invites an owner; no public sign-up). No SMS. Password reset by email. Supabase's built-in email sender is for testing only; a custom email sender (our own domain) is set up before G2.
- **Replaces:** the open "owner login method" (DECISIONS.md "Open", PROJECT.md §12, ROLES.md §3).
- **Reason:** No SMS cost, works on every phone, and nobody can create an account we did not invite.
- **Status:** Confirmed

## D-060 | 2026-11-12
- **Decision:** Platform admin 2FA is a TOTP authenticator app (Supabase Auth MFA). Admin screens and admin data require it: the session must be at assurance level aal2, and row-level security on admin data checks aal2 too, not only the screens.
- **Replaces:** refines D-034 ("platform admin 2FA").
- **Reason:** Free, no SMS, and enforced by the database as well as the app.
- **Status:** Confirmed

## D-061 | 2026-11-12
- **Decision:** Wording editor in platform admin (Batch 3). Each wording key shows English beside Kinyarwanda, with a status of draft or checked. A wording override is stored in the database. The app reads wording in this order: database override, then the messages file (`apps/web/messages/<locale>.json`), then English.
- **Replaces:** refines D-048 (admin "Translations" screen).
- **Reason:** The owner can fix Kinyarwanda without a code change, and every fix still falls back safely.
- **Status:** Confirmed

## D-062 | 2026-11-12
- **Decision:** Domains. The platform domain is **altavision.rw**. Each business is served at **`<slug>.altavision.rw`**; the base domain is a setting (`PLATFORM_DOMAIN`), not hard-coded. Our own screens (owner login, owner pages, platform admin) are on **`kaze.altavision.rw`**, also a setting (`APP_HOST`). Before the domain is set up, the fallback is `getkaze.vercel.app/s/<slug>/…`, and the bare `getkaze.vercel.app` keeps showing the demo lodge (D-053). **Reserved names** that can never be a business slug: `www`, `mail`, `admin`, `app`, `api`, `kaze`, plus every subdomain the company already uses (added to the list as they are named), plus the technical names the platform needs (`s`, `auth`, `login`, `owner`, `static`, `cdn`, `assets`, `smtp`, `imap`, `pop`, `webmail`, `ftp`, `ns1`, `ns2`, `autodiscover`, `autoconfig`, `_dmarc`, `status`, `support`, `help`, `docs`, `blog`). The list lives in the database (`reserved_slugs`, enforced by a trigger) and in `packages/core` (for form checks); a test keeps the two equal.
- **Replaces:** the `<slug>.getkaze.rw` example in specs/business-by-host.md; refines D-051 ("temporary hosting under altavision.rw").
- **Reason:** One company domain for every client site until clients bring their own (D-006); settings keep a later move cheap.
- **Status:** Confirmed. Open: the list of subdomains Altavision already uses.
