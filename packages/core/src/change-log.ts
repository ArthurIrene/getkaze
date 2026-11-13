/**
 * Change log in plain words (specs/change-log-view.md). Rows come from
 * public.get_change_log: field names only, never values. Screens turn the
 * keys below into wording.
 */
export type ChangeLogRow = {
  id: string; business_id: string; business_name: string; at: string;
  kind: "change" | "support_start" | "support_end" | "log_read";
  actor: "you" | "owner" | "staff" | "support" | "system";
  actor_email: string | null; table_name: string | null; row_id: string | null;
  action: "insert" | "update" | "delete" | null; fields: string[]; label: string | null; reason: string | null;
};

export type ChangeArea = "info" | "rooms" | "photos" | "sections" | "look" | "languages" | "site" | "modules" | "members" | "business" | "other";
export type ChangeField =
  | "name" | "contacts" | "map" | "hours" | "sections" | "look" | "languages" | "currency" | "translations" | "price" | "guests" | "units"
  | "amenities" | "visibility" | "order" | "line" | "place" | "alt" | "photo" | "status" | "address" | "texts" | "switch" | "roles" | "other";

const fieldOf: Record<string, Record<string, ChangeField>> = {
  site_settings: { contacts: "contacts", location: "map", hours: "hours", sections: "sections", look: "look", translations_checked: "translations" },
  businesses: { name: "name", languages: "languages", default_currency: "currency", status: "status", slug: "address", custom_domain: "address" },
  catalog_items: { name: "name", line: "line", price_rwf: "price", price_usd: "price", max_guests: "guests", units: "units", amenities: "amenities", visible: "visibility", position: "order", translations_checked: "translations" },
  media: { place: "place", item_id: "place", alt: "alt", position: "order", storage_path: "photo", translations_checked: "translations" },
  business_modules: { enabled: "switch" },
  memberships: { status: "status", roles: "roles" },
};

function areaOf(row: Pick<ChangeLogRow, "table_name" | "fields">): ChangeArea {
  switch (row.table_name) {
    case "catalog_items": return "rooms";
    case "media": return "photos";
    case "business_modules": return "modules";
    case "memberships": return "members";
    case "businesses": return row.fields.length && row.fields.every((f) => f === "languages") ? "languages" : "business";
    case "site_settings": {
      const f = row.fields;
      if (f.length && f.every((x) => x === "sections")) return "sections";
      if (f.length && f.every((x) => x === "look")) return "look";
      if (f.some((x) => ["contacts", "location", "hours"].includes(x))) return "info";
      return "site";
    }
    default: return "other";
  }
}

/** What a change touched: the area, the named item (room name, photo place) and the fields, each once. */
export function describeChange(row: Pick<ChangeLogRow, "table_name" | "fields" | "label" | "action">): { area: ChangeArea; label: string | null; fields: ChangeField[] } {
  const map = fieldOf[row.table_name ?? ""] ?? {};
  const fields = [...new Set(row.fields.map((f) => map[f] ?? (row.table_name === "site_settings" ? "texts" : "other")))];
  return { area: areaOf(row), label: row.label, fields: row.action === "update" ? fields : [] };
}

/** Rows grouped by calendar day in a time zone (Kigali for owners), newest day first, order kept. */
export function groupByDay<T extends { at: string }>(rows: readonly T[], timeZone = "Africa/Kigali"): { day: string; rows: T[] }[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const out: { day: string; rows: T[] }[] = [];
  for (const r of rows) {
    const day = fmt.format(new Date(r.at));
    const last = out[out.length - 1];
    if (last && last.day === day) last.rows.push(r);
    else out.push({ day, rows: [r] });
  }
  return out;
}

/** "14:05" in a time zone. */
export function timeOfDay(at: string, timeZone = "Africa/Kigali"): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(at));
}
