import { NextResponse, type NextRequest } from "next/server";
import { confirmTarget } from "@getkaze/core";
import { platformHref, requestOrigin } from "@/lib/auth/paths";
import { platformClient } from "@/lib/supabase/server";

/**
 * Email links (invite, password reset) land here with a token hash. It is
 * verified on the server, the session is set in HttpOnly cookies, and the
 * visitor goes to a fixed page per link type (no open redirect).
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/[locale]/auth/confirm">) {
  const { locale } = await params;
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const target = confirmTarget(type);
  const to = (path: string) => NextResponse.redirect(new URL(platformHref(path, locale), requestOrigin(request.headers)), 303);
  if (!tokenHash || !target) return to("/login");
  const supabase = await platformClient();
  const { error } = await supabase.auth.verifyOtp({ type: type as "invite" | "recovery", token_hash: tokenHash });
  if (error) return NextResponse.redirect(new URL(`${platformHref("/login", locale)}?error=link`, requestOrigin(request.headers)), 303);
  return to(target);
}
