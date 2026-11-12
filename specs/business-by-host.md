# Feature: Business by host (subdomain routing and fallback)
Module: Platform core   Priority: P1   Preset: both
Decisions: D-006 (clients own their domain), D-035 (Cloudflare and client domains at G2; no Vercel-only features), D-053 (getkaze.vercel.app shows the latest staging), D-029, D-054 (noindex until G2).
Conflicts: overview point 8 (path fallback, and the demo at the bare host).

Goal: Each business is served at its own address (subdomain now, its own domain at G2), with one codebase and no per-client code.

## Host rules (`packages/core` `parseHost(host, config)`, unit tested)
Config: `APP_ROOT_DOMAIN` (unset now; e.g. `getkaze.rw` later), `PLATFORM_HOSTS` (default `getkaze.vercel.app`, `localhost`, `127.0.0.1`, and Vercel preview hosts matching `*.vercel.app`) and `DEMO_SITE_SLUG`.
| Host | Result |
|---|---|
| `<slug>.<APP_ROOT_DOMAIN>` (one label, valid slug, not reserved) | site by slug |
| `www.<APP_ROOT_DOMAIN>` or the bare `<APP_ROOT_DOMAIN>` | platform (marketing later; for now the demo) |
| a platform host with path `/s/<slug>/…` | site by slug (**the fallback before a domain exists**) |
| a platform host with any other guest path (`/`, `/rooms`, …) | site `DEMO_SITE_SLUG` (keeps getkaze.vercel.app on the demo, D-053) |
| a platform host with `/login`, `/auth/*`, `/owner`, `/admin` | platform screens (these exist only on platform hosts) |
| any other host | custom domain: a lookup by exact `custom_domain` (stored now, used at G2) |
| an invalid host (IP outside the list, garbage, too long) | unknown → 404 |

The port is ignored and the host lowercased. `/rw` language prefixes work in every case: `/s/<slug>/rw/rooms` on the fallback, `/rw/rooms` on a subdomain.

## How (no per-request database call in middleware)
- **Middleware** (the existing next-intl middleware, extended) parses the host and path with `parseHost` and **rewrites** to the internal route `/[locale]/_site/[slug]/…` (or `/[locale]/_host/[host]/…` for custom domains). That internal path is not reachable from outside (direct requests to `/_site` return 404). Platform paths are untouched.
- **Pages** (`app/[locale]/_site/[slug]/…`, the same Field Journal pages as Batch 1) call `getSite({ slug })` or `getSite({ host })`. If it returns `null` (unknown, draft, paused), `notFound()` gives a **clean 404**: a plain platform page "This site is not available", `noindex`, no business data, HTTP 404.
- **Links inside a site** keep its prefix: core `sitePath(page, locale, mode)` builds `/rooms`, `/rw/rooms` or `/s/<slug>/rw/rooms`. Header, footer, the booking form action, canonical, sitemap and the manifest all use it.
- **`siteBaseUrl(business, config)`:** `https://<slug>.<root>` when a root is set, otherwise `https://getkaze.vercel.app/s/<slug>`. The demo lodge's canonical becomes `https://getkaze.vercel.app/s/kinigi-hills`, and the bare host stays the demo with that canonical (no duplicate indexed copies; noindex stays anyway).
- **Sitemap, robots and manifest** are per host (they read the site for that host). The platform host's sitemap lists the demo only.

## Data
`businesses.slug` and `businesses.custom_domain`, read through `get_published_site(p_slug, p_host)` (row-level-security.md).

## Acceptance criteria
1. Given `parseHost`, when given each row of the table above, then it returns that result (unit tests, including the port, upper case, reserved slugs, preview hosts and IPs).
2. Given `getkaze.vercel.app/s/kinigi-hills/rooms`, when loaded, then the demo rooms page shows and every link on it keeps `/s/kinigi-hills`.
3. Given a subdomain host (Playwright sends `Host: kinigi-hills.getkaze.test` with `APP_ROOT_DOMAIN=getkaze.test` in CI), when `/rw/contact` is loaded, then the Kinyarwanda contact page of that business shows with links without `/s/`.
4. Given an unknown slug, a draft business or an unknown host, when loaded, then the response is a 404 page with no business data and noindex.
5. Given the bare `getkaze.vercel.app/`, when loaded, then the demo home shows (D-053), and its canonical points to the demo's `siteBaseUrl`.
6. Given a direct request to `/_site/kinigi-hills`, when loaded, then 404.

## Out of scope
DNS and the wildcard certificate for `*.getkaze.rw` (Cloudflare at G2), custom domain onboarding (G2), a platform marketing page.

## Definition of Done
BUILD_GUIDE.md §2.
