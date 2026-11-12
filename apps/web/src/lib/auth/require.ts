import "server-only";
import { redirect } from "next/navigation";
import { canEnter, type Area } from "@getkaze/core";
import { platformHref } from "./paths";
import { sessionFacts } from "./session";
import { platformClient } from "@/lib/supabase/server";

const targets = {
  login: "/login",
  "mfa-enroll": "/admin/mfa/enroll",
  "mfa-verify": "/admin/mfa",
  owner: "/owner",
  "no-site": "/owner",
} as const;

/** Enter an area or be sent where packages/core canEnter says. RLS checks every query again. */
export async function requireArea(area: Area, locale: string) {
  const supabase = await platformClient();
  const facts = await sessionFacts(supabase);
  const entry = canEnter(area, facts);
  if (!entry.ok && !(area === "owner" && entry.to === "no-site")) redirect(platformHref(targets[entry.to], locale));
  return { supabase, facts, entry };
}
