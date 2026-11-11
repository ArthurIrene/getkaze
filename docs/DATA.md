# DATA.md: Data concepts

Status: v1.0 (7 Nov 2026). Concepts only; tables are designed in the first Claude Code sessions.

## 1. Isolation
One database. Every record carries a `business_id`; row-level security means a business only sees its own rows. An automated test proves Business A can never read Business B. "Shared" means the same kind of data, not shared data or a shared domain.

## 2. Shared concepts
- **Business:** name, preset, venue style, domain and subdomain, plan, modules on, settings (logo, colors, template, languages, currency display, guest payment details).
- **People:** owner and staff logins, roles (several per person), activity log.
- **Catalog items:** anything sold: room type, dish, drink, service. Name, category, prices in RWF and USD (both manual), photos, translations (English required, others optional).
- **Spots:** places with a QR code: a table or a room.
- **Requests:** call waiter, request bill, room service; linked to a spot.
- **Orders:** items, status, source (QR, web, WhatsApp, pickup).
- **Customers:** name, phone, visits.
- **Sales and payments:** amount, method (cash, MoMo, Airtel, card), time. Guest money always goes to the business.
- **Stats:** clicks on call, WhatsApp, directions.
- **Content change log:** who changed what and when.

## 3. Hotel/Lodge-specific
- **Rooms:** physical units, each belonging to a room type.
- **Bookings:** dates, guests, room type, status.
- **Housekeeping status:** clean, dirty, occupied (P3).

## 4. Restaurant & Bar-specific
- **Order routing:** food to kitchen, drinks to bar.
- **Tabs:** open bill over an evening.
- **Stock:** ingredients and drinks, usage per sale (P3).

## 5. Platform side (ours)
- Client billing: modules, setup and monthly prices, discounts, payments, renewals.
- Subscription status: active, grace, add-ons paused, site paused, final notice (D-031).
- Grace period per client (default 14 days).
- Support notes.

## 6. Personal data (D-033)
- Phase 1 holds almost no guest data: business info, items, owner and staff logins. Bookings and orders go through WhatsApp and are not stored.
- Guest data (bookings, customers, orders) is stored only after NCSA status is settled for the chosen host.
- Roles: each business is the data controller for its guests; we are the processor. We are the controller for our own client records.
- Guests' rights (access, correction, deletion, portability) supported through the editor and export.

## 7. Change rules
- Data changes only add, never remove or rename (D-021).
- Owned clients get a copy of their rows.
- Backups daily, kept 30 days, stored per data-location rules.

## Chat 2 addendum (2026-11-10)
- **Business:** property style (lodge, town hotel, guesthouse) or venue style; template; color set (day, night, auto); accent from safe palette; section order and visibility; opening hours per area (reception, restaurant) with closed days; deposit rules; accepted payment methods; delivery on/off, zone and fee; order-ahead limit (days).
- **Catalog items:** group (owner-defined, ordered, hideable); prep minutes; notice hours; vegetarian flag; sold-out-until time; today-only flag; translations per field with "checked" status; "Ask us to arrange" flag for activities.
- **Rooms:** room types with number of units (for availability), max guests, amenities, breakfast included.
- **Availability:** per room type and date: booked count, blocked by owner (no guest data).
- **Photos:** file, size, places shown (hero, room, dining room, host, gallery), caption per language.
- **Bookings (after NCSA):** code, private link token, room type, dates, guests, total, payment method, deposit, payment status, update channel (email/WhatsApp), status history, messages, requested extras.
- **Orders (after NCSA for stored orders):** source (QR spot or web), type (pickup, delivery, table), date and time, party size, address for delivery.
- **Platform:** compliance gate state and authorization number; translation strings and suggestions.
