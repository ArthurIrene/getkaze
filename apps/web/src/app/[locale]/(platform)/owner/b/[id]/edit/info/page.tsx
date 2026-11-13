import { getTranslations, setRequestLocale } from "next-intl/server";
import type { LocalizedText, TranslationChecks } from "@getkaze/core";
import { EditorFrame, SaveBar } from "@/components/editor/frame";
import { LocalizedField, TextInput } from "@/components/editor/localized";
import { LocateButton } from "@/components/editor/locate";
import type { Locale } from "@/i18n/routing";
import { editorHref, requireEditor } from "@/lib/editor/access";
import { saveInfo } from "../actions";

const problems = ["name", "phone", "whatsapp", "email", "map", "coords", "save", "missing"];

/** Business info (O-Editor): name, contacts, map pin, area and directions, opening hours (one line per area). */
export default async function InfoPage({ params, searchParams }: PageProps<"/[locale]/owner/b/[id]/edit/info">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const q = await searchParams;
  const { supabase, business, access } = await requireEditor(id, locale);
  const t = await getTranslations("Editor");
  const { data: s } = await supabase.from("site_settings").select("contacts, location, hours, translations_checked").eq("business_id", id).maybeSingle();
  const contacts = (s?.contacts ?? {}) as Record<string, string>;
  const location = (s?.location ?? {}) as { map_url?: string; lat?: number; lng?: number; area?: LocalizedText; directions?: LocalizedText[] };
  const hours = (s?.hours ?? []) as LocalizedText[];
  const checks = (s?.translations_checked ?? {}) as TranslationChecks;
  const langs = business.languages;
  // Existing rows plus two empty ones to add (no JavaScript needed).
  const hourRows = [...hours, undefined, undefined].slice(0, 8);
  const directionRows = [...(location.directions ?? []), undefined].slice(0, 6);
  return (
    <EditorFrame locale={locale} path={`/owner/b/${id}/edit/info`} back={editorHref(locale, id)} title={t("row.info")} business={business.name} support={access.ok && access.as === "support"} q={q as Record<string, string>} problems={problems}>
      <form action={saveInfo} className="flex flex-col gap-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="business" value={id} />
        <section className="flex flex-col gap-3">
          <TextInput label={t("name")} name="name" value={business.name} required max={80} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("contacts")}</h2>
          <TextInput label={t("phone")} name="phone" value={contacts.phone} type="tel" inputMode="tel" required max={30} />
          <TextInput label={t("whatsapp")} name="whatsapp" value={contacts.whatsapp} type="tel" inputMode="tel" required max={30} />
          <TextInput label={t("email")} name="email" value={contacts.email} type="email" inputMode="email" max={120} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("map")}</h2>
          <p className="text-sm text-neutral-600">{t("mapHint")}</p>
          <TextInput label={t("mapLink")} name="map_url" value={location.map_url} max={500} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label={t("lat")} name="lat" value={location.lat} inputMode="decimal" max={20} />
            <TextInput label={t("lng")} name="lng" value={location.lng} inputMode="decimal" max={20} />
          </div>
          <LocateButton label={t("locate")} busy={t("locating")} failed={t("locateFailed")} />
          <LocalizedField label={t("area")} name="area" path="location.area" value={location.area} languages={langs} checks={checks} max={160} />
          {directionRows.map((d, n) => (
            <LocalizedField key={`d${n}`} label={`${t("directions")} ${n + 1}`} name={`directions.${n}`} path={`location.directions.${n}`} value={d} languages={langs} checks={checks} />
          ))}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("hours")}</h2>
          <p className="text-sm text-neutral-600">{t("hoursHint")}</p>
          {hourRows.map((h, n) => (
            <LocalizedField key={`h${n}`} label={`${t("hoursLine")} ${n + 1}`} name={`hours.${n}`} path={`hours.${n}`} value={h} languages={langs} checks={checks} max={160} />
          ))}
        </section>
        <SaveBar label={t("save")} note={t("saveNote")} />
      </form>
    </EditorFrame>
  );
}
