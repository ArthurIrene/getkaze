# MOCKUPS.md: Approved screens (Chat 2, 10 Nov 2026)

Live canvas (private to the owner until shared): https://claude.ai/artifact/7J4bZcbAg6rygrV5iPdzsU
Motion previews (open on a phone and scroll):
- Field Journal: https://claude.ai/artifact/CkPY1nP91MAVQdkYt4QsBr
- Imigongo: https://claude.ai/artifact/GFw2RCG7mW7GXVn8bgB83J
Local copies: /mockups/canvas (canvas source files) and /mockups/motion-previews (standalone pages).
All data is fake. Photo spots are placeholders.

## Guest site, Template 1: Field Journal (launch template)
| File | Screen | Key points |
|---|---|---|
| T1-Home | Home | Illustrated hero (built version: pinned full screen at the top, shrinks in place to the card, then scrolls away, with a scroll cue; see specs/field-journal-template.md), rotating "Chat with us" stamp, facts (tap for detail), sliding scrapbook, rooms, at our table + fireside room, around us (flip cards), host, reviews, find us, sticky "Check availability". Night colors. |
| T1-Rooms | Rooms | Swipe gallery per room, name, price, amenity icons, "More +", "Check dates", folded check-in/children/payment. |
| T1-Booking | Check availability | Room cards, calendar with booked days, guests, total, payment choice, details, send. Tweak `launchMode`: own WhatsApp/email vs inbox. |
| T1-Sent | Request sent | Stamp, booking code + QR, emailed link, timeline (pay the way you chose). After NCSA only. |
| T1-MyBooking | My booking | Code + last 4 digits lookup with how-to, confirmed state, payment card (deposit due → checking → paid, receipt), check-in QR, "We can help with" extras, messages. After NCSA only. |
| T1-Menu | Menu + ordering | Groups, today's pick, dish details on tap, VEG, prep time; ordering add-on (Tweak `ordering`, `entry`): QR table/room vs website; checkout steps: order → how (pick up / delivery / eat here) → day, part of day, time → sent. Sold-out dishes hidden. |

## Owner app
| File | Screens |
|---|---|
| O-Editor | Edit site hub (85% complete), Today's menu (sold out, today-only specials), Menu groups (reorder, hide, add), Dish form (EN+RW side by side, prices, prep time, switches), Rooms list and form (units for availability, amenities), Business info (contacts, map pin, opening hours per area), Photos (grid, detail, add with auto-shrink), Around us (list, activity form), Sections (order, show/hide), Look & colors (template, color set, accent), Languages (progress). EN/RW. |
| O-Dashboard | Home (today card, click stats, weekly chart, locked modules), Bookings (filters, list), Booking detail (accept → confirmed → mark paid, WhatsApp taps, messages), Availability calendar (block rooms). EN/RW. |

## Platform admin and logins
| File | Screens |
|---|---|
| A-Admin | Clients (KPIs, gate banner, filters), New business (preset, style, template neighbour check, demo switch), Client detail (module switches with prices, discount floor, billing, support access, export), Billing (overdue timeline, reminders, mark paid), Data protection gate. |
| L-Logins | Owner (email + password), Staff (phone + PIN, lockout after 5 tries), Platform admin (password + 2FA). Tweak `screen`. |

## Later templates (first versions, to finish after launch)
| File | Screen |
|---|---|
| T2-Home | Imigongo home v2 (restaurant & bar demo): photo hero, two actions, tonight card, popular dishes, visit us, reviews. Tweak `palette`. |
| T3-Home | Cinematic home (town hotel demo): six full-screen scenes with story bars, "All info" list fallback. |

## Still to design (generate later)
Field Journal desktop views, open menu and language list, town-hotel variant; Imigongo and Cinematic remaining pages; P2 medium-detail screens (manager orders page, QR table requests); P3 sketches (one screen per staff role, staff, stock, reports); shared states (empty, loading, offline, error, locked).
