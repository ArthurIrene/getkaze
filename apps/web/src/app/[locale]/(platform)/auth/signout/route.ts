import { NextResponse, type NextRequest } from "next/server";
import { platformHref, requestOrigin } from "@/lib/auth/paths";
import { supabaseConfigured } from "@/lib/supabase/env";
import { platformClient } from "@/lib/supabase/server";

/** POST only: sign out and go to the login page. */
export async function POST(request: NextRequest, { params }: RouteContext<"/[locale]/auth/signout">) {
  const { locale } = await params;
  if (supabaseConfigured()) await (await platformClient()).auth.signOut();
  return NextResponse.redirect(new URL(platformHref("/login", locale), requestOrigin(request.headers)), 303);
}
