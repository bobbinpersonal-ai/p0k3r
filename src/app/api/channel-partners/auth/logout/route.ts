import { NextRequest, NextResponse } from "next/server";
import { PARTNER_COOKIE_NAME, destroyPartnerSession } from "@/lib/partnerAuth";

// Signing out deletes the session row, not just the cookie.
//
// Clearing the cookie alone would leave a working token behind for anyone who
// captured it, which rather defeats the point of somebody signing out on a
// shared computer.

export async function POST(req: NextRequest) {
  await destroyPartnerSession(req.cookies.get(PARTNER_COOKIE_NAME)?.value);
  const res = NextResponse.json({ ok: true, redirect: "/channel-partners/login" });
  res.cookies.set(PARTNER_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
