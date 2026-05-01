import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export type UserRole = "sia_admin" | "project_admin" | "participant";

export interface SessionPayload {
  sub: string; // user id
  role: UserRole;
  name: string;
  email: string;
  projectId?: string | null;
  teamId?: string | null;
  [key: string]: unknown;
}

const SESSION_COOKIE = "agentlaunch_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const raw =
    process.env.AUTH_SECRET ||
    "agentlaunch-dev-only-secret-change-me-please-1234567890";
  return new TextEncoder().encode(raw);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Attach the session cookie directly to a NextResponse.
 *
 * Setting cookies via the request-scoped `cookies()` helper is unreliable
 * inside Route Handlers under Next.js 15/16 — the cookie sometimes isn't
 * flushed to the response. Setting it on the NextResponse explicitly is
 * the canonical pattern.
 */
export async function attachSessionCookie<T>(
  res: NextResponse<T>,
  payload: SessionPayload,
): Promise<NextResponse<T>> {
  const token = await signSession(payload);
  res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
  return res;
}

export function clearSessionCookieOn<T>(res: NextResponse<T>): NextResponse<T> {
  res.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}

/**
 * Read the session cookie from the request scope. Used by Server
 * Components and `requireSession()` calls in API routes.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(role?: UserRole): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (role && session.role !== role) throw new Error("FORBIDDEN");
  return session;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

