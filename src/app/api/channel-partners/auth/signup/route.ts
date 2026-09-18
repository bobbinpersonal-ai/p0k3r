import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewChannelPartnerApplication } from "@/lib/notify";
import { serializeServices } from "@/lib/regions/channelPartners";
import { getRegion, regionForZip, REGIONS } from "@/lib/regions/states";
import {
  PARTNER_COOKIE_NAME,
  checkPassword,
  createPartnerSession,
  hashPassword,
  looksLikeEmail,
  normaliseEmail,
  partnerCookieOptions,
} from "@/lib/partnerAuth";

// A business creating its own account.
//
// The other door into the program is /api/intake/channel-partners, the short
// form on the marketing page that Kevin texts from a cold call. That one asks
// for as little as possible on purpose, because a stranger who has been on the
// phone for four minutes will not build an account. This one is for somebody
// who arrived ready — they get a password now and never need the texted link.
//
// Both create the same ChannelPartner row. The only difference is whether
// passwordHash is filled in on the way past.

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function parseCount(value: unknown, max: number): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), max) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const businessName = clean(body.businessName, 160);
  const contactName = clean(body.contactName, 120);
  const phone = clean(body.phone, 32);
  const email = normaliseEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!businessName) return NextResponse.json({ error: "We need your business name." }, { status: 400 });
  if (!contactName) return NextResponse.json({ error: "We need your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }
  if (!looksLikeEmail(email)) {
    return NextResponse.json({ error: "We need an email you can sign in with." }, { status: 400 });
  }

  const badPassword = checkPassword(password, [businessName, email.split("@")[0]]);
  if (badPassword) return NextResponse.json({ error: badPassword }, { status: 400 });

  const zip = clean(body.zip, 10).replace(/\D/g, "").slice(0, 5);
  const region = regionForZip(zip) ?? getRegion(clean(body.state, 4));
  if (!region) {
    return NextResponse.json(
      {
        error:
          `We're not in that state yet. The network is ` +
          `${REGIONS.map((r) => r.name).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Checked before writing for a readable message, and caught again below,
  // because between the check and the insert is exactly where a duplicate
  // signup lands when somebody double-taps the button.
  const taken = await prisma.channelPartner.findUnique({
    where: { email },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json(
      { error: "There's already an account on that email. Sign in instead, or reset it with us." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  let partner;
  try {
    partner = await prisma.channelPartner.create({
      data: {
        businessName,
        contactName,
        phone,
        email,
        passwordHash,
        passwordSetAt: new Date(),
        lastLoginAt: new Date(),
        industry: clean(body.industry, 80) || null,
        city: clean(body.city, 80) || null,
        state: region.code,
        approxListSize: parseCount(body.approxListSize, 100_000),
        services: serializeServices(Array.isArray(body.services) ? body.services : []),
        clientBase: clean(body.clientBase, 200) || null,
        notes: clean(body.notes, 600) || null,
        source: clean(body.source, 40) || "signup",
        status: "APPLIED",
      },
    });
  } catch {
    // Almost certainly the unique index on email doing its job.
    return NextResponse.json(
      { error: "There's already an account on that email. Sign in instead." },
      { status: 409 },
    );
  }

  await notifyNewChannelPartnerApplication(partner);

  const { token, expiresAt } = await createPartnerSession(
    partner.id,
    req.headers.get("user-agent"),
  );

  const res = NextResponse.json(
    { ok: true, id: partner.id, redirect: "/channel-partners/portal" },
    { status: 201 },
  );
  res.cookies.set(PARTNER_COOKIE_NAME, token, partnerCookieOptions(expiresAt));
  return res;
}
