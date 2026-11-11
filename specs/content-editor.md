# Feature: Content editor (owner app)
Module: Content editor   Priority: P1   Preset: both
Goal: Owners keep their site right from a phone without calling us.
Users: Owner (P1); manager later.
Screens: mockups/canvas/O-Editor.dc.html
Data: business info, contacts, location, opening hours, sections, template and colors, rooms (types, units, prices, amenities), menu groups and dishes, activities, photos, translations, change log.
Permissions: owner edits all; platform admin support access is logged and visible to the owner.
Module switch: menu screens only when menu is on; rooms only for Hotel/Lodge.
Languages: owner app EN + RW; content fields EN required, RW and FR optional with "checked" status.
Acceptance criteria:
- Given a list row, when the owner taps it, then its edit form opens; "+" opens the same form empty.
- Given a saved change, when the owner taps Save, then the site shows it and the change log records who and when.
- Given a photo upload, when it finishes, then it is shrunk (target about 120 KB) and the owner picks where it shows.
- Given a Kinyarwanda suggestion, when it is unchecked, then it is marked draft until the owner taps "checked".
- Given business data, when another business's owner logs in, then they cannot see or change it (isolation test).
Out of scope: staff accounts, stock, reports.
Definition of Done: see BUILD_GUIDE.md §2 and the Chat 2 addendum.
