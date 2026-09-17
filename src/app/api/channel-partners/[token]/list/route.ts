import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkListUrl } from "@/lib/regions/channelPartners";
import { notifyChannelPartnerListShared } from "@/lib/notify";

// A partner attaching (or replacing) the link to their customer list.
//
// Authenticated by the portal token in the path and nothing else, the same
// way /api/bookings/manage/[token] works: the token is unguessable, it is the
// only thing the partner has, and requiring an account before they can hand
// us the thing we called them about would lose most of them.
//
// The token is looked up rather than trusted — an unknown one is a 404, not
// an error message that tells the caller whether it nearly matched.

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    select: { id: true, businessName: true, contactName: true, phone: true },
  });
  if (!partner) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const check = checkListUrl(typeof body.url === "string" ? body.url : "");
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

  const updated = await prisma.channelPartner.update({
    where: { id: partner.id },
    data: {
      customerListUrl: check.url,
      listSharedAt: new Date(),
      // Sharing a list is the moment a name on a form becomes a live
      // partnership, so it takes them out of APPLIED whatever the phone
      // screen had got to.
      status: "ACTIVE",
    },
  });

  await notifyChannelPartnerListShared(updated);

  return NextResponse.json({ ok: true, url: updated.customerListUrl }, { status: 200 });
}
