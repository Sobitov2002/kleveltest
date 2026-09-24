import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "korean_practice_session";
function secret() { return process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "local-development-only-secret-change-me"); }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }

export async function createSession(userId: string) {
  if (!secret()) throw new Error("SESSION_SECRET is required in production.");
  const value = `${userId}.${Date.now() + 1000 * 60 * 60 * 24 * 30}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${value}.${sign(value)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function getSessionUserId() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [userId, expiry, signature] = token.split(".");
  if (!userId || !expiry || !signature || Number(expiry) < Date.now() || !secret()) return null;
  const payload = `${userId}.${expiry}`;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? userId : null;
}

export async function clearSession() { (await cookies()).delete(COOKIE_NAME); }
