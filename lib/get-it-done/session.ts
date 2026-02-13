import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "gid-session";
const THIRTY_DAYS = 30 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(slug: string): Promise<string> {
  return new SignJWT({ slug })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${THIRTY_DAYS}s`)
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifySession(
  token: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.slug as string) || null;
  } catch {
    return null;
  }
}

export async function getSessionSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=${token}; Path=/get-it-done; HttpOnly; SameSite=Lax; Max-Age=${THIRTY_DAYS}; ${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/get-it-done; HttpOnly; SameSite=Lax; Max-Age=0;`;
}
