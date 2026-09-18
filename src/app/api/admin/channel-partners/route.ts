import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { serializeServices } from "@/lib/regions/channelPartners";
import { getRegion, regionForZip, REGIONS } from "@/lib/regions/states";
import { destroyAllPartnerSessions, looksLikeEmail, normaliseEmail } from "@/lib/partnerAuth";

// Creating a partner account from the internal dash.
//
// For the ordinary case: Kevin gets a yes on the phone and wants the account
// to exist before he hangs up, so he can read them the link while they are
// still listening.
//
// It deliberately cannot set a password. An admin who types somebody's
// password knows it, and this is an account that authorises payments — the
// partner needs to be the only one who could have signed in. So this creates
// the row and hands back the claim link; the partner sets their own password
// at the other end of it.

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function parseCount(value: unknown, max: number): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), max) : null;
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const businessName = clean(body.businessName, 160);
  const contactName = clean(body.contactName, 120);
  const phone = clean(body.phone, 32);
  const email = normaliseEmail(body.email);

  if (!businessName) return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  if (!contactName) return NextResponse.json({ error: "Contact name is required." }, { status: 400 });

  // The phone is not optional here even though it is elsewhere: it is what the
  // claim link checks against, so an account created without one could never
  // be claimed by anybody.
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "A full phone number is required — the claim link checks its last 4 digits." },
      { status: 400 },
    );
  }
  if (email && !looksLikeEmail(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  const zip = clean(body.zip, 10).replace(/\D/g, "").slice(0, 5);
  const region = regionForZip(zip) ?? getRegion(clean(body.state, 4));
  if (!region) {
    return NextResponse.json(
      { error: `Needs a state we cover: ${REGIONS.map((r) => r.name).join(", ")}.` },
      { status: 400 },
    );
  }

  if (email) {
    const taken = await prisma.channelPartner.findUnique({
      where: { email },
      select: { id: true, businessName: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: `${taken.businessName} already uses that email.` },
        { status: 409 },
      );
    }
  }

  let partner;
  try {
    partner = await prisma.channelPartner.create({
      data: {
        businessName,
        contactName,
        phone,
        email: email || null,
        industry: clean(body.industry, 80) || null,
        city: clean(body.city, 80) || null,
        state: region.code,
        approxListSize: parseCount(body.approxListSize, 100_000),
        services: serializeServices(Array.isArray(body.services) ? body.services : []),
        notes: clean(body.notes, 600) || null,
        source: clean(body.source, 40) || "admin",
        status: clean(body.status, 20) === "ACTIVE" ? "ACTIVE" : "APPLIED",
      },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't create that account." }, { status: 409 });
  }

  return NextResponse.json(
    {
      ok: true,
      id: partner.id,
      businessName: partner.businessName,
      portalToken: partner.portalToken,
      claimPath: `/channel-partners/${partner.portalToken}/claim`,
    },
    { status: 201 },
  );
}

/**
 * Clearing a password, so a locked-out partner can set a new one.
 *
 * There is no "email me a reset link" yet — these partners came from a phone
 * call and half of them have no email on file. This is the manual version:
 * Kevin unlocks the account and reads them the claim link, having recognised
 * their voice, which is a stronger check than an email loop anyway.
 *
 * Every existing session is destroyed at the same time. A reset that leaves
 * somebody signed in on a device is not a reset.
 */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = clean(body?.id, 40);
  const action = clean(body?.action, 30);

  const partner = await prisma.channelPartner.findUnique({
    where: { id },
    select: { id: true, portalToken: true, businessName: true },
  });
  if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });

  if (action !== "reset-password") {
    return NextResponse.json({ error: "Not an action we know." }, { status: 400 });
  }

  await prisma.channelPartner.update({
    where: { id: partner.id },
    data: { passwordHash: null, passwordSetAt: null, failedLogins: 0, lockedUntil: null },
  });
  await destroyAllPartnerSessions(partner.id);

  return NextResponse.json({
    ok: true,
    businessName: partner.businessName,
    claimPath: `/channel-partners/${partner.portalToken}/claim`,
  });
}
