import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/partnerAuth";

// Logins for the crews who now measure and sell.
//
// This is a more powerful login than a channel partner's. A partner sees their
// own referrals; a contractor writes estimates and takes a homeowner's money,
// so the token we text is only ever an invitation here — it is not left
// standing as a credential the way a partner's was before passwords existed.
//
// The password hashing itself is imported rather than reimplemented. There is
// one scrypt routine in this codebase and one stored-hash format, and a second
// copy is how the two drift until one of them is the weak one.

export const CREW_COOKIE_NAME = "lma_crew_session";
export const CREW_SESSION_DAYS = 14;
export const CREW_MAX_FAILED_LOGINS = 5;
export const CREW_LOCKOUT_MINUTES = 15;

/**
 * Shorter sessions than a partner's thirty days.
 *
 * A partner checks their referrals from a desk. A contractor is signed in on a
 * phone that lives in a truck and spends its day on roofs, and that phone gets
 * lost. Two weeks is the compromise between that and making somebody type a
 * password at a kitchen table with a homeowner watching.
 */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionCrew = {
  id: string;
  name: string;
  status: string;
  portalToken: string;
  /** No W-9, no payout — surfaced so the portal can say so before a job, not after. */
  w9OnFile: boolean;
  trades: string | null;
  state: string | null;
};

const CREW_SELECT = {
  id: true,
  name: true,
  status: true,
  portalToken: true,
  w9OnFile: true,
  trades: true,
  state: true,
} as const;

export async function createCrewSession(
  workerId: string,
  userAgent?: string | null,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + CREW_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.workerSession.create({
    data: {
      workerId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: userAgent ? userAgent.slice(0, 300) : null,
    },
  });
  return { token, expiresAt };
}

export async function crewFromSessionToken(token: string | undefined): Promise<SessionCrew | null> {
  if (!token || token.length < 32) return null;

  const session = await prisma.workerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, worker: { select: CREW_SELECT } },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.workerSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // A crew taken off the roster stops being able to write estimates the moment
  // somebody sets them INACTIVE, without anybody having to hunt for devices.
  if (session.worker.status !== "ACTIVE") return null;

  return session.worker;
}

export async function destroyCrewSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.workerSession.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
}

export async function destroyAllCrewSessions(workerId: string): Promise<void> {
  await prisma.workerSession.deleteMany({ where: { workerId } });
}

export async function crewFromRequest(req: NextRequest): Promise<SessionCrew | null> {
  return crewFromSessionToken(req.cookies.get(CREW_COOKIE_NAME)?.value);
}

/** The signed-in crew for a page, or null. */
export async function crewFromCookies(): Promise<SessionCrew | null> {
  return crewFromSessionToken(cookies().get(CREW_COOKIE_NAME)?.value);
}

/** The signed-in crew, or straight to the login. Never returns for a stranger. */
export async function requireCrew(): Promise<SessionCrew> {
  const crew = await crewFromCookies();
  if (!crew) redirect("/crew/login");
  return crew;
}

export function crewCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export { hashPassword, verifyPassword };
