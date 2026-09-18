import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PARTNER_COOKIE_NAME,
  checkPassword,
  createPartnerSession,
  destroyAllPartnerSessions,
  hashPassword,
  looksLikeEmail,
  normaliseEmail,
  partnerCookieOptions,
  phoneDigits,
} from "@/lib/partnerAuth";

// Turning a texted link into an account.
//
// This is the migration path for every partner signed up before logins
// existed, and the normal path for anyone Kevin creates an account for from
// the admin dash. They already hold the portalToken; what they don't have is
// a password, and this is where they set one.
//
// Holding the link is not enough on its own. A link sent by text gets
// forwarded — "look at this thing someone sent me" — and if the link alone
// could set a password, whoever it reached could take the account and read
// somebody else's customer list. So the claim also asks for the last four
// digits of the phone number we have on file.
//
// That is not a strong secret. It is four digits, and it is on their website.
// What it stops is the realistic case: a link that travelled further than it
// was meant to, in the hands of somebody who was never on the call. Against
// somebody determined it buys very little, which is why the token stops
// opening the portal the moment a password exists.

const LAST_N = 4;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const digits = phoneDigits(body.phoneLast4);
  const email = normaliseEmail(body.email);

  if (!token) return NextResponse.json({ error: "Missing link." }, { status: 400 });

  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      businessName: true,
      email: true,
      phone: true,
      passwordHash: true,
      status: true,
    },
  });
  if (!partner) return NextResponse.json({ error: "That link isn't valid." }, { status: 404 });

  if (partner.passwordHash) {
    return NextResponse.json(
      { error: "This account already has a password. Sign in instead." },
      { status: 409 },
    );
  }
  // A cold-call prospect has agreed to nothing and its phone number is public,
  // so the last-4 check below is not a secret for these rows. Refused outright
  // until somebody promotes it — see src/lib/partnerAccess.ts.
  if (partner.status === "INACTIVE" || partner.status === "PROSPECT") {
    return NextResponse.json({ error: "That link isn't valid." }, { status: 404 });
  }

  const onFile = phoneDigits(partner.phone).slice(-LAST_N);
  if (!onFile || digits.slice(-LAST_N) !== onFile) {
    return NextResponse.json(
      { error: `Those digits don't match the number we have for ${partner.businessName}.` },
      { status: 403 },
    );
  }

  // An account created from a cold call may have no email yet, and they need
  // one to sign in with. If we already hold one, it stands — changing the
  // login address is not something a link should be able to do.
  let emailToUse = partner.email;
  if (!emailToUse) {
    if (!looksLikeEmail(email)) {
      return NextResponse.json(
        { error: "We need an email you can sign in with." },
        { status: 400 },
      );
    }
    const taken = await prisma.channelPartner.findUnique({
      where: { email },
      select: { id: true },
    });
    if (taken && taken.id !== partner.id) {
      return NextResponse.json(
        { error: "There's already an account on that email." },
        { status: 409 },
      );
    }
    emailToUse = email;
  }

  const badPassword = checkPassword(password, [partner.businessName, emailToUse.split("@")[0]]);
  if (badPassword) return NextResponse.json({ error: badPassword }, { status: 400 });

  const passwordHash = await hashPassword(password);

  try {
    await prisma.channelPartner.update({
      where: { id: partner.id },
      data: {
        email: emailToUse,
        passwordHash,
        passwordSetAt: new Date(),
        lastLoginAt: new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "There's already an account on that email." },
      { status: 409 },
    );
  }

  // Anything already signed in as this partner is signed out. Setting a
  // password is the moment the account becomes theirs alone.
  await destroyAllPartnerSessions(partner.id);

  const { token: sessionToken, expiresAt } = await createPartnerSession(
    partner.id,
    req.headers.get("user-agent"),
  );

  const res = NextResponse.json({ ok: true, redirect: "/channel-partners/portal" });
  res.cookies.set(PARTNER_COOKIE_NAME, sessionToken, partnerCookieOptions(expiresAt));
  return res;
}
