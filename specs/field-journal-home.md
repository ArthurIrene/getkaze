Superseded by specs/field-journal-template.md.

# Feature: Field Journal home page
Module: Templates   Priority: P1   Preset: Hotel/Lodge
Goal: A lodge looks designed and bookable on a cheap phone, even with few photos.
Users: Guests (no login). Owner edits content in the editor.
Screens: mockups/canvas/T1-Home.dc.html; motion: mockups/motion-previews/field-journal-motion-preview.html
Data: business settings, sections (order, visibility), catalog items (rooms, dishes, activities), photos (places), opening hours, reviews (manual), contacts.
Permissions: read-only public page; owner edits via editor.
Module switch: menu section only when menu is on; ordering buttons only with ordering add-on.
Languages: all section titles and buttons EN + RW (FR optional); owner content falls back to English.
Acceptance criteria:
- Given a business with sections switched off, when the page loads, then those sections do not render and order follows the owner's settings.
- Given no photo for a spot, when the page loads, then the drawing for that spot shows instead.
- Given RWF/USD switch, when the guest taps USD, then all prices on the page show the owner's USD prices.
- Given reduced motion or data saver, when the page loads, then no animation runs and all content is visible.
- Given slow 3G, when the page loads, then first view is within about 300 KB and photos load as they come into view.
Out of scope: booking inbox, ordering checkout, desktop layout.
Definition of Done: see BUILD_GUIDE.md §2 and the Chat 2 addendum.
