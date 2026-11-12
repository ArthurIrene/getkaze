# Feature: WhatsApp booking request ("Check availability", launch mode)
Module: Booking (launch mode)   Priority: P1   Preset: Hotel/Lodge
Decisions: **D-044** (Check availability form, delivered through the guest's own WhatsApp or email, nothing stored), D-045 (payment choice; accepted methods are an owner setting), D-027 (guests pay the business directly), D-033 and D-049 (no guest data stored before authorization), D-020, D-023, D-041.
Mockup: `mockups/canvas/T1-Booking.dc.html` with `launchMode` on (the "Send by WhatsApp / Send by email" variant).
Conflicts: see the overview, points 1 (the Batch 0 test assertion moves), 2 (transient processing on our server) and 3 (no availability calendar yet).

Goal: A guest sends a clear, complete booking request (room, dates, guests, payment choice) to the lodge in under a minute, from their own WhatsApp or email, while the platform stores nothing.

Users: Guests (no login). The owner receives the message in their normal WhatsApp or email.

## Screens
`/book` (and `/rw/book`), optional `?room=<id>` to preselect. A plain HTML `<form method="post" action="/book/send">` (or `/rw/book/send`). **No client JavaScript**; native inputs and HTML validation only.
1. **Room:** radio cards (name, price via `<Price>`, "Sleeps {n}"). `?room=` preselects one; with no `?room=`, nothing is picked and the field is `required`.
2. **Dates:** two native `<input type="date">` (Check-in, Check-out), `required`, `min` = today in Africa/Kigali (the page renders per request, so `min` is always current), `max` = today + 18 months.
3. **Guests:** `<input type="number">` Adults (min 1, max = the largest room's `maxGuests`, default 2) and Children (min 0, max 10, default 0). The per-room limit is checked on the server.
4. **How you'd like to pay:** radio cards from the business's `bookingPayments` (lodge, MoMo, Airtel, bank). The note for the picked method (mockup wording) shows under the list via CSS `:has(:checked)`.
5. **Your details:** Name (`required`, max 80) and Note (optional `<textarea>`, max 500, placeholder "Late arrival? Permits? A driver?"). **No phone or email fields:** the guest sends from their own WhatsApp or email, so the lodge already has them (data minimisation; differs from the mockup).
6. **Send:** two submit buttons, `name="via"`: "Send by WhatsApp" (accent) and "Send by email" (outlined, only when the business has an email), then the line "Goes straight to {name} from your own WhatsApp or email. Nothing to pay now; they reply with payment details." and a Privacy link.
- **Currency:** the header RWF/USD radios get `value` and `form` attributes on this page, so the chosen currency is sent with the form and the quoted total uses it. CSS-only switch, as before (D-055).
- Left out from the mockup, because each needs JavaScript: the availability calendar, the live "your stay" total card, the +/− steppers and "Preview the message". The quoted total is in the message instead.
- Phone first. Desktop (≥ 768 px): the form is centred, max width 640 px.
- **Error page** `/book/error?reason=dates|guests|missing[&max=n]`. It carries no guest details: "Something to fix", the reason, "Use your browser's back button to fix it; your answers are kept." and a link to `/book`.
- Entry points: the sticky bar's "Check availability", the menu's "Check availability", and each room's "Check dates" (`/book?room=<id>`).

## Server route `POST /book/send` (`apps/web/src/app/[locale]/book/send/route.ts`)
- Reads the form fields (`room, checkIn, checkOut, adults, children, pay, name, note, cur, via`) and calls `packages/core`:
  - `parseBookingRequest(fields, site, today)` returns the request or an error (`missing | dates | guests`). Plain TypeScript checks (no Zod; it is not installed and would be a new dependency). Rules: the room exists; check-in ≥ today; check-out > check-in; at most 30 nights; check-in ≤ today + 18 months; 1 ≤ adults; adults + children ≤ room `maxGuests`; the payment method is one the business accepts; name 1–80 characters after trim; note ≤ 500; control characters stripped.
  - `bookingMessage(request, view, labels)` builds the text (wording passed in from messages, so core stays free of next-intl).
  - `whatsAppLink(whatsapp, message)` or `mailLink(email, subject, body)`.
- **Success:** `303 See Other` to `https://wa.me/<digits>?text=…` or to `mailto:<email>?subject=…&body=…`.
- **Error:** `303` to `/book/error?reason=…` (no personal data in the URL).
- `Cache-Control: no-store`. **Nothing is stored. The route never logs the body or any field.** On an unexpected error it returns a generic error page without echoing input. POST keeps the details out of URLs and access logs. The redirect `Location` holds the message, but it goes only to the guest's browser.
- Only `wa.me` and `mailto:` redirects, built from the business's own data (no open redirect).

## Message (English; Kinyarwanda in rw.json, D-048)
```
Hello {business}! I would like to request:
Room: {room}
Dates: {Fri 11 Dec 2026} to {Mon 14 Dec 2026} ({3} nights)
Guests: {2} adults, {1} child
Quoted total: {USD 180} ({3} × {USD 60})
I would like to pay by: {MTN MoMo}
Name: {Anna Becker}
Note: {…}            ← only if given
```
Email: subject "Booking request: {room}, {Fri 11 Dec} to {Mon 14 Dec 2026}", with the same body. The total is a quote from the owner's own prices (nights × price, D-023); the lodge confirms.

## Data
- Read: rooms (id, name, price, maxGuests), contacts (WhatsApp, email), `bookingPayments`, `defaultCurrency`.
- **New business field:** `bookingPayments: ("lodge" | "momo" | "airtel" | "bank")[]` (D-045; demo: all four).
- **No guest data is stored or logged** (D-033, D-049). No booking code (that comes after NCSA, T1-Sent).

## Permissions
Public. The route writes nothing.

## Module switch
"Check availability" goes to `/book` when the business has rooms (Hotel/Lodge Starter). With no rooms, the sticky bar falls back to the plain WhatsApp link (today's behaviour) and `/book` returns 404. The booking inbox (the `booking` module after NCSA) replaces the WhatsApp/email delivery later; this page then posts to the inbox instead (D-044).

## Languages
book.* wording and the message lines are in the overview list. Room names use English fallback. The message is in the page's language.

## Acceptance criteria
1. Given `/book?room=volcano-view-double`, when it loads, then that room is picked.
2. Given a filled form and "Send by WhatsApp", when it is sent, then the browser is redirected (303) to `wa.me/<the lodge's digits>` with the message above prefilled, including room, dates, nights, guests, the quoted total in the chosen currency, payment choice and name.
3. Given "Send by email" and a business email, when it is sent, then the redirect is a `mailto:` with that subject and body.
4. Given check-out on or before check-in, or more guests than the room sleeps, when it is sent, then `/book/error` explains what to fix and its URL holds no guest details.
5. Given any submission, when it is handled, then nothing is written to disk or a database and nothing about the guest is logged (unit tests on core plus a route test with a spy on `console`).
6. Given scripts disabled, when the guest fills and sends the form, then it still works.
7. Given `/rw/book`, when the form is sent, then the message is in Kinyarwanda (with English fallback for missing room names).

Playwright: home sticky bar → /book; Check dates → /book?room=…; fill and send, with `wa.me` intercepted by `page.route` (no network) and the decoded text asserted; error path; JS-disabled run. Unit tests (Vitest): parse rules, nights and total, message lines in both currencies, mailto building.

## Out of scope
Availability calendar, booking code and private link, booking inbox, deposits, My booking, email sending from our side (all after NCSA, D-044/D-049). Rate limiting (nothing is stored; revisit with the inbox).

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
