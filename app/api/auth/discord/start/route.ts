import { NextRequest, NextResponse } from "next/server";
import { createOAuthStateValue, OAUTH_STATE_COOKIE_NAME, RETURN_TO_COOKIE_NAME, oauthCookieOptions } from "@/lib/session";
import { siteUrl } from "@/lib/config";

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "DISCORD_CLIENT_ID não configurado." }, { status: 500 });

  const state = createOAuthStateValue();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/dashboard";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${siteUrl()}/api/auth/discord/callback`,
    scope: "identify email",
    state,
  });

  const response = NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, oauthCookieOptions());
  response.cookies.set(RETURN_TO_COOKIE_NAME, safeReturnTo, oauthCookieOptions());
  return response;
}
