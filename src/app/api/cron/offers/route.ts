import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Expire stale dispatch offers.
//
// An offer nobody answered has to close, or the job sits in limbo looking
// offered while the homeowner waits. Expiring it also frees the estimate to
// be re-offered to a wider set of crews.
//
// Deliberately does NOT auto-re-offer. Widening the net is a judgement about
// whether to go further afield or drop the price, and a cron that silently
// keeps broadening the search is a cron that eventually texts somebody four
// states away at 3am. It reports what expired; a human decides what next.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const now = new Date();

  const expired = await prisma.dispatchOffer.updateMany({
    where: { status: "OFFERED", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // Jobs that now have no live offer and no crew — the thing somebody needs
  // to look at this morning.
  const stranded = await prisma.estimate.findMany({
    where: {
      status: "SOLD",
      lead: { workerId: null },
      offers: { some: {} , none: { status: { in: ["OFFERED", "ACCEPTED"] } } },
    },
    select: {
      id: true,
      costTotal: true,
      lead: { select: { customerName: true, city: true, state: true } },
    },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    expired: expired.count,
    stranded: stranded.map((e) => ({
      estimateId: e.id,
      customer: e.lead.customerName,
      where: [e.lead.city, e.lead.state].filter(Boolean).join(", "),
      workAmount: e.costTotal,
    })),
  });
}
