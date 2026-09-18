import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partnerFromRequest } from "@/lib/partnerAuth";
import { CHANNEL_PARTNER_TERMS_VERSION } from "@/lib/regions/channelPartnerAgreement";

// Accepting the partner terms.
//
// The version is taken from the server, never from the request. A client that
// could name the version it accepted could claim to have accepted one that was
// never shown to it.

export async function POST(req: NextRequest) {
  const partner = await partnerFromRequest(req);
  if (!partner) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.accepted !== true) {
    return NextResponse.json({ error: "Tick the box to carry on." }, { status: 400 });
  }

  // Best effort, and only for reconstructing an acceptance later. Behind a
  // proxy the first entry of x-forwarded-for is the client.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  await prisma.channelPartner.update({
    where: { id: partner.id },
    data: {
      termsAcceptedAt: new Date(),
      termsVersion: CHANNEL_PARTNER_TERMS_VERSION,
      termsAcceptedIp: ip,
    },
  });

  return NextResponse.json({ ok: true, redirect: "/channel-partners/portal" });
}
