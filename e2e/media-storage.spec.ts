import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mediaFile, mediaFolder, publicMediaUrl } from "@getkaze/core";
import { deletePhoto, purgeBusinessMedia } from "../apps/web/src/lib/media/remove";
import { businessWithOwner, createUser, insert, uniqueEmail } from "./helpers/supabase";

/**
 * Photo storage through the real Storage API (specs/media-storage.md), local
 * Supabase only. The database tests (supabase/tests/database/storage.test.sql)
 * cover every policy; these cover what only the Storage server enforces (size
 * and type limits), public reads, and that deleting a photo or a business
 * removes the files.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const PASSWORD = "volcano-sunrise-42";

// supabase-js is a dependency of the web app, not of the repo root (no new dependency).
const { createClient } = createRequire(join(process.cwd(), "apps/web/package.json"))("@supabase/supabase-js") as typeof import("@supabase/supabase-js");

test.skip(!["127.0.0.1", "localhost"].includes(new URL(url || "http://invalid").hostname), "local Supabase only");

async function ownerClient(email: string): Promise<SupabaseClient> {
  const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return db;
}
const serviceDb = () => createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

/** A tiny real WebP (1×1) padded to the wanted size; Storage checks the declared type and the size. */
function webp(bytes = 200): Blob {
  const head = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=", "base64");
  return new Blob([Buffer.concat([head, Buffer.alloc(Math.max(0, bytes - head.length))])], { type: "image/webp" });
}

async function setup() {
  const [emailA, emailB] = [uniqueEmail("media-a"), uniqueEmail("media-b")];
  const [userA, userB] = [await createUser(emailA, PASSWORD), await createUser(emailB, PASSWORD)];
  const [a, b] = [await businessWithOwner(userA, "active", "Media A"), await businessWithOwner(userB, "active", "Media B")];
  return { a, b, dbA: await ownerClient(emailA), dbB: await ownerClient(emailB) };
}

test("an owner uploads to their own folder only, within the size and type limits, and anyone can read it", async () => {
  const { a, b, dbA } = await setup();
  const folder = mediaFolder(a.id, randomUUID());
  const name = mediaFile(folder, 960, "image/webp");
  const bucket = dbA.storage.from("business-media");

  expect((await bucket.upload(name, webp(), { contentType: "image/webp" })).error).toBeNull();
  const res = await fetch(publicMediaUrl(name, url));
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("image/webp");

  // Another business's folder, a free name, a file over 300 KB, a PNG, and overwriting: all refused.
  expect((await bucket.upload(mediaFile(mediaFolder(b.id, randomUUID()), 480, "image/webp"), webp(), { contentType: "image/webp" })).error).not.toBeNull();
  expect((await bucket.upload(`${a.id}/photo.webp`, webp(), { contentType: "image/webp" })).error).not.toBeNull();
  expect((await bucket.upload(mediaFile(folder, 1440, "image/webp"), webp(300 * 1024 + 1), { contentType: "image/webp" })).error).not.toBeNull();
  expect((await bucket.upload(mediaFile(folder, 480, "image/webp"), new Blob([Buffer.from("89504e470d0a1a0a", "hex")], { type: "image/png" }), { contentType: "image/png" })).error).not.toBeNull();
  expect((await bucket.upload(name, webp(), { contentType: "image/webp", upsert: true })).error).not.toBeNull();
});

test("owner B can neither list nor delete owner A's files", async () => {
  const { a, dbA, dbB } = await setup();
  const name = mediaFile(mediaFolder(a.id, randomUUID()), 480, "image/webp");
  expect((await dbA.storage.from("business-media").upload(name, webp(), { contentType: "image/webp" })).error).toBeNull();

  const listed = await dbB.storage.from("business-media").list(a.id);
  expect(listed.data ?? []).toEqual([]);
  const removed = await dbB.storage.from("business-media").remove([name]);
  expect(removed.data ?? []).toEqual([]);
  expect((await fetch(publicMediaUrl(name, url))).status).toBe(200);
});

test("deleting a photo deletes its files and its row", async () => {
  const { a, dbA } = await setup();
  const folder = mediaFolder(a.id, randomUUID());
  const bucket = dbA.storage.from("business-media");
  for (const w of [480, 960, 1440] as const) expect((await bucket.upload(mediaFile(folder, w, "image/webp"), webp(), { contentType: "image/webp" })).error).toBeNull();
  const { data: row, error } = await dbA.from("media").insert({ business_id: a.id, place: "gallery", alt: { en: "Terrace" }, storage_path: folder }).select("id").single();
  expect(error).toBeNull();

  expect(await deletePhoto(dbA, row!.id)).toBe(true);
  for (const w of [480, 960, 1440] as const) expect((await fetch(publicMediaUrl(mediaFile(folder, w, "image/webp"), url))).status).not.toBe(200);
  expect((await dbA.from("media").select("id").eq("id", row!.id)).data).toEqual([]);
});

test("deleting a business removes its whole folder and nothing of others (D-031)", async () => {
  const { a, b, dbA, dbB } = await setup();
  const namesA = [randomUUID(), randomUUID()].flatMap((p) => [480, 960].map((w) => mediaFile(mediaFolder(a.id, p), w as 480 | 960, "image/webp")));
  for (const n of namesA) expect((await dbA.storage.from("business-media").upload(n, webp(), { contentType: "image/webp" })).error).toBeNull();
  const nameB = mediaFile(mediaFolder(b.id, randomUUID()), 480, "image/webp");
  expect((await dbB.storage.from("business-media").upload(nameB, webp(), { contentType: "image/webp" })).error).toBeNull();

  // Owner B cannot purge A (policies): nothing goes.
  expect(await purgeBusinessMedia(dbB, a.id)).toBe(0);
  for (const n of namesA) expect((await fetch(publicMediaUrl(n, url))).status).toBe(200);

  // Our deletion run (service role, server only) removes all of A and keeps B.
  expect(await purgeBusinessMedia(serviceDb(), a.id)).toBe(namesA.length);
  for (const n of namesA) expect((await fetch(publicMediaUrl(n, url))).status).not.toBe(200);
  expect((await serviceDb().storage.from("business-media").list(a.id)).data).toEqual([]);
  expect((await fetch(publicMediaUrl(nameB, url))).status).toBe(200);
});

test("an admin needs aal2 and an open support session to write; the session is logged for the owner", async () => {
  // The aal2 cases are in the database tests (a TOTP sign-in is covered by admin.spec.ts); here: an owner
  // of A with no session for B, and a support row the owner can read.
  const { a, b, dbA } = await setup();
  const adminEmail = uniqueEmail("media-admin");
  const adminId = await createUser(adminEmail, PASSWORD);
  await insert("platform_admins", { user_id: adminId });
  const adminAal1 = await ownerClient(adminEmail);
  const name = mediaFile(mediaFolder(b.id, randomUUID()), 480, "image/webp");
  expect((await adminAal1.storage.from("business-media").upload(name, webp(), { contentType: "image/webp" })).error).not.toBeNull();
  await insert("support_access", { business_id: a.id, admin_id: adminId, reason: "Adding the hero photo" });
  expect((await dbA.from("support_access").select("reason").eq("business_id", a.id)).data).toEqual([{ reason: "Adding the hero photo" }]);
});
