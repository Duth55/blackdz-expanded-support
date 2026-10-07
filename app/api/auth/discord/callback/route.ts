import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeOAuthState, setSession } from "@/lib/session";
import { siteUrl } from "@/lib/config";
import { upsertDiscordUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !(await consumeOAuthState(state))) {
    return NextResponse.redirect(`${siteUrl()}/?auth=invalid_state`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ error: "Credenciais OAuth do Discord não configuradas." }, { status: 500 });

  const redirectUri = `${siteUrl()}/api/auth/discord/callback`;
  const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) {
    return NextResponse.redirect(`${siteUrl()}/?auth=discord_error`);
  }

  const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const user = await userResponse.json();
  if (!userResponse.ok || !user.id) return NextResponse.redirect(`${siteUrl()}/?auth=user_error`);

  await setSession({
    id: user.id,
    username: user.username,
    globalName: user.global_name || null,
    avatar: user.avatar || null,
    email: user.email || null,
  });
  await upsertDiscordUser({
    id: user.id,
    username: user.username,
    globalName: user.global_name || null,
    avatar: user.avatar || null,
    email: user.email || null,
  });

  const store = await cookies();
  const returnTo = store.get("blackdz_return_to")?.value || "/dashboard";
  store.set("blackdz_return_to", "", { path: "/", maxAge: 0 });
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  return NextResponse.redirect(`${siteUrl()}${safeReturnTo}`);
}
