import type { SiteView } from "./site/view";
import type { ContentLocale } from "./i18n";

export interface StayRequest {
  item: string;
  group: "room" | "experience" | "dining";
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  name: string;
  note: string;
}

export interface FormDataLike {
  get(key: string): FormDataEntryValue | null;
}

type FormDataEntryValue = string | File | Blob;

const MAX_NAME = 80;
const MAX_NOTE = 500;
const MAX_MESSAGE = 1200;
const MAX_BODY = 8192;

export function parseStayRequest(formData: FormDataLike): StayRequest {
  const item = String(formData.get("item") ?? "").slice(0, 40);
  const group = String(formData.get("group") ?? "") as StayRequest["group"];
  const checkIn = String(formData.get("checkIn") ?? "").slice(0, 40);
  const checkOut = String(formData.get("checkOut") ?? "").slice(0, 40);
  const adults = Math.min(10, Math.max(1, Number(formData.get("adults") ?? 2)));
  const children = Math.min(10, Math.max(0, Number(formData.get("children") ?? 0)));
  const name = String(formData.get("name") ?? "").slice(0, MAX_NAME);
  const note = String(formData.get("note") ?? "").slice(0, MAX_NOTE);
  return { item, group, checkIn, checkOut, adults, children, name, note };
}

export function stayTarget(parsed: StayRequest, site: SiteView): string {
  return `https://wa.me/${site.contacts.whatsapp.replace(/[^0-9]/g, "")}`;
}

function formatDateForMessage(date: string, locale: ContentLocale): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(locale === "rw" ? "rw-RW" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn + "T00:00:00").getTime();
  const end = new Date(checkOut + "T00:00:00").getTime();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function clipToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1) + "…";
}

function byteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function stayMessage(parsed: StayRequest, site: SiteView, locale: ContentLocale): string {
  const t = (key: string, vars?: Record<string, string | number>) => {
    const messages: Record<string, Record<ContentLocale, string>> = {
      myStayTitle: { en: "Stay plan for {name}", rw: "Itegerezo ry'ijoro rya {name}", fr: "Plan de séjour pour {name}" },
      myStayItemRoom: { en: "Room: {name}", rw: "Icyumba: {name}", fr: "Chambre: {name}" },
      myStayItemExperience: { en: "Experience: {name}", rw: "Ikorwa: {name}", fr: "Expérience: {name}" },
      myStayItemDining: { en: "Dining: {name}", rw: "Kurya: {name}", fr: "Restauration: {name}" },
      myStayDates: { en: "Dates: {checkIn} – {checkOut} ({nights} night{s})", rw: "Amatariki: {checkIn} – {checkOut} ({nights} ijoro)", fr: "Dates: {checkIn} – {checkOut} ({nights} nuit{s})" },
      myStayGuests: { en: "Guests: {adults} adult{s}{children, +, , children}", rw: "Abashyitsi: {adults} umuntu{children, +, , abana}", fr: "Invités: {adults} adulte{s}{children, +, , enfants}" },
      myStayName: { en: "Name: {name}", rw: "Izina: {name}", fr: "Nom: {name}" },
      myStayNote: { en: "Note: {note}", rw: "Icyitonderwa: {note}", fr: "Note: {note}" },
    };
    let msg = messages[key]?.[locale] ?? messages[key]?.en ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        msg = msg.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return msg;
  };

  const pickedItem = site.rooms.find((r) => r.id === parsed.item) ?? site.activities.find((a) => a.id === parsed.item) ?? site.dining.dishes.find((d) => d.id === parsed.item);
  const nights = formatNights(parsed.checkIn, parsed.checkOut);
  const itemLabel = parsed.group === "room" ? t("myStayItemRoom", { name: pickedItem?.name ?? parsed.item })
    : parsed.group === "experience" ? t("myStayItemExperience", { name: pickedItem?.name ?? parsed.item })
    : t("myStayItemDining", { name: pickedItem?.name ?? parsed.item });

  const lines = [
    t("myStayTitle", { name: site.name }),
    "",
    itemLabel,
    t("myStayDates", { checkIn: formatDateForMessage(parsed.checkIn, locale), checkOut: formatDateForMessage(parsed.checkOut, locale), nights, s: nights === 1 ? "" : "s" }),
    t("myStayGuests", { adults: parsed.adults, s: parsed.adults === 1 ? "" : "s", children: parsed.children }),
    t("myStayName", { name: parsed.name }),
  ];

  if (parsed.note) {
    lines.push("", t("myStayNote", { note: parsed.note }));
  }

  let message = lines.join("\n");
  message = clipToLimit(message, MAX_MESSAGE);

  if (byteLength(message) > MAX_BODY) {
    message = clipToLimit(message, MAX_BODY);
  }

  return message;
}