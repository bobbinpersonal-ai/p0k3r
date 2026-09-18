import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";
import { lockoutRemaining } from "@/lib/partnerAuth";
import {
  CREW_COOKIE_NAME,
  CREW_LOCKOUT_MINUTES,
  CREW_MAX_FAILED_LOGINS,
  crewCookieOptions,
  createCrewSession,
  hashPassword,
  verifyPassword,
} from "@/lib/crewAuth";

// Signing a crew in.
//
// Crews are looked up by phone rather than email. Half of them gave us a phone
// and no email on the application, it is the number we already call them on,
// and it is the thing they can type on a job site without a keyboard.

const GENERIC = "That phone and password don't match an account.";
const DECOY_HASH: Promise<string> = hashPassword("decoy-password-nobody-uses");

/** Digits only, so a number typed three different ways still matches. */
function phoneKey(value: unknown): string {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const digits = phoneKey(body?.phone);
  const password = typeof body?.password === "string" ? body.password : "";

  if (digits.length < 10 || !password) {
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  // Phone is not unique in the schema — it was never meant to identify anybody
  // — so the match happens on normalised digits here. Two rows sharing a number
  // is a conversation with the office, not a login to guess at.
  //
  // This pass deliberately selects no password hash: it is narrowing a roster
  // of crews to one row, and there is no reason for every contractor's hash to
  // pass through memory to answer "which one of you is this".
  const roster = await prisma.worker.findMany({
    where: { phone: { not: null }, passwordHash: { not: null } },
    select: { id: true, phone: true },
  });
  const matches = roster.filter((c) => phoneKey(c.phone) === digits);

  if (matches.length !== 1) {
    await verifyPassword(password, await DECOY_HASH);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const crew = await prisma.worker.findUnique({
    where: { id: matches[0].id },
    select: {
      id: true,
      status: true,
      passwordHash: true,
      failedLogins: true,
      lockedUntil: true,
    },
  });
  if (!crew) {
    await verifyPassword(password, await DECOY_HASH);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const locked = lockoutRemaining(crew.lockedUntil);
  if (locked > 0) {
    return NextResponse.json(
      {
        error:
          `Too many wrong passwords. Try again in ${locked} minute${locked === 1 ? "" : "s"}, ` +
          `or call the office on ${COMPANY.phone}.`,
      },
      { status: 429 },
    );
  }

  const ok = await verifyPassword(password, crew.passwordHash);
  if (!ok) {
    const failed = crew.failedLogins + 1;
    await prisma.worker.update({
      where: { id: crew.id },
      data: {
        failedLogins: failed,
        lockedUntil:
          failed >= CREW_MAX_FAILED_LOGINS
            ? new Date(Date.now() + CREW_LOCKOUT_MINUTES * 60 * 1000)
            : null,
      },
    });
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  // Checked after the password so this is not a way to find out who is on the
  // roster and who has been taken off it.
  if (crew.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `This account isn't active. Call the office on ${COMPANY.phone}.` },
      { status: 403 },
    );
  }

  await prisma.worker.update({
    where: { id: crew.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const { token, expiresAt } = await createCrewSession(crew.id, req.headers.get("user-agent"));
  const res = NextResponse.json({ ok: true, redirect: "/crew" });
  res.cookies.set(CREW_COOKIE_NAME, token, crewCookieOptions(expiresAt));
  return res;
}
