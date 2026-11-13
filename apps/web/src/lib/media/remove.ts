import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaBucket, photoFiles } from "@getkaze/core";

/**
 * Deleting photos (specs/media-storage.md). The Storage API is the only way
 * to remove files (Storage blocks SQL deletes), so these run on the server:
 * with the owner's own session for one photo (policies apply), and with our
 * admin session (aal2 + open support session) or the service role for a whole
 * business at deletion time (D-031). No "server-only" import, so the storage
 * tests can call the same code.
 */

/** Delete one photo: its files first, then its row. Returns false when the row is not visible to this user. */
export async function deletePhoto(db: SupabaseClient, mediaId: string): Promise<boolean> {
  const { data: row, error } = await db.from("media").select("id, storage_path").eq("id", mediaId).maybeSingle();
  if (error) throw new Error(`Could not read the photo (${error.code ?? "unknown"}).`);
  if (!row) return false;
  if (row.storage_path) {
    const { error: removeError } = await db.storage.from(mediaBucket).remove(photoFiles(row.storage_path));
    if (removeError) throw new Error(`Could not remove the photo files (${removeError.message}).`);
  }
  const { error: deleteError, count } = await db.from("media").delete({ count: "exact" }).eq("id", mediaId);
  if (deleteError) throw new Error(`Could not delete the photo (${deleteError.code ?? "unknown"}).`);
  return (count ?? 0) > 0;
}

/** Remove every file in a business's folder (D-031 deletion). Returns how many files were removed. */
export async function purgeBusinessMedia(db: SupabaseClient, businessId: string): Promise<number> {
  const bucket = db.storage.from(mediaBucket);
  let removed = 0;
  // Two levels: <business_id>/<photo_id>/<file>. List photo folders, then their files, 100 at a time.
  for (;;) {
    const { data: folders, error } = await bucket.list(businessId, { limit: 100 });
    if (error) throw new Error(`Could not list the business folder (${error.message}).`);
    if (!folders?.length) return removed;
    const names: string[] = [];
    for (const folder of folders) {
      const { data: files, error: filesError } = await bucket.list(`${businessId}/${folder.name}`, { limit: 100 });
      if (filesError) throw new Error(`Could not list a photo folder (${filesError.message}).`);
      for (const f of files ?? []) names.push(`${businessId}/${folder.name}/${f.name}`);
    }
    if (!names.length) return removed;
    const { error: removeError } = await bucket.remove(names);
    if (removeError) throw new Error(`Could not remove the business files (${removeError.message}).`);
    removed += names.length;
  }
}
