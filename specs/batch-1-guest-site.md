# Batch 1: guest site (overview)
Status: **specs written, waiting for one approval** (D-052). Branch `feature/batch-1-guest-site`.
Checked against docs/DECISIONS.md (D-001 to D-058), docs/MOCKUPS.md, docs/DATA.md, docs/COMPLIANCE.md, docs/FEATURES.md §5 and specs/field-journal-template.md.

## Conflicts and choices that need your answer (top)
1. **Batch 0 happy-path test changes.** `e2e/home.spec.ts` asserts that "Check availability" is a `wa.me` link. D-044 says "Check availability" opens the request form, so the sticky bar now goes to `/book`, and the `wa.me` redirect happens when the form is sent. I will change that one assertion to "links to /book". The new booking test then checks the full path: form, server redirect, then `wa.me` with the prefilled message. Nothing is skipped, and the hero tests stay as they are. **Please confirm.**
2. **The booking form passes guest details through our server** (feature 6). Name, dates and the optional note reach our server route for a moment while it builds the message. Nothing is stored, and nothing about the guest is logged. The form uses POST so the details never appear in a URL or an access log. This is still *processing* personal data, on a host outside Rwanda (Vercel during the build), even though nothing is *stored* (D-033 only restricts storage). I added it to the lawyer questions in privacy-notice.md. The no-server alternative is a GET form straight to `wa.me` with a single editable message box, which is less structured. **I recommend the server route, as you asked.**
3. **D-044 asks for "dates with availability".** There is no availability data until Batch 2, and native date inputs cannot grey out booked days. So in this batch the form only sends a request: the guest types the dates, and the lodge confirms. The availability calendar comes with the booking system (D-044, weeks 3–5).
4. **The privacy notice body is English only for now.** Its title, headings and the "draft" line are in Kinyarwanda, and the body falls back to English on `/rw` (D-029 fallback). Kinyarwanda legal text should be translated from the lawyer-approved English, not drafted by me. **Please confirm.**
5. **Remove the `NEXT_LOCALE` cookie.** next-intl sets it today (`localeDetection` is already off, so the cookie has no use). With `localeCookie: false` the guest site sets no cookies at all, and the privacy notice can say so. The change is one line in `apps/web/src/i18n/routing.ts`.
6. **Navigation** (no design yet; MOCKUPS.md "Still to design"). I propose a `<details>` menu, no JavaScript (site-navigation.md). The EN/RW pills stay in the header (approved in PR #2); the mockup shows a single "EN ▾" pill instead.
7. **Placeholder PWA icons.** PNGs are made with `ImageResponse` from `next/og`, which is built into Next.js, so it is not a new dependency. It is not Vercel-only. It still needs a check on Cloudflare Workers when production moves (gate G2). An SVG icon is the fallback.
8. **A visible "Draft" line on the privacy page** while the platform's privacy text is unreviewed (`platform.privacyNotice.status = "draft"`). You asked for the draft mark in the spec; I also show it on the page so a demo never presents unreviewed legal text as final. **Say if you want it hidden.**
9. **New data fields, all additive and on demo data only**, with no database yet: `baseUrl`, `propertyStyle` (D-043), `location.address`, `location.directions`, `stay` (check-in and check-out times, notes, breakfast included), `roomsLine`, room `amenities`, `bookingPayments` (D-045: accepted methods are an owner setting) and a demo `email` at `example.com`.

No other conflicts found. Nothing touches Supabase. No new dependencies.

## Features (one spec each, one commit group each)
| # | Spec | Pages / files |
|---|---|---|
| 1 | [rooms-page.md](rooms-page.md) | `/rooms`, home room cards and "All rooms" |
| 2 | [contact-page.md](contact-page.md) | `/contact` |
| 3 | [site-navigation.md](site-navigation.md) | header menu, language links per page, footer links |
| 4 | [privacy-notice.md](privacy-notice.md) | `/privacy`, footer "Privacy" |
| 5 | [seo-basics.md](seo-basics.md) | titles, descriptions, canonical, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD |
| 6 | [booking-request.md](booking-request.md) | `/book`, `POST /book/send` |
| 7 | [pwa-manifest.md](pwa-manifest.md) | `manifest.webmanifest`, placeholder icons, theme colour |
| 8 | [speed-pass.md](speed-pass.md) | weight check on every page, slow-3G timing report |

Build order: 3 (navigation; the shared page shell the other pages use) → 1 → 2 → 6 → 4 → 5 → 7 → 8.

## Applies to every page
- English and Kinyarwanda (`/…` and `/rw/…`). Owner texts use English fallback (D-029). Template wording lives in `messages/en.json` and `rw.json`; a missing key falls back to English.
- Phone first at 360 px, then desktop (768 px and wider). Day and night colours from the system setting. No sideways overflow.
- Server components only: **no client JavaScript of our own**, motion from the light kit (D-041), off with reduced motion.
- Budget: first view of each page ≤ 300 KB transferred (the weight check fails above that). JS is reported per page and flagged in BATCH_LOG above 160 KB gzipped.
- `noindex` stays on every page until G2 (D-054).
- A Playwright happy path for each new page. The hero tests stay unchanged.
- The CSS rule from CLAUDE.md: animation longhands only with scroll-driven timelines.

## New Kinyarwanda wording to check (D-048)
These are all drafts by me and need a native-speaker check.

| Key | English | Kinyarwanda draft |
|---|---|---|
| nav.menu | Menu | Ibikubiyemo |
| nav.close | Close | Funga |
| nav.home | Home | Ahabanza |
| nav.rooms | Rooms | Ibyumba |
| nav.contact | Contact | Twandikire |
| nav.privacy | Privacy | Ubuzima bwite |
| rooms.title | Rooms | Ibyumba |
| rooms.allRooms | All rooms → | Ibyumba byose → |
| rooms.perNight | per night | ku ijoro |
| rooms.breakfast | breakfast incl. | ifunguro rya mu gitondo ririmo |
| rooms.number | Nº {n} | Nº {n} |
| rooms.more | More + | Ibindi + |
| rooms.less | Less − | Bike − |
| rooms.checkDates | Check dates | Reba amatariki |
| rooms.sleeps | Sleeps {n} | Icyumba cy'abantu {n} |
| rooms.stayInfo | Check-in, children & payment | Kwinjira, abana no kwishyura |
| rooms.checkInOut | Check-in from {in} · check-out by {out} | Kwinjira guhera {in} · gusohoka bitarenze {out} |
| amenity.* | 1 bed · queen · 2 rooms · shower · Wi-Fi · view · fire · desk · {n} guests | uburiri 1 · uburiri bunini · ibyumba 2 · douche · Wi-Fi · ahantu heza ho kureba · iziko · ameza yo kwandikiraho · abantu {n} |
| contact.title | Contact | Twandikire |
| contact.line | we'd love to hear from you | twishimiye kukwakira |
| contact.callUs | Call us | Duhamagare |
| contact.whatsappUs | WhatsApp us | Twandikire kuri WhatsApp |
| contact.emailUs | Email us | Twandikire kuri imeli |
| contact.helloMessage | Hello {name}, I have a question. | Muraho {name}, mfite ikibazo. |
| contact.openMaps | Open in Google Maps | Fungura muri Google Maps |
| contact.address | Address | Aderesi |
| contact.hours | Hours | Amasaha |
| contact.gettingHere | Getting here | Uko wahagera |
| contact.payment | Payment | Kwishyura |
| book.title | Check availability | Reba ibyumba bihari |
| book.line | takes a minute | bifata umunota umwe |
| book.room | 1 · Room | 1 · Icyumba |
| book.dates | 2 · Dates | 2 · Amatariki |
| book.checkIn | Check-in | Kugera |
| book.checkOut | Check-out | Kugenda |
| book.guests | 3 · Guests | 3 · Abashyitsi |
| book.adults | Adults | Abakuru |
| book.children | Children | Abana |
| book.pay | 4 · How you'd like to pay | 4 · Uko wifuza kwishyura |
| book.details | 5 · Your details | 5 · Umwirondoro wawe |
| book.name | Your name | Izina ryawe |
| book.note | Note (optional) | Icyo wongeraho (si ngombwa) |
| book.notePlaceholder | Late arrival? Permits? A driver? | Uzahagera utinze? Impushya? Umushoferi? |
| book.send | 6 · Send your request | 6 · Ohereza icyifuzo cyawe |
| book.sendWhatsApp | Send by WhatsApp | Ohereza kuri WhatsApp |
| book.sendEmail | Send by email | Ohereza kuri imeli |
| book.sendNote | Goes straight to {name} from your own WhatsApp or email. Nothing to pay now; they reply with payment details. | Bijya kuri {name} biturutse kuri WhatsApp cyangwa imeli yawe. Nta kwishyura ubu; bazagusubiza baguha uburyo bwo kwishyura. |
| book.pay.lodge | At the lodge (cash or card) | Kuri lodge (amafaranga cyangwa ikarita) |
| book.pay.momo | MTN MoMo | MTN MoMo |
| book.pay.airtel | Airtel Money | Airtel Money |
| book.pay.bank | Bank transfer | Kohereza muri banki |
| book.error.title | Something to fix | Hari icyo gukosora |
| book.error.dates | Check-out must be after check-in, from today on. | Itariki yo kugenda igomba kuba nyuma y'iyo kugera, uhereye uyu munsi. |
| book.error.guests | This room sleeps up to {n}. | Iki cyumba cyakira abantu bagera kuri {n}. |
| book.error.missing | Please pick a room, dates and your name. | Hitamo icyumba, amatariki n'izina ryawe. |
| book.error.back | Use your browser's back button to fix it; your answers are kept. | Kanda "subira inyuma" muri mushakisha yawe; ibyo wujuje biracyahari. |
| book.msg.* | Hello {name}! I would like to request: … (lines in booking-request.md) | Muraho {name}! Ndifuza: … (lines in booking-request.md) |
| privacy.title | Privacy notice | Itangazo ryerekeye ubuzima bwite |
| privacy.draft | Draft, pending legal review | Inyandiko y'agateganyo, itegereje isuzuma ry'umunyamategeko |
| privacy.updated | Last updated {date} | Byavuguruwe ku wa {date} |
| privacy headings | Who we are · What this site collects · Booking requests · Where data is kept · Your rights · Contact | Abo turi bo · Ibyo uru rubuga rukusanya · Ibyifuzo byo gufata icyumba · Aho amakuru abikwa · Uburenganzira bwawe · Twandikire |
