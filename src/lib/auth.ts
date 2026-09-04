import crypto from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "p0k3r_admin_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("Set ADMIN_PASSWORD (and ideally SESSION_SECRET) in your environment.");
  }
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

const SESSION_PAYLOAD = "admin-ok";

export function createAdminSessionCookieValue() {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
}

export function isValidAdminSessionCookie(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  const [payload, signature] = cookieValue.split(".");
  if (payload !== SESSION_PAYLOAD || !signature) return false;
  const expected = sign(SESSION_PAYLOAD);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminRequest(req: NextRequest) {
  return isValidAdminSessionCookie(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
