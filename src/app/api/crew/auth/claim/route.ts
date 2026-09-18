import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword } from "@/lib/partnerPassword";
import {
  CREW_COOKIE_NAME,
  crewCookieOptions,
  createCrewSession,
  destroyAllCrewSessions,
  hashPassword,
} from "@/lib/crewAuth";

// Turning the link we sent a crew into an account they can sign into.
//
// Same shape as the channel partner claim, and the same second check: holding
// the link is not enough, because links get forwarded. The crew confirms the
// last four digits of the phone number we have for them.

const LAST_N = 4;

const digitsOf = (v: unknown) => (typeof v === "string" ? v.replace(/\D/g, "") : "");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const typed = digitsOf(body.phoneLast4);

  if (!token) return NextResponse.json({ error: "Missing link." }, { status: 400 });

  const crew = await prisma.worker.findUnique({
    where: { portalToken: token },
    select: { id: true, name: true, phone: true, passwordHash: true, status: true },
  });
  if (!crew || crew.status === "INACTIVE") {
    return NextResponse.json({ error: "That link isn't valid." }, { status: 404 });
  }
  if (crew.passwordHash) {
    return NextResponse.json(
      { error: "This account already has a password. Sign in instead." },
      { status: 409 },
    );
  }

  const onFile = digitsOf(crew.phone).slice(-LAST_N);
  if (!onFile || typed.slice(-LAST_N) !== onFile) {
    return NextResponse.json(
      { error: `Those digits don't match the number we have for ${crew.name}.` },
      { status: 403 },
    );
  }

  const bad = checkPassword(password, [crew.name]);
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });

  await prisma.worker.update({
    where: { id: crew.id },
    data: {
      passwordHash: await hashPassword(password),
      passwordSetAt: new Date(),
      lastLoginAt: new Date(),
      failedLogins: 0,
      lockedUntil: null,
    },
  });
  await destroyAllCrewSessions(crew.id);

  const { token: sessionToken, expiresAt } = await createCrewSession(
    crew.id,
    req.headers.get("user-agent"),
  );
  const res = NextResponse.json({ ok: true, redirect: "/crew" });
  res.cookies.set(CREW_COOKIE_NAME, sessionToken, crewCookieOptions(expiresAt));
  return res;
}
