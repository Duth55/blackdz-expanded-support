import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  OAUTH_STATE_COOKIE_NAME,
  RETURN_TO_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  oauthCookieOptions,
  sessionCookieOptions,
} from "@/lib/session";
import { siteUrl } from "@/lib/config";
import { upsertDiscordUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const receivedState = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!code || !receivedState || !expectedState || receivedState !== expectedState) {
    const response = NextResponse.redirect(`${siteUrl()}/?auth=invalid_state`);
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", oauthCookieOptions(0));
    response.cookies.set(RETURN_TO_COOKIE_NAME, "", oauthCookieOptions(0));
    return response;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Credenciais OAuth do Discord não configuradas." }, { status: 500 });
  }

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

  const sessionUser = {
    id: user.id as string,
    username: user.username as string,
    globalName: (user.global_name as string | null) || null,
    avatar: (user.avatar as string | null) || null,
    email: (user.email as string | null) || null,
  };

  await upsertDiscordUser(sessionUser);

  const returnTo = request.cookies.get(RETURN_TO_COOKIE_NAME)?.value || "/dashboard";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const response = NextResponse.redirect(`${siteUrl()}${safeReturnTo}`);

  // Define os cookies diretamente na resposta do callback. Isso evita casos em
  // que o login parece concluir, mas a chamada seguinte à API não recebe sessão.
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(sessionUser), sessionCookieOptions());
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", oauthCookieOptions(0));
  response.cookies.set(RETURN_TO_COOKIE_NAME, "", oauthCookieOptions(0));
  return response;
}
