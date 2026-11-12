/**
 * DEMO DATA — FAKE. NEVER USE FOR A REAL SITE.
 *
 * "Kinigi Hills" is an invented lodge copied from the Field Journal mockups
 * (mockups/canvas/T1-Home.dc.html). The host, reviews, scores, prices and
 * phone numbers are all made up. Real businesses come from the database
 * (day 5 onwards), never from this file.
 *
 * Some Kinyarwanda texts are left out on purpose, so /rw shows the English
 * fallback (D-029).
 */
import type { Amenity, Photo, SiteData } from "@getkaze/core";

const photo = (id: string, place: Photo["place"], en: string, rw?: string): Photo => ({
  id,
  place,
  alt: rw ? { en, rw } : { en },
});

const a = (icon: Amenity["icon"], en: string, rw?: string): Amenity => ({ icon, label: rw ? { en, rw } : { en } });

/** Three placeholder photos per room (bed, view, bathroom), as in the rooms mockup. */
const roomPhotos = (id: string, name: string): Photo[] => [
  photo(`${id}-1`, "room", `${name}: the bed`),
  photo(`${id}-2`, "room", `${name}: the view`),
  photo(`${id}-3`, "room", `${name}: the bathroom`),
];

export const demoLodge: SiteData = {
  businessId: "demo-kinigi-hills",
  name: "Kinigi Hills",
  legalName: "Kinigi Hills Lodge (demo)",
  template: "field-journal",
  defaultCurrency: "usd",
  languages: ["en", "rw"],
  modulesOn: ["menu"],
  contacts: {
    phone: "+250 700 000 000",
    whatsapp: "+250 700 000 000",
    // example.com is reserved for examples: this address never reaches anyone.
    email: "hello@example.com",
  },
  location: {
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kinigi%2C%20Musanze",
    area: { en: "Kinigi Sector, Musanze District", rw: "Umurenge wa Kinigi, Akarere ka Musanze" },
    distanceNote: { en: "Musanze 25'" },
    directions: [
      { en: "From Musanze town: 25 minutes by car on the Kinigi road.", rw: "Uvuye mu mujyi wa Musanze: iminota 25 n'imodoka ku muhanda wa Kinigi." },
      { en: "From Kigali: about 2 hours 30 minutes.", rw: "Uvuye i Kigali: amasaha 2 n'iminota 30." },
      { en: "Ask us for a driver from Kigali or Musanze." },
    ],
  },
  hours: [{ en: "Reception every day, 6:00 to 22:00", rw: "Kwakira abashyitsi buri munsi, 6:00 kugeza 22:00" }],
  payment: [{ en: "Cash (RWF, USD), MTN MoMo, Airtel Money", rw: "Amafaranga (RWF, USD), MTN MoMo, Airtel Money" }],
  sections: [
    { id: "hero", visible: true },
    { id: "facts", visible: true },
    { id: "life", visible: true },
    { id: "rooms", visible: true },
    { id: "table", visible: true },
    { id: "around", visible: true },
    { id: "host", visible: true },
    { id: "reviews", visible: true },
    { id: "findUs", visible: true },
  ],
  hero: {
    title: { en: "Wake up facing", rw: "Byuka ureba" },
    line: { en: "the volcanoes", rw: "ibirunga" },
    photo: photo("hero", "hero", "The lodge below the volcanoes", "Icumbi munsi y'ibirunga"),
  },
  facts: [
    {
      id: "park",
      value: { en: "15'" },
      icon: "park",
      detail: { en: "15 minutes by car to Volcanoes National Park HQ, where treks start." },
    },
    {
      id: "breakfast",
      value: { en: "Incl.", rw: "Birimo" },
      icon: "breakfast",
      detail: { en: "Breakfast is included, from 5 a.m. on trek days." },
    },
    {
      id: "permits",
      value: { en: "Permits", rw: "Impushya" },
      icon: "permit",
      detail: { en: "We help you book gorilla and golden monkey permits." },
    },
  ],
  moments: [
    { id: "coffee", caption: { en: "5 a.m. coffee" }, icon: "coffee", photo: photo("m-coffee", "gallery", "Morning coffee") },
    { id: "fire", caption: { en: "evening fire" }, icon: "fire", photo: photo("m-fire", "gallery", "Evening fire") },
    { id: "garden", caption: { en: "the garden" }, icon: "garden", photo: photo("m-garden", "gallery", "The garden") },
    { id: "stars", caption: { en: "Bisoke stars" }, icon: "stars", photo: photo("m-stars", "gallery", "Stars over Bisoke") },
  ],
  rooms: [
    {
      id: "garden-single",
      name: { en: "Garden Single" },
      line: { en: "Quiet, facing the garden. Made for solo trekkers who want an early night." },
      price: { rwf: 45000, usd: 35 },
      maxGuests: 1,
      photos: roomPhotos("r-garden-single", "Garden Single"),
      amenities: [a("bed", "1 bed", "uburiri 1"), a("people", "1 guest", "umuntu 1"), a("shower", "Shower", "Douche"), a("wifi", "Wi-Fi")],
    },
    {
      id: "garden-double",
      name: { en: "Garden Double" },
      line: { en: "Queen bed, a writing desk and morning sun on the garden." },
      price: { rwf: 60000, usd: 45 },
      maxGuests: 2,
      photos: roomPhotos("r-garden-double", "Garden Double"),
      amenities: [a("bed", "Queen", "Uburiri bunini"), a("people", "2 guests", "abantu 2"), a("desk", "Desk", "Ameza yo kwandikiraho"), a("wifi", "Wi-Fi")],
    },
    {
      id: "volcano-view-double",
      name: { en: "Volcano View Double" },
      line: { en: "Our favourite. A private balcony facing Sabyinyo and Bisoke at sunrise." },
      price: { rwf: 80000, usd: 60 },
      maxGuests: 2,
      photos: roomPhotos("r-volcano-view", "Volcano View Double"),
      amenities: [a("bed", "Queen", "Uburiri bunini"), a("people", "2 guests", "abantu 2"), a("view", "View", "Ahantu heza ho kureba"), a("wifi", "Wi-Fi")],
    },
    {
      id: "family-cottage",
      name: { en: "Family Cottage" },
      line: { en: "Two bedrooms around a fireplace, for families or a small trekking group." },
      price: { rwf: 100000, usd: 75 },
      maxGuests: 4,
      photos: roomPhotos("r-family-cottage", "Family Cottage"),
      amenities: [a("bed", "2 rooms", "Ibyumba 2"), a("people", "4 guests", "abantu 4"), a("fire", "Fireplace", "Iziko"), a("wifi", "Wi-Fi")],
    },
  ],
  roomsLine: { en: "four rooms, one view", rw: "ibyumba bine, ahantu hamwe ho kureba" },
  stay: {
    checkIn: "14:00",
    checkOut: "10:00",
    breakfastIncluded: true,
    notes: [
      { en: "Early check-in for trekkers on request", rw: "Abajya gusura ingagi bashobora kwinjira kare babisabye" },
      { en: "Children under 5 stay free", rw: "Abana bari munsi y'imyaka 5 ntibishyura" },
    ],
  },
  dining: {
    name: { en: "the fireside room" },
    photo: photo("dining", "dining", "The fireside dining room"),
    dishes: [
      { id: "brochettes", name: { en: "Goat brochettes" }, price: { rwf: 7000, usd: 5 }, icon: "grill", photo: photo("d-brochettes", "dish", "Goat brochettes") },
      { id: "isombe", name: { en: "Isombe & rice" }, price: { rwf: 6000, usd: 4.5 }, icon: "stew", photo: photo("d-isombe", "dish", "Isombe and rice") },
      { id: "coffee", name: { en: "Rwandan coffee", rw: "Ikawa yo mu Rwanda" }, price: { rwf: 2000, usd: 1.5 }, icon: "coffee", photo: photo("d-coffee", "dish", "Rwandan coffee") },
    ],
  },
  activities: [
    { id: "gorillas", name: { en: "Gorilla trekking" }, distance: { en: "15'" }, icon: "trek", arrange: true, line: { en: "Permits from the park. We book your driver and packed lunch." } },
    { id: "golden-monkeys", name: { en: "Golden monkeys" }, distance: { en: "15'" }, icon: "monkey", arrange: true, line: { en: "A shorter, playful trek in the bamboo forest." } },
    { id: "caves", name: { en: "Musanze Caves" }, distance: { en: "25'" }, icon: "cave", arrange: true, line: { en: "A 2 km walk through old lava tunnels." } },
    { id: "twin-lakes", name: { en: "Twin Lakes" }, distance: { en: "40'" }, icon: "lake", arrange: true, line: { en: "Canoe on Burera and Ruhondo, lunch by the water." } },
    { id: "village", name: { en: "Cultural village" }, distance: { en: "10'" }, icon: "village", arrange: true, line: { en: "Dance, drums and banana beer with local families." } },
  ],
  host: {
    name: "Claudine",
    greeting: { en: "Muraho! I'm Claudine." },
    note: { en: "My family has welcomed trekkers for 9 years. I'll sort your permits, your driver and breakfast at 5 a.m." },
    photo: photo("host", "host", "Claudine, the host"),
  },
  reviews: {
    quote: { en: "“Coffee at five, volcanoes at the window.”" },
    scores: [
      { source: "TRIPADVISOR", value: "4.6" },
      { source: "BOOKING.COM", value: "8.9" },
    ],
  },
};
