# Kinyarwanda glossary (key terms)

Status: **every entry is DRAFT** until the owner checks it (D-048). When a term is checked, change its status to `checked` and use the same word everywhere. Wording lives in `apps/web/messages/rw.json`; see docs/how-to-edit-wording.md. From Batch 3 the Wording editor in platform admin does the same job (D-061).

Rules:
- One English term, one Kinyarwanda word. If a term changes here, change every key that uses it.
- Keep brand and payment names as they are: WhatsApp, MTN MoMo, Airtel Money, Google Maps, RWF, USD.
- Prefer plain everyday words over formal ones; guests and owners read on a phone.

| English | Kinyarwanda (draft) | Used in | Status |
|---|---|---|---|
| Home (page) | Ahabanza | Nav.home | draft |
| Rooms | Ibyumba | Nav.rooms, Rooms.title, FieldJournal.rooms | draft |
| Room | Icyumba | Book.room, Book.msg.room | draft |
| Contact | Twandikire | Nav.contact, Contact.title | draft |
| Menu (site menu, not food) | Ibikubiyemo | Nav.menu | draft |
| Check availability | Reba ibyumba bihari | Nav.book, FieldJournal.check, Book.title | draft |
| Check dates | Reba amatariki | Rooms.checkDates | draft |
| Booking request | Icyifuzo cyo gufata icyumba | Book.msg.subject, Privacy headings | draft |
| Check-in | Kugera (form) · Kwinjira (rooms fold) | Book.checkIn, Rooms.checkInOut | draft: **two words in use, pick one** |
| Check-out | Kugenda (form) · Gusohoka (rooms fold) | Book.checkOut, Rooms.checkInOut | draft: **two words in use, pick one** |
| Night (per night) | Ijoro (ku ijoro) | Rooms.perNight, Book.msg.dates | draft |
| Adults | Abakuru | Book.adults, Book.msg.guests | draft |
| Children | Abana | Book.children, Rooms.stayInfo | draft |
| Guests | Abashyitsi | Book.guests, Book.msg.guests | draft |
| Breakfast included | Ifunguro rya mu gitondo ririmo | Rooms.breakfast | draft |
| Price / quoted total | Igiciro / Igiciro cyagereranyijwe | Book.msg.total | draft |
| Payment / pay | Kwishyura | Contact.payment, Book.pay | draft |
| Bank transfer | Kohereza muri banki | Book.method.bank | draft |
| Deposit | Avansi | Book.methodNote.* | draft |
| Call | Hamagara | FieldJournal.call | draft |
| Directions | Inzira | FieldJournal.directions | draft |
| Address | Aderesi | Contact.address | draft |
| Hours | Amasaha | Contact.hours | draft |
| Email | Imeli | Book.sendEmail, Contact.emailUs | draft |
| Your name | Izina ryawe | Book.name | draft |
| Send | Ohereza | Book.sendWhatsApp, Book.sendEmail | draft |
| Privacy / privacy notice | Ubuzima bwite / Itangazo ryerekeye ubuzima bwite | Nav.privacy, Privacy.title | draft |
| Personal data | Amakuru bwite | Seo.privacyDescription | draft |
| Lodge | Lodge (kept) | Seo.style.lodge | draft |
| Hotel | Hoteli | Seo.style.townHotel | draft |
| Guesthouse | Inzu y'abashyitsi | Seo.style.guesthouse | draft |
| Welcome | Murakaza neza | FieldJournal.welcome, stamp | draft |
| Owner (platform screens, Batch 2) | Nyir'ubucuruzi | owner screens | draft |
| Sign in / Sign out (Batch 2) | Injira / Sohoka | login screens | draft |
| Password (Batch 2) | Ijambo ry'ibanga | login screens | draft |

## Platform screens (Batch 2, all draft)
| English | Kinyarwanda (draft) | Used in | Status |
|---|---|---|---|
| Your site | Urubuga rwawe | Owner.title | draft |
| Live / Not live yet / Paused | Rurakora / Ntirurajya ahagaragara / Rwahagaritswe | Owner.* | draft |
| Clients | Abakiriya | Admin.clients | draft |
| New business | Ubucuruzi bushya | Admin.newBusiness | draft |
| Modules / On / Off | Ibice / Birakora / Ntibikora | Admin.modules, Admin.on, Admin.off | draft |
| Invite owner | Tumira nyir'ubucuruzi | Admin.inviteOwner | draft |
| Support session / Support visits | Igihe cy'ubufasha / Gusurwa n'abafasha | Admin.support, Owner.support | draft |
| Reason | Impamvu | Admin.reason | draft |
| Draft / Active / Paused (business status) | Igitekerezo / Gikora / Cyahagaritswe | Admin.statusName.* | draft |
| Two-factor login / 6-digit code / Verify | Kwinjira mu ntambwe ebyiri / Imibare 6 / Emeza | Admin.enrollTitle, Admin.code, Admin.verify | draft |
| This site is not available | Uru rubuga ntiruboneka | NotFound.title | draft |

### Content editor (Batch 3a; all draft)
| English | Kinyarwanda (draft) | Used in | Status |
|---|---|---|---|
| Edit your site | Hindura urubuga rwawe | Editor.hubTitle, Owner.edit | draft |
| Business info | Amakuru y'ubucuruzi | Editor.row.info | draft |
| Photos | Amafoto | Editor.row.photos | draft |
| Languages | Indimi | Editor.row.languages | draft |
| Sections (of the page) | Ibice by'urupapuro | Editor.row.sections | draft |
| Look & colors | Isura n'amabara | Editor.row.look | draft |
| Changes | Impinduka | Editor.row.changes | draft |
| Save | Bika | Editor.save | draft |
| Live on your site as soon as you save | Bigaragara ku rubuga rwawe ukimara kubika | Editor.saveNote | draft |
| Draft (translation) | Igerageza | Editor.draft | draft |
| Checked (translation) | Byemejwe | Editor.checked | draft |
| Tap when checked | Kanda niba byemejwe | Editor.tapChecked | draft |
| Missing {lang} | {lang} irabura | Editor.missing | draft |
| Opening hours | Amasaha yo gukora | Editor.hours | draft |
| Map location | Aho muherereye ku ikarita | Editor.map | draft |
| Use my location | Koresha aho ndi | Editor.locate | draft |
| Add photo | Ongeraho ifoto | Editor.addPhoto | draft |
| Where it shows | Aho igaragara | Editor.placeLabel | draft |
| Don't upload photos of guests without their consent | Ntugashyireho amafoto y'abashyitsi batabyemeye | Editor.consent | draft |
| Support session (we edit for the owner) | Igihe cy'ubufasha | Editor.supportEditing | draft |
| Add room | Ongeraho icyumba | Editor.addRoom | draft |
| Price per night | Igiciro cy'ijoro rimwe | Editor.prices | draft |
| Rooms of this type (units) | Ibyumba by'ubu bwoko | Editor.units | draft |
| Amenities | Ibikoresho | Editor.amenities | draft |
| Move up / Move down | Zamura / Manura | Editor.moveUp, Editor.moveDown | draft |
| Colours: Auto, Day, Night | Amabara: Byikora, Ku manywa, Nijoro | Editor.colorSetName.* | draft |
| Accent colour | Ibara ry'ingenzi | Editor.accent | draft |
| Accents: Forest, Clay, Ochre, Slate, Bark | Ishyamba, Ibumba, Umuhondo w'ubutaka, Ikibuye, Igishishwa | Editor.accentName.* | draft |
| Show on the site | Garagaza ku rubuga | Editor.showOnSite | draft |
