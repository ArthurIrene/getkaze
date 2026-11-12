# Feature: Privacy notice page (per business)
Module: Compliance / Templates   Priority: P1   Preset: both
Decisions: D-033, D-049, D-051 (company Altavision, product name in config), D-054, D-055; COMPLIANCE.md §4 ("Privacy notice on our site and every client site") and §6 (each business is the controller for its guests; we are the processor).
Status of the text: **DRAFT, PENDING LAWYER REVIEW.** It must not be presented as final. The page shows "Draft, pending legal review" while `platform.privacyNotice.status` is `"draft"` (overview, point 8).
Conflicts: the Kinyarwanda body waits for the approved English (overview, point 4). The booking form's transient processing is noted under "Lawyer questions".

Goal: Every client site tells guests, in plain words, who holds their data, what the site collects (almost nothing) and what their rights are, before any guest data is handled.

Users: Guests. The text is platform wording filled with business data: one text for all clients, so a lawyer's fix reaches everyone (rule 4: no client-specific code).

## Screens
At `/privacy` and `/rw/privacy`. Plain reading page in the Field Journal style: h1 "Privacy notice", a small mono "Draft, pending legal review" line, "Last updated {date}", then short sections with h2 headings. It has no hero and no motion, max width 640 px, 16 px gutters. The footer "Privacy" link is shown on every page.

## Text (English draft; `{…}` filled from data)
1. **Who we are.** This website belongs to {legalName} ("{name}"), {area}. {name} decides how guests' personal data is used (the data controller). Contact: {phone}, WhatsApp {whatsapp}{, email}. The website is built and run for {name} by {platform.company} ({platform.name}), which acts as data processor.
2. **What this site collects.** You can browse this site without giving any personal data. It sets **no cookies**, runs **no analytics** and shows **no ads**. Like every website, our hosting provider briefly keeps technical logs (IP address, page, time and browser) to run and protect the service.
3. **Booking requests and messages.** When you use "Check availability", the details you type (room, dates, guests, payment choice, your name and an optional note) are used for a moment to write your message, and then **you** send it from your own WhatsApp or email directly to {name}. This website **does not store** these details. WhatsApp (Meta) or your email provider then carry the message under their own terms. {name} uses your message only to answer you and arrange your stay. Calling or writing to {name} works the same way.
4. **Where data is kept.** This website is served by: {platform.hosting list}. During the build this is Vercel (United States, global network); see COMPLIANCE.md for the full list. The details you send are kept in {name}'s WhatsApp or email, not on this website.
5. **Your rights** (Law No. 058/2021 on the protection of personal data and privacy). You may ask {name} for access to, correction of, or deletion of your personal data, object to its use, and ask to move it. Contact {name} using the details above. You can also complain to the National Cyber Security Authority (NCSA), Data Protection and Privacy Office (dpo.gov.rw).
6. **Changes.** We will update this notice when the site starts to collect more (for example, a booking inbox after authorization, D-044/D-049). The date at the top shows the latest version.
- Registration numbers are shown only once they exist (`platform.privacyNotice.registration` stays empty until NCSA issues them).

## Data (read only)
- Business: `name`, `legalName`, `location.area`, contacts.
- **New platform config** in `packages/core` (`platform`): `company: "Altavision"`, `privacyNotice: { status: "draft", updated: "2026-11-12", registration: null }`, and `hosting: [{ provider: "Vercel", where: "United States (global network)" }]`. These are config values, not secrets.
- The text template lives in `messages/en.json` under `Privacy`. Placeholders are filled by `privacyFacts(view, platform)` in `packages/core`, which picks which optional lines show (email, registration).
- **Turn off the `NEXT_LOCALE` cookie** (`localeCookie: false` in `apps/web/src/i18n/routing.ts`) so that "no cookies" is true. A Playwright check asserts that no `Set-Cookie` header is sent on any guest page.

## Permissions
Public, read only. The owner cannot edit the notice (platform text). The platform admin changes it once, for all clients.

## Module switch
Always on for every client site.

## Languages
English body. Kinyarwanda title, headings, the draft line and the date line (batch-1-guest-site.md); the Kinyarwanda body falls back to English until the lawyer-approved English is translated.

## Acceptance criteria
1. Given any guest page, when it loads, then the footer shows a "Privacy" link to `/privacy` (or `/rw/privacy`).
2. Given the privacy page, when it loads, then it names the business's legal name and contacts and the processor ({platform.company}), and shows "Draft, pending legal review".
3. Given a business without email, when the page loads, then no email line shows.
4. Given any guest page, when it loads, then the response sets no cookie.
5. Given `/rw/privacy`, when it loads, then the headings are in Kinyarwanda and the body falls back to English (no blanks, no raw keys).

Playwright: footer link → privacy, business name present, draft line present, no `Set-Cookie` on /, /rooms, /contact, /book and /privacy.

## Lawyer questions (add to COMPLIANCE.md §2 step 6)
- Is transient processing of booking-request details on a host outside Rwanda (not stored) allowed after registration is filed, before storage authorization?
- Wording of controller and processor roles for Managed clients (COMPLIANCE.md §6).
- Do server access logs at the hosting provider count as storage outside Rwanda for this purpose?

## Out of scope
Our own platform's privacy notice (getkaze site), cookie banner (no cookies), data export screens (editor), the Kinyarwanda legal body.

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
