# Demo photos: shot list (Kinigi Hills Lodge demo, Field Journal)

Status: built (branch `feature/demo-photos`, specs/demo-photos.md). This list matches what is in the repo.

## Sources and licences
- Openverse (api.openverse.org), Wikimedia Commons source only; each licence and author checked on the Commons file page.
- **Only CC0, Public Domain Mark or CC BY.** Never CC BY-SA, NC or ND. CC0 and Public Domain preferred.
- No identifiable faces (guests, staff, trackers or visitors, wildlife photos included), no brand logos, no photo that shows a specific real hotel or lodge (the demo lodge is fake).
- Every photo is listed in CREDITS.md and, on the site, on the "Photo credits" page (CC BY needs visible credit).

## Files
- Folder: `apps/web/public/demo-photos/<name>/<width>.webp` (served by the app; seed data refers to it as a static photo, `media.source = 'static'`, seed-only).
- Sizes: the editor's rules from `packages/core` (`photoLimits`, `widthsFor`): 480, 960 and 1440 px WebP, no upscaling, quality stepped down to 40 / 80 / 160 KB, every file under 300 KB, EXIF dropped. The hero comes from a 1920 px source (all three widths); the others from 1280 px sources (480 and 960), which is all they ever show at.
- Made by `node scripts/demo-photos.mjs <originals> <manifest.json>`, which also writes `apps/web/src/data/demo-photos.ts`.

| # | Name | Used on | Licence |
|---|---|---|---|
| 1 | hero-volcanoes | Home hero | CC BY 2.0 |
| 2 | life-coffee | Life at the lodge: 5 a.m. coffee | CC0 |
| 3 | life-fire | Life at the lodge: evening fire | CC0 |
| 4 | life-garden | Life at the lodge: the garden | CC BY 2.0 |
| 5 | life-trail | Life at the lodge: the forest trail (was "Bisoke stars") | CC BY 2.0 |
| 6 | room-garden-single-bed | Garden Single | CC BY 2.0 |
| 7 | room-garden-single-view | Garden Single | CC BY 2.0 |
| 8 | room-garden-double-bed | Garden Double | CC BY 2.0 |
| 9 | room-volcano-view | Volcano View Double | CC BY 4.0 |
| 10 | room-volcano-view-2 | Volcano View Double | CC BY 2.0 |
| 11 | room-cottage-fire | Family Cottage | CC BY 4.0 |
| 12 | dining-fireside | At our table / the fireside room | CC BY 4.0 |
| 13 | around-gorillas | Around us: gorilla trekking | CC BY 2.0 |
| 14 | around-lakes | Around us: Twin Lakes | CC BY 4.0 |

## Skipped (and why)
- Host portrait (old #21): it would show a face. The host keeps the drawing.
- Menu dishes (old #11–15: breakfast, brochettes, tilapia, isombe, coffee): no menu page yet. Dishes keep their drawings.
- Golden monkeys, Musanze Caves, cultural village: no suitable CC0 / PD / CC BY photo without people; they keep their drawings.
- Room bathrooms: no suitable photo; rooms show one or two photos.
- Gallery: photos are stored, not shown (no gallery section).
