import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatPrice, pickText, type LocalizedText } from "@getkaze/core";
import { EditorFrame } from "@/components/editor/frame";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { moveRoom } from "../actions";

/** Rooms list (O-Editor): in order, price, units, hidden mark; each row opens its form; "+" opens it empty. */
export default async function RoomsPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/rooms">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  if (business.preset !== "hotel_lodge") notFound();
  const t = await getTranslations("Editor");
  const { data: rooms } = await supabase.from("catalog_items").select("id, name, price_rwf, price_usd, units, visible").eq("business_id", id).eq("kind", "room_type").order("position").order("created_at");
  const list = rooms ?? [];
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/rooms`} back={editorHref(locale, id)} title={t("row.rooms")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>} problems={["delete"]}>
      <p className="text-sm text-neutral-700">{t("roomsHint")}</p>
      <form action={moveRoom}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {list.map((r, n) => (
            <li key={r.id} className="flex items-center gap-2 px-3 py-2" data-room={r.id}>
              <a href={editorHref(locale, id, `/rooms/${r.id}`)} className="flex min-h-12 min-w-0 flex-1 flex-col justify-center">
                <span className="truncate font-medium">{pickText(r.name as LocalizedText, locale as Locale)}{r.visible ? "" : ` · ${t("hidden")}`}</span>
                <span className="text-xs text-neutral-600">{formatPrice(r.price_rwf as number, "rwf")} · {formatPrice(Number(r.price_usd), "usd")} · {t("unitsCount", { count: r.units ?? 0 })}</span>
              </a>
              <button type="submit" name="move" value={`${r.id}:up`} disabled={n === 0} aria-label={`${t("moveUp")}: ${pickText(r.name as LocalizedText, locale as Locale)}`} className="h-11 w-11 rounded-lg border border-neutral-300 disabled:opacity-30">↑</button>
              <button type="submit" name="move" value={`${r.id}:down`} disabled={n === list.length - 1} aria-label={`${t("moveDown")}: ${pickText(r.name as LocalizedText, locale as Locale)}`} className="h-11 w-11 rounded-lg border border-neutral-300 disabled:opacity-30">↓</button>
            </li>
          ))}
        </ul>
      </form>
      <a href={editorHref(locale, id, "/rooms/new")} className="flex h-12 items-center justify-center rounded-lg bg-neutral-900 font-semibold text-white">+ {t("addRoom")}</a>
    </EditorFrame>
  );
}
