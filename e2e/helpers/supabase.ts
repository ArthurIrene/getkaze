/**
 * Test helpers for the LOCAL Supabase only (CI and local runs): the CLI's
 * public default keys, the bundled Mailpit inbox. Never pointed at a hosted
 * project: the helpers refuse any URL that is not on 127.0.0.1 or localhost.
 */
import { createHmac, randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:25324";

function assertLocal() {
  const host = new URL(url || "http://invalid").hostname;
  if (!["127.0.0.1", "localhost"].includes(host)) throw new Error(`Refusing to run auth tests against ${host}: local Supabase only.`);
  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY (local default) is not set.");
}

async function call(path: string, init: RequestInit & { key?: string } = {}) {
  assertLocal();
  const key = init.key ?? service;
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body };
}

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${randomBytes(3).toString("hex")}@example.test`;
export const uniqueSlug = (tag: string) => `${tag}-${randomBytes(4).toString("hex")}`;

export async function createUser(email: string, password: string): Promise<string> {
  const r = await call("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) });
  if (r.status >= 300) throw new Error(`createUser ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id;
}

export async function inviteUser(email: string): Promise<string> {
  const r = await call("/auth/v1/invite", { method: "POST", body: JSON.stringify({ email }) });
  if (r.status >= 300) throw new Error(`invite ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id;
}

export async function insert(table: string, row: Record<string, unknown>) {
  const r = await call(`/rest/v1/${table}`, { method: "POST", body: JSON.stringify(row) });
  if (r.status >= 300) throw new Error(`insert ${table} ${r.status} ${JSON.stringify(r.body)}`);
  return r.body[0];
}

export async function select(table: string, query: string) {
  const r = await call(`/rest/v1/${table}?${query}`, { method: "GET" });
  if (r.status >= 300) throw new Error(`select ${table} ${r.status} ${JSON.stringify(r.body)}`);
  return r.body as Record<string, unknown>[];
}

/** A draft business with an owner membership (status as given). */
export async function businessWithOwner(userId: string, status: "invited" | "active" | "disabled" = "active", name = "Test Lodge") {
  const slug = uniqueSlug("test");
  const business = await insert("businesses", { slug, name, legal_name: `${name} Ltd`, preset: "hotel_lodge", style: "lodge" });
  await insert("memberships", { business_id: business.id, user_id: userId, roles: ["owner"], status });
  return { id: business.id as string, slug };
}

/** Public sign-up attempt with the anon key (must be refused: invite only). */
export async function trySignUp(email: string, password: string) {
  return call("/auth/v1/signup", { method: "POST", key: anon, body: JSON.stringify({ email, password }) });
}

/** The newest email to an address, from Mailpit (local inbox). Waits up to 10 s. */
export async function latestEmail(to: string): Promise<{ subject: string; html: string; link: string }> {
  for (let i = 0; i < 40; i++) {
    const search = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`).then((r) => r.json());
    const id = search.messages?.[0]?.ID;
    if (id) {
      const message = await fetch(`${mailpit}/api/v1/message/${id}`).then((r) => r.json());
      const html: string = message.HTML ?? "";
      const href = html.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1] ?? "";
      return { subject: message.Subject, html, link: href.replace(/&amp;/g, "&") };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No email to ${to}`);
}

/** RFC 6238 TOTP code (30 s, 6 digits, SHA-1) from a base32 secret, for the admin 2FA tests. */
export function totp(secret: string, at = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30000)));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}
