# FEATURES.md: Modules

Status: v1.0 (7 Nov 2026). P1 = first milestone, P2 = after first paying client, P3 = when clients ask or pay. Everything is designed now; only the core is built (D-019). New modules arrive switched off for existing clients (D-021).

## 1. Shared modules
| Module | Features | Priority |
|---|---|---|
| Business settings | Name, logo, colors, fonts, contacts, map location, hours, languages, currency display, guest payment details | P1 |
| Templates | 3 templates reading the same data; sections on or off | P1 |
| Content editor | Phone-friendly forms: info, photos, items, prices (RWF and USD), translations, sections, template and colors; photo compression; safe limits; change log | P1 |
| Platform admin (ours) | Create businesses, preset, module switches, subdomain and domain, billing record, discounts, grace period per client, overdue list with one-tap WhatsApp reminders, logged support access | P1 (billing and overdue list P1/P2) |
| Module switches | On or off per business; locked modules shown as upgrades | P1 |
| Click stats | Calls, WhatsApp taps, direction requests; monthly summary | P1 |
| Languages | English required; Kinyarwanda and French optional; English fallback; a language gets its own indexed pages only when translated | P1 |
| Privacy notice | Per client site and our own site | P1 |
| Customers | Repeat guest list; message past guests | P2 |
| Staff management | Add staff by name and phone, PIN, roles, instant disable, action log | P3 upsell (basic manager login comes with orders page) |
| Stock | Items, quantities, usage per sale, low-stock alerts | P3 upsell |
| Sales and reports | Daily sales, payment method, top items, period reports | P3 upsell |
| Payments | Level 1: show the business's own MoMo/Airtel details, staff confirm by hand. Level 2: one licensed aggregator, per-business sub-merchant, direct payout | Level 1 P2; Level 2 when a client needs it |

## 2. Hotel/Lodge modules
| Module | Features | Priority |
|---|---|---|
| Room list | Room types, photos, prices in RWF and USD, amenities | P1 (Starter) |
| Booking requests | Guest picks dates and room type; request sent as prefilled WhatsApp message | P1/P2 |
| Booking calendar | Manager marks rooms booked or free; booking status | P2 |
| Guest requests (QR in room) | Room service, towels, call reception | P3 |
| Housekeeping | Clean, dirty, occupied | P3 |
| Check-in | Arrival and departure record | P3 |
| Channel manager sync | Calendar sync with booking platforms | Postponed |

## 3. Restaurant & Bar modules
| Module | Features | Priority |
|---|---|---|
| Menu / drinks list | Categories, items, photos, prices in RWF and USD | P1 (Starter) |
| WhatsApp orders | Guest picks items on QR or web menu; order sent as prefilled WhatsApp message (free click-to-chat); table orders and order-ahead pickup | P2 (first restaurant slice) |
| QR table requests | Call waiter, request bill | P2 |
| Manager orders page | Orders in a dashboard only the manager sees; live status | P2 |
| Staff order flow | Waiter, kitchen, bar views; food to kitchen, drinks to bar | P3 |
| Tabs | Open bill over an evening | P3 |

Order-ahead at launch: restaurant confirms by WhatsApp, guest pays on pickup.

## 4. Order flow steps (D-020)
1. WhatsApp orders (no staff screens).
2. Manager-only orders page (PWA).
3. Full staff flow with roles (web first; native staff app later, D-037).

## 5. Low-bandwidth behaviour (D-028)
- Guest pages server-rendered, almost no JavaScript, compressed images, menu page about 300 KB, tested on slow 3G.
- PWA caching so screens open fast on weak signal.
- Offline banner for staff; unsent actions retry automatically.
- WhatsApp as natural backup for early orders.
- Full offline mode postponed.

## 6. Dependencies
- Everything depends on business settings, module switches, templates.
- WhatsApp orders depend on menu.
- Manager orders page depends on orders and a manager login.
- Staff order flow depends on manager orders page and staff management.
- Stock and reports depend on orders or sales records.
- Booking calendar depends on booking requests.
- Guest requests depend on spots (QR per table or room).
- Payments Level 2 depends on aggregator choice and approvals.
- Storing guest data (bookings, customers) depends on NCSA status (D-033).
- Native staff app depends on staff order flow and `packages/core`.

## 7. Later (needs outside approval or time)
- WhatsApp Business API (automated replies and reminders): Meta approval.
- Payments Level 2: aggregator onboarding per business.
- SMS login codes: paid SMS provider.
- Native staff app (Expo): when time allows.

## Chat 2 addendum (2026-11-10)
| Module / feature | Change | Priority |
|---|---|---|
| Templates | Field Journal at launch; Imigongo (Phase 2, restaurants); Cinematic (with photo shoot) (D-039, D-040) | P1 / later |
| Home sections | Hero, quick facts, life strip, rooms, at our table, around us, host, reviews, find us; facilities and meetings & events for town hotels; owner toggles and reorders (D-042) | P1 |
| Booking requests | Check availability form; launch delivery via guest WhatsApp/email (D-044) | P1 |
| Availability calendar | Free/partly/full per room type; owner blocks rooms booked elsewhere; no guest data | Weeks 3–5 |
| Booking inbox | Accept/decline/suggest dates, booking code + private link, My booking (status, payment, messages, "help with" extras), Mark as paid, email + WhatsApp-tap confirmations (D-044, D-045) | Weeks 3–5, locked by gate (D-049) |
| Menu (Starter) | Basic menu display for hotels too; groups owner-editable (add, rename, reorder, hide) | P1 |
| Menu + WhatsApp orders | QR spot detection; pick-up / delivery (off by default) / eat here + table reservation; day and time picker by prep time and notice; step-by-step checkout (D-046) | P2 |
| Today's menu | Sold out until next opening; today-only specials (D-047) | P2 |
| Languages | EN + RW side by side, draft badge, owner "suggest a word", admin Translations screen (D-048) | P1 |
| Platform admin | Compliance gate; template neighbour check; discounts with 70% floor; overdue timeline (D-049) | P1 |
| Owner app | Every row opens a form; photo upload auto-shrink and placement; locked modules with "Ask to switch on" (D-050) | P1 |
| Backlog | Events module, rotating-badge scroll scene, 24-hour timeline, "Kitchen busy +15 min", channel sync | Later |

## Build status (Batch 1, 2026-11-12, demo data only)
- **Room list:** built (Field Journal rooms page: gallery, prices in RWF and USD, amenities, stay info).
- **Booking requests:** launch mode built (`/book` form → the guest's own WhatsApp or email, nothing stored; D-044). Availability, booking code and inbox wait for NCSA (D-049).
- **Privacy notice:** per client site built, **draft pending lawyer review**. Our own site's notice is not built yet.
- **Website basics:** contact page, site menu, SEO basics (noindex until G2), PWA manifest (no service worker), speed pass with CI weight and slow-3G checks.
