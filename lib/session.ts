import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  email?: string | null;
  exp: number;
};

const COOKIE_NAME = "blackdz_session";
const STATE_COOKIE = "blackdz_oauth_state";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET não configurado.");
  return value;
}

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: Omit<SessionUser, "exp">) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }),
  );
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const unsigned = `${header}.${body}`;
    const expected = sign(unsigned);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser;
    if (!parsed.id || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function setSession(user: Omit<SessionUser, "exp">) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function createOAuthState() {
  const state = crypto.randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return state;
}

export async function consumeOAuthState(received: string | null) {
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  store.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return Boolean(received && expected && received === expected);
}
