import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";
import {
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGINS,
  PARTNER_COOKIE_NAME,
  createPartnerSession,
  hashPassword,
  lockoutRemaining,
  normaliseEmail,
  partnerCookieOptions,
  verifyPassword,
} from "@/lib/partnerAuth";

// Signing a channel partner in.
//
// Every failure says the same sentence. "No account with that email" tells a
// stranger which of our partners exist, and that is a list of local businesses
// worth calling — the one thing a competitor would most like to be handed.
//
// The exception is a locked account, because a partner who has genuinely
// forgotten their password needs to know why the right one stopped working,
// and by then they have already proved they know the email.

const GENERIC = "That email and password don't match an account.";

/**
 * A throwaway hash to compare against when the email is unknown, built once
 * per process. Its only job is to make the "no such account" path cost about
 * what a real check costs, so response time doesn't answer a question the
 * error message refuses to.
 */
const DECOY_HASH: Promise<string> = hashPassword("decoy-password-nobody-uses");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normaliseEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const partner = await prisma.channelPartner.findUnique({
    where: { email },
    select: {
      id: true,
      status: true,
      passwordHash: true,
      failedLogins: true,
      lockedUntil: true,
    },
  });

  if (!partner || !partner.passwordHash) {
    await verifyPassword(password, await DECOY_HASH);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const locked = lockoutRemaining(partner.lockedUntil);
  if (locked > 0) {
    return NextResponse.json(
      {
        error:
          `Too many wrong passwords. Try again in ${locked} minute${locked === 1 ? "" : "s"}, ` +
          `or give us a call on ${COMPANY.phone}.`,
      },
      { status: 429 },
    );
  }

  const ok = await verifyPassword(password, partner.passwordHash);

  if (!ok) {
    const failed = partner.failedLogins + 1;
    await prisma.channelPartner.update({
      where: { id: partner.id },
      data: {
        failedLogins: failed,
        lockedUntil:
          failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
      },
    });
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  // An account switched off in the admin dash can hold the right password and
  // still not get in. Checked after the password, so this doesn't become a way
  // to find out which accounts are suspended.
  if (partner.status === "INACTIVE") {
    return NextResponse.json(
      { error: `This account is switched off. Give us a call on ${COMPANY.phone}.` },
      { status: 403 },
    );
  }

  await prisma.channelPartner.update({
    where: { id: partner.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const { token, expiresAt } = await createPartnerSession(
    partner.id,
    req.headers.get("user-agent"),
  );

  const res = NextResponse.json({ ok: true, redirect: "/channel-partners/portal" });
  res.cookies.set(PARTNER_COOKIE_NAME, token, partnerCookieOptions(expiresAt));
  return res;
}
