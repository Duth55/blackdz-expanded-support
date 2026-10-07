import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOAuthState } from "@/lib/session";
import { siteUrl } from "@/lib/config";

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "DISCORD_CLIENT_ID não configurado." }, { status: 500 });

  const state = await createOAuthState();
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/dashboard";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const store = await cookies();
  store.set("blackdz_return_to", safeReturnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${siteUrl()}/api/auth/discord/callback`,
    scope: "identify email",
    state,
  });
  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
