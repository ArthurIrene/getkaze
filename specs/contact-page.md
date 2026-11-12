# Feature: Contact page (Field Journal)
Module: Templates   Priority: P1   Preset: both (built for Hotel/Lodge first)
Decisions: D-010/D-020 (WhatsApp click-to-chat), D-029, D-039/D-040, D-041, D-048. Part 2 of specs/field-journal-template.md ("Contact: no mockup yet. Must be designed before part 2 starts").
Conflicts: **no mockup exists**; the wireframe below is the design to approve.

Goal: A guest reaches the business in one tap (call, WhatsApp, email) and finds the way there.

Users: Guests (no login).

## Screens
At `/contact` and `/rw/contact`. Field Journal style: paper background, serif title, handwritten line, dashed rules, mono labels, the same map drawing as home "Find us".

**Wireframe (phone, 360 px)**
```
┌──────────────────────────────────────┐
│ Kinigi Hills        EN RW  RWF USD ☰ │  header (shared)
├──────────────────────────────────────┤
│ Contact                              │  h1, serif 44 px
│ we'd love to hear from you           │  handwritten, accent
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ (☎)  Call us                     │ │  tel:  (outlined, 56 px tall)
│ │      +250 700 000 000            │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ (💬) WhatsApp us                 │ │  wa.me + "Hello {name}, I have a question."
│ │      +250 700 000 000            │ │  (accent fill)
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ (✉)  Email us                    │ │  mailto: (only if the business has email)
│ │      hello@example.com           │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │   ~~~ drawn map, pin ~~~         │ │  whole card links to Google Maps
│ │        we're here!               │ │
│ │  ← Musanze 25'                   │ │
│ └──────────────────────────────────┘ │
│ [ Open in Google Maps ↗ ]            │  outlined button, same link
│                                      │
│ ADDRESS ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  mono label + dashed rule
│ Kinigi Sector, Musanze District      │
│                                      │
│ GETTING HERE ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│ • From Musanze town: 25 min by car   │  owner lines (location.directions)
│   on the Kinigi road.                │
│ • From Kigali: about 2 h 30.         │
│ • Ask us for a driver.               │
│                                      │
│ HOURS ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Reception every day, 6:00 to 22:00   │
│                                      │
│ PAYMENT ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Cash (RWF, USD), MTN MoMo, Airtel    │
├──────────────────────────────────────┤
│ footer: name · murakaza neza ·       │
│ © … · Privacy                        │
├──────────────────────────────────────┤
│ [   Check availability   ] [ ☎ ]     │  sticky bar (shared)
└──────────────────────────────────────┘
```
- Each contact button shows its label and the number or address beneath it (mono). The whole button is the link.
- No embedded map and no iframe. The map is the inline SVG drawing (as on home), and it and the button link to `location.mapUrl` (Google Maps).
- Desktop (≥ 768 px): two columns. On the left are the contact buttons, address, getting here, hours and payment. On the right is the map card, sticky at the top. Max width 1072 px.
- The home "Find us" section stays, with a new small link "All contact details →" to `/contact`.
- Motion: `fj-rise` on blocks (longhands). Off with reduced motion.

## Data (DATA.md, read only)
- Existing: contacts (phone, WhatsApp, optional email), `location.mapUrl`, `location.area`, `location.distanceNote`, hours and payment.
- **New:** `location.directions: LocalizedText[]` (owner lines; the block is hidden if empty). The demo lodge gets a fake `contacts.email` at `example.com` (a reserved test domain).
- Links are built in `packages/core`: `telLink`, `whatsAppLink` and a new `mailLink` (unit tested).

## Permissions
Public, read only.

## Module switch
Always on with the website. The email button is hidden when there is no email.

## Languages
Wording contact.* is in batch-1-guest-site.md. Owner texts (directions, hours, area) use English fallback.

## Acceptance criteria
1. Given the contact page, when the guest taps Call, then a `tel:` link with the owner's number opens.
2. Given the contact page, when the guest taps WhatsApp, then `wa.me/<digits>` opens with "Hello {name}, I have a question." prefilled.
3. Given the contact page, when the guest taps the map or "Open in Google Maps", then the owner's Google Maps link opens; the page has no iframe.
4. Given a business without email, when the page loads, then there is no email button.
5. Given `/rw/contact` and directions without Kinyarwanda, when it loads, then the English lines show.
6. Given 360 px and desktop widths, when the page loads, then nothing overflows sideways.

Playwright: tel, wa.me (decoded text), maps link, no iframe, hours visible, /rw/contact loads.

## Out of scope
A contact form (it would store guest data), embedded maps, opening hours per area (comes with the editor, DATA addendum).

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
