"use server";

/**
 * Editor saves (specs/editor-basics.md). Each action re-checks who may edit
 * (requireEditor → core canEditSite), parses with core, writes with the
 * signed-in user's own session (RLS and the database triggers decide again,
 * and log every change), then refreshes the guest site's cache tags.
 */
import { redirect } from "next/navigation";
import {
  infoTexts, mediaBucket, mediaFile, mediaFolder, nextChecks, parseBusinessInfo, parseLanguages, parsePhotoDetails,
  photoLimits, photoProblems, widthsFor, type BusinessInfo, type LocalizedText, type PhotoType, type TranslationChecks,
} from "@getkaze/core";
import { editorHref, refreshSite, requireEditor } from "@/lib/editor/access";
import { deletePhoto } from "@/lib/media/remove";

const val = (form: FormData, key: string, max = 100) => String(form.get(key) ?? "").trim().slice(0, max);
const getter = (form: FormData) => (key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : null;
};

async function editor(form: FormData) {
  const locale = val(form, "locale", 5);
  const id = val(form, "business", 40);
  return { locale, ...(await requireEditor(id, locale)) };
}

// ---------- Business info ----------
export async function saveInfo(form: FormData) {
  const { locale, supabase, business } = await editor(form);
  const back = (q: string) => redirect(`${editorHref(locale, business.id, "/info")}?${q}`);
  const parsed = parseBusinessInfo(getter(form), business.languages);
  if (!parsed.ok) back(`error=${parsed.problems.join(",")}`);
  const info = (parsed as { ok: true; value: BusinessInfo }).value;

  const { data: before } = await supabase.from("site_settings").select("location, hours, translations_checked").eq("business_id", business.id).maybeSingle();
  if (!before) back("error=missing");
  const oldLocation = (before!.location ?? {}) as Record<string, unknown>;
  const checks = nextChecks(
    infoTexts({ location: { map_url: "", area: oldLocation.area as LocalizedText | undefined, directions: (oldLocation.directions as LocalizedText[]) ?? [] }, hours: (before!.hours as LocalizedText[]) ?? [] }),
    infoTexts(info),
    (before!.translations_checked ?? {}) as TranslationChecks,
    getter(form),
  );
  // Keep the location keys this form does not edit (address, distance note).
  const location = { ...oldLocation, ...info.location };
  if (!info.location.area) delete (location as Record<string, unknown>).area;
  if (info.location.lat === undefined) { delete (location as Record<string, unknown>).lat; delete (location as Record<string, unknown>).lng; }
  const otherChecks = Object.fromEntries(Object.entries((before!.translations_checked ?? {}) as TranslationChecks).filter(([k]) => !k.startsWith("location.") && !k.startsWith("hours.")));

  const { error, count } = await supabase.from("site_settings")
    .update({ contacts: info.contacts, location, hours: info.hours, translations_checked: { ...otherChecks, ...checks } }, { count: "exact" })
    .eq("business_id", business.id);
  if (error || !count) back("error=save");
  if (info.name !== business.name) {
    const { error: nameError } = await supabase.from("businesses").update({ name: info.name }).eq("id", business.id);
    if (nameError) back("error=save");
  }
  refreshSite(business);
  back("saved=1");
}

// ---------- Languages ----------
export async function saveLanguages(form: FormData) {
  const { locale, supabase, business } = await editor(form);
  const languages = parseLanguages(getter(form));
  const { error } = await supabase.from("businesses").update({ languages }).eq("id", business.id);
  refreshSite(business);
  redirect(`${editorHref(locale, business.id, "/languages")}?${error ? "error=save" : "saved=1"}`);
}

// ---------- Photos ----------
export type UploadResult = { ok: true; id: string } | { ok: false; error: string };

/** Called by the upload form after the phone made the sizes (480/960/1440, WebP or JPEG). */
export async function uploadPhoto(form: FormData): Promise<UploadResult> {
  const { supabase, business } = await editor(form);
  const details = parsePhotoDetails(getter(form), business.languages);
  if (!details.ok) return { ok: false, error: details.problems.join(",") };
  const photoId = val(form, "photo", 40);
  const type = (val(form, "format", 4) === "jpg" ? "image/jpeg" : "image/webp") as PhotoType;
  const width = Number(val(form, "width", 6));
  const height = Number(val(form, "height", 6));
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 1440 || height > 4000) return { ok: false, error: "size" };
  let folder: string;
  try {
    folder = mediaFolder(business.id, photoId);
  } catch {
    return { ok: false, error: "id" };
  }
  const { count } = await supabase.from("media").select("id", { count: "exact", head: true }).eq("business_id", business.id);
  if ((count ?? 0) >= photoLimits.photos) return { ok: false, error: "count" };

  const widths = widthsFor(width);
  const files: { name: string; file: File }[] = [];
  for (const w of widths) {
    const file = form.get(`file.${w}`);
    if (!(file instanceof File)) return { ok: false, error: "file" };
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    // The 480 file of a small original is narrower than 480; others are exactly their width.
    const fileWidth = w === widths[widths.length - 1] ? Math.min(width, w) : w;
    const problems = photoProblems({ type: file.type, bytes: file.size, width: fileWidth, head }, w);
    if (problems.length) return { ok: false, error: problems.join(",") };
    files.push({ name: mediaFile(folder, w, type), file });
  }
  const bucket = supabase.storage.from(mediaBucket);
  for (const f of files) {
    const { error } = await bucket.upload(f.name, f.file, { contentType: type, upsert: false });
    if (error) {
      await bucket.remove(files.map((x) => x.name));
      return { ok: false, error: "upload" };
    }
  }
  const { data: row, error } = await supabase.from("media").insert({
    business_id: business.id, place: details.value.place, item_id: details.value.itemId, alt: details.value.alt,
    storage_path: folder, format: type === "image/jpeg" ? "jpg" : "webp", width, height,
    bytes: files.reduce((n, f) => n + f.file.size, 0),
  }).select("id").single();
  if (error || !row) {
    await bucket.remove(files.map((x) => x.name));
    return { ok: false, error: "save" };
  }
  refreshSite(business);
  return { ok: true, id: row.id as string };
}

export async function savePhoto(form: FormData) {
  const { locale, supabase, business } = await editor(form);
  const mediaId = val(form, "media", 40);
  const back = (q: string) => redirect(`${editorHref(locale, business.id, `/photos/${mediaId}`)}?${q}`);
  const details = parsePhotoDetails(getter(form), business.languages);
  if (!details.ok) back(`error=${details.problems.join(",")}`);
  const value = (details as Extract<typeof details, { ok: true }>).value;
  const { data: before } = await supabase.from("media").select("alt, translations_checked").eq("id", mediaId).eq("business_id", business.id).maybeSingle();
  if (!before) back("error=missing");
  const checks = nextChecks({ alt: before!.alt as LocalizedText }, { alt: value.alt }, (before!.translations_checked ?? {}) as TranslationChecks, getter(form));
  const { error } = await supabase.from("media")
    .update({ place: value.place, item_id: value.itemId, alt: value.alt, translations_checked: checks })
    .eq("id", mediaId).eq("business_id", business.id);
  if (error) back("error=save");
  refreshSite(business);
  back("saved=1");
}

export async function removePhoto(form: FormData) {
  const { locale, supabase, business } = await editor(form);
  const mediaId = val(form, "media", 40);
  const ok = await deletePhoto(supabase, mediaId).catch(() => false);
  refreshSite(business);
  redirect(`${editorHref(locale, business.id, "/photos")}?${ok ? "deleted=1" : "error=delete"}`);
}
