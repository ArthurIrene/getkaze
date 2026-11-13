import { getTranslations, setRequestLocale } from "next-intl/server";
import { editorProgress, infoTexts, missingTranslations, roomTexts, type EditorSection, type LocalizedText, type RoomInput } from "@getkaze/core";
import { EditorFrame, ownerHref } from "@/components/editor/frame";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";

/** Edit site hub (O-Editor): one row per part of the site, with a done mark and the overall progress. */
export default async function EditorHub({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const rooms = business.preset === "hotel_lodge";
  const [{ data: s }, { data: media }, { count: roomCount }, { data: items }] = await Promise.all([
    supabase.from("site_settings").select("contacts, location, hours").eq("business_id", id).maybeSingle(),
    supabase.from("media").select("id, place, storage_path, alt").eq("business_id", id),
    rooms ? supabase.from("catalog_items").select("id", { count: "exact", head: true }).eq("business_id", id).eq("kind", "room_type") : Promise.resolve({ count: null }),
    supabase.from("catalog_items").select("id, name, line, amenities").eq("business_id", id),
  ]);
  const location = (s?.location ?? {}) as { area?: LocalizedText; directions?: LocalizedText[] };
  const missing = missingTranslations({
    ...infoTexts({ location: { map_url: "", area: location.area, directions: location.directions ?? [] }, hours: (s?.hours ?? []) as LocalizedText[] }),
    ...Object.fromEntries((items ?? []).flatMap((i) => Object.entries(roomTexts({ name: i.name as LocalizedText, line: (i.line as LocalizedText | null) ?? null, amenities: (i.amenities ?? []) as RoomInput["amenities"] })).map(([k, v]) => [`${i.id}.${k}`, v]))),
    ...Object.fromEntries((media ?? []).map((m) => [`media.${m.id}`, m.alt as LocalizedText])),
  }, business.languages);
  const contacts = (s?.contacts ?? {}) as Record<string, string>;
  const uploaded = (media ?? []).filter((m) => m.storage_path);
  const progress = editorProgress({
    hasContacts: Boolean(contacts.phone && contacts.whatsapp),
    hasMap: Boolean((s?.location as Record<string, unknown> | undefined)?.map_url),
    hasHours: ((s?.hours as unknown[]) ?? []).length > 0,
    photos: uploaded.length,
    hasHeroPhoto: uploaded.some((m) => m.place === "hero"),
    rooms: rooms ? (roomCount ?? 0) : null,
  });
  const rows: { id: EditorSection; href: string }[] = [
    { id: "info", href: "/info" },
    { id: "photos", href: "/photos" },
    ...(rooms ? [{ id: "rooms" as const, href: "/rooms" }] : []),
    { id: "sections", href: "/sections" },
    { id: "look", href: "/look" },
    { id: "languages", href: "/languages" },
    { id: "changes", href: "/changes" },
  ];
  // Rows whose screens exist (features 3 and 4 add the rest).
  const ready = new Set<EditorSection>(["info", "photos", "rooms", "sections", "look", "languages"]);
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit`} back={ownerHref(locale)} title={t("hubTitle")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>}>
      <p className="text-sm font-semibold" data-progress={progress.percent}>{t("complete", { percent: progress.percent })}</p>
      {Object.entries(missing).filter(([, n]) => n).map(([l, n]) => (
        <p key={l} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" data-missing={l}>{t("missingSummary", { count: n ?? 0, lang: l.toUpperCase() })}</p>
      ))}
      <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {rows.filter((r) => ready.has(r.id)).map((r) => (
          <li key={r.id}>
            <a href={editorHref(locale, id, r.href)} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <span className="font-medium">{t(`row.${r.id}`)}</span>
              {progress.done[r.id] === undefined ? <span aria-hidden="true">›</span> : (
                <span className={`text-xs font-semibold ${progress.done[r.id] ? "text-green-700" : "text-amber-800"}`}>{progress.done[r.id] ? t("done") : t("todo")} ›</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </EditorFrame>
  );
}
