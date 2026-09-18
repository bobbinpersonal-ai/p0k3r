import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import type { ScryptOptions } from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword, MIN_PASSWORD_LENGTH } from "@/lib/partnerPassword";

// Re-exported so server code has one place to import auth from. Client
// components must import these from partnerPassword directly — see its header.
export { checkPassword, MIN_PASSWORD_LENGTH };
export type { PasswordProblem } from "@/lib/partnerPassword";

// Logins for channel partners.
//
// Until this existed a partner's portal was reached by an unguessable URL we
// texted them, and that URL was the credential. It worked for the first call —
// nobody signs up for an account before they have decided to trust you — but
// it has two ends that fray. A forwarded text is full access to somebody
// else's customer list, and there is no way to take access back when a
// partnership ends short of rotating a token they may have bookmarked.
//
// So: a real password, a real session, and the texted link demoted to an
// invitation that stops working the moment it has been used to set one.
//
// No new dependency. bcrypt and argon2 are native modules, which are a
// recurring source of deploy failures on serverless, and Node ships scrypt —
// a memory-hard KDF that is on OWASP's acceptable list. The parameters are
// stored alongside the hash so they can be raised later without invalidating
// everybody's password.

/**
 * scrypt as a promise.
 *
 * Hand-rolled rather than promisify(scrypt), whose type only covers the
 * three-argument overload — passing the cost parameters is the entire point
 * here, so the wrapper types them instead.
 */
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

/**
 * scrypt cost. N=16384 r=8 p=1 needs about 16MB and lands around 50–100ms,
 * which is the right trade for a login form: slow enough to make guessing
 * expensive, fast enough that a serverless function isn't billed for it.
 *
 * maxmem is raised explicitly because Node's 32MB default sits close enough
 * to what these parameters ask for that a future bump to N would start
 * throwing instead of getting slower.
 */
const SCRYPT = { N: 16_384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };

export const PARTNER_COOKIE_NAME = "lma_partner_session";

/** Thirty days. A partner checks their leads weekly at most. */
export const SESSION_DAYS = 30;

/**
 * Wrong passwords before the account stops answering, and for how long.
 *
 * Five is generous for a human and hopeless for a script: at fifteen minutes
 * a lockout, an attacker gets twenty guesses a day against a password they
 * cannot test offline.
 */
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

/**
 * A stored password: algorithm and parameters first, so a hash written today
 * can still be verified after the cost is raised.
 *
 * Format: scrypt$N$r$p$saltHex$hashHex
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, SCRYPT.keylen, SCRYPT);
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
}

/**
 * Constant-time check against a stored hash.
 *
 * Returns false rather than throwing on anything malformed: a corrupt row
 * should fail the login, not 500 the login route and tell an attacker that
 * this particular account is interesting.
 */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "hex");
    expected = Buffer.from(parts[5], "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const derived = await scryptAsync(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: SCRYPT.maxmem,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    // Bad parameters in the stored string — treat as a failed login.
    return false;
  }
}

/**
 * Session tokens are hashed before storage, the same way passwords are, for
 * the same reason: a leaked database should not hand somebody a working
 * session. SHA-256 rather than scrypt because the token is 256 bits of
 * randomness — there is nothing to brute force, so a slow hash would only
 * tax us.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Issues a session and returns the raw token — the only time we ever see it. */
export async function createPartnerSession(
  channelPartnerId: string,
  userAgent?: string | null,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.channelPartnerSession.create({
    data: {
      channelPartnerId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: userAgent ? userAgent.slice(0, 300) : null,
    },
  });
  return { token, expiresAt };
}

export type SessionPartner = {
  id: string;
  businessName: string;
  contactName: string;
  email: string | null;
  status: string;
  portalToken: string;
};

/**
 * The partner this session belongs to, or null.
 *
 * An expired row is deleted rather than left to accumulate — this is the only
 * thing that ever visits it, so it is the only place that can clean it up
 * without a cron job.
 */
export async function partnerFromSessionToken(
  token: string | undefined,
): Promise<SessionPartner | null> {
  if (!token || token.length < 32) return null;

  const session = await prisma.channelPartnerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      channelPartner: {
        select: {
          id: true,
          businessName: true,
          contactName: true,
          email: true,
          status: true,
          portalToken: true,
        },
      },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.channelPartnerSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // An account switched off in the admin dash stops working here, which is
  // the whole reason sessions live in the database instead of in a signed
  // cookie we could never take back.
  if (session.channelPartner.status === "INACTIVE") {
    return null;
  }

  return session.channelPartner;
}

/** Signs one session out. Unknown tokens are a no-op, not an error. */
export async function destroyPartnerSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.channelPartnerSession
    .deleteMany({ where: { tokenHash: hashToken(token) } })
    .catch(() => {});
}

/** Signs a partner out everywhere — used when the password changes. */
export async function destroyAllPartnerSessions(channelPartnerId: string): Promise<void> {
  await prisma.channelPartnerSession.deleteMany({ where: { channelPartnerId } });
}

/** The session partner for an API route, or null. */
export async function partnerFromRequest(req: NextRequest): Promise<SessionPartner | null> {
  return partnerFromSessionToken(req.cookies.get(PARTNER_COOKIE_NAME)?.value);
}

/** Cookie options shared by every route that sets this cookie. */
export function partnerCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/** Emails are compared lowercased and trimmed, everywhere, without exception. */
export function normaliseEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 160) : "";
}

/** Good enough to catch a typo. Anything stricter rejects real addresses. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Digits only, for comparing a phone number somebody typed to one on file. */
export function phoneDigits(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

/** Whether an account is currently locked out, and until when. */
export function lockoutRemaining(lockedUntil: Date | null): number {
  if (!lockedUntil) return 0;
  const ms = lockedUntil.getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

/**
 * Whether this request may act as the partner behind `token`.
 *
 * The write routes — submitting a lead, changing the customer-list URL — used
 * to accept the token alone, which was consistent with the portal accepting
 * it alone. Now that a password retires the token for reading, it has to
 * retire it for writing too, or a forwarded text could still point our
 * customer-list link at somebody else's spreadsheet.
 *
 * Returns the partner id when allowed, null when not.
 */
export async function authorisePartnerToken(
  req: NextRequest,
  token: string,
): Promise<string | null> {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: token },
    select: { id: true, passwordHash: true, status: true },
  });
  if (!partner || partner.status === "INACTIVE") return null;

  // Never claimed: the link is still the only credential they have.
  if (!partner.passwordHash) return partner.id;

  const session = await partnerFromRequest(req);
  return session?.id === partner.id ? partner.id : null;
}
