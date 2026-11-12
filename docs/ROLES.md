# ROLES.md: Roles and permissions

Status: v1.0 (7 Nov 2026). Roles are permission settings, not fixed code. Each preset turns on a default set; the owner can adjust.

## 1. Roles by phase
- **P1 (website kit):** Owner, Platform admin (us).
- **P2 (manager orders page):** Manager.
- **P3 (full operations):** Receptionist, Housekeeping, Waiter, Kitchen, Bar.

## 2. Default permissions
| Role | Can do | Preset |
|---|---|---|
| Owner | Everything: settings, prices, content, staff, reports, billing view, data export | Both |
| Manager | Menu and rooms, orders, bookings, stock; staff only if the owner allows | Both |
| Receptionist | Bookings, guests, room requests | Hotel/Lodge |
| Housekeeping | Room cleaning status, room requests | Hotel/Lodge |
| Waiter | Own tables, orders, waiter calls, bills | Restaurant & Bar |
| Kitchen | Food orders: accept, mark ready | Restaurant & Bar |
| Bar | Drink orders: accept, mark ready | Restaurant & Bar |
| Platform admin (us) | Create clients, switch modules, billing, support access (logged and visible to owner) | All |

## 3. Login rules (D-022)
- Staff have their own smartphones (assumption).
- Owner adds staff by name and phone number, picks role(s); staff set a PIN.
- No SMS codes at launch; later on client demand.
- Owner can disable a login instantly.
- One person can hold several roles.
- PIN lockout after repeated failed attempts (D-034).
- Platform admin uses two-factor login with a TOTP authenticator app; admin screens and admin data require it (aal2) (D-034, D-060).
- Shared-device mode later, if a business provides a tablet.
- Owner login: email and password (Supabase Auth), invite only, no public sign-up, no SMS; password reset by email (D-059).

## 4. Devices
- Owners and managers: web dashboard (PWA).
- Staff: web (PWA) first; native Expo app later (D-037).
- Guests: web only, no login needed for QR and ordering.

## 5. Fixed rules
- Every action logged with person and time (D-011).
- Our support access is visible to the owner.
