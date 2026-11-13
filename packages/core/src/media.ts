/**
 * Photo storage rules (specs/media-storage.md). Pure functions: the web app
 * and any later app use the same names, limits and checks. The database
 * enforces the same limits (app.media_limits, storage policies); a test keeps
 * them equal.
 */

/** Safe limits (D-024). Sizes are made on the owner's device at upload. */
export const photoLimits = {
  /** Photos per business. */
  photos: 60,
  /** Widths made for each photo, served with <img srcset>. */
  widths: [480, 960, 1440] as const,
  /** Hard limit per file (bucket file_size_limit). */
  fileBytes: 300 * 1024,
  /** Size targets per width (the hero on a phone loads the 960 file: about 80 KB). */
  targetBytes: { 480: 40 * 1024, 960: 80 * 1024, 1440: 160 * 1024 } as const,
  types: ["image/webp", "image/jpeg"] as const,
  /** Largest original the editor will try to shrink. */
  originalBytes: 25 * 1024 * 1024,
} as const;

export type PhotoWidth = (typeof photoLimits.widths)[number];
export type PhotoType = (typeof photoLimits.types)[number];

export const mediaBucket = "business-media";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ext: Record<PhotoType, "webp" | "jpg"> = { "image/webp": "webp", "image/jpeg": "jpg" };

/** The photo's folder: "<business_id>/<photo_id>" (stored in media.storage_path). */
export function mediaFolder(businessId: string, photoId: string): string {
  if (!uuid.test(businessId) || !uuid.test(photoId)) throw new Error("mediaFolder needs two lowercase UUIDs");
  return `${businessId}/${photoId}`;
}

/** One file of a photo: "<business_id>/<photo_id>/<width>.<webp|jpg>". */
export function mediaFile(folder: string, width: PhotoWidth, type: PhotoType): string {
  return `${folder}/${width}.${ext[type]}`;
}

/** The business that owns an object name, or null for any other name (same rule as app.media_business). */
export function mediaBusiness(objectName: string): string | null {
  const m = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\/(480|960|1440)\.(webp|jpg)$/.exec(objectName);
  return m && uuid.test(m[1]!) && uuid.test(m[2]!) ? m[1]! : null;
}

export type PhotoFileMeta = { type: string; bytes: number; width: number; head: Uint8Array };
export type PhotoProblem = "type" | "empty" | "tooLarge" | "width" | "content";

/** WebP: "RIFF....WEBP"; JPEG: FF D8 FF. The declared type must match the bytes. */
function sniff(head: Uint8Array): PhotoType | null {
  const s = (a: number, b: number) => String.fromCharCode(...head.subarray(a, b));
  if (head.length >= 12 && s(0, 4) === "RIFF" && s(8, 12) === "WEBP") return "image/webp";
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  return null;
}

/** Problems with one resized file before it is uploaded (checked on the server). */
export function photoProblems(f: PhotoFileMeta, expectedWidth: PhotoWidth): PhotoProblem[] {
  const problems: PhotoProblem[] = [];
  if (!(photoLimits.types as readonly string[]).includes(f.type)) problems.push("type");
  if (f.bytes <= 0) problems.push("empty");
  if (f.bytes > photoLimits.fileBytes) problems.push("tooLarge");
  if (!Number.isInteger(f.width) || f.width <= 0 || f.width > expectedWidth) problems.push("width");
  if (sniff(f.head) !== f.type) problems.push("content");
  return problems;
}

/** Public URL of a file (Supabase Storage now; one function to change for Cloudflare R2 later). */
export function publicMediaUrl(objectName: string, storageBaseUrl: string): string {
  return `${storageBaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${mediaBucket}/${objectName}`;
}

/** Every file name a photo can have (for deleting a photo whatever type its files are). */
export function photoFiles(folder: string): string[] {
  return photoLimits.widths.flatMap((w) => photoLimits.types.map((t) => mediaFile(folder, w, t)));
}
