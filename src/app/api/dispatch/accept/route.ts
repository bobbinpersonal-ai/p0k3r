import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OFFER_EXPIRED_MESSAGE, OFFER_TAKEN_MESSAGE } from "@/lib/integrations/dispatch";

// A crew tapping "accept".
//
// THE RACE IS THE POINT OF THIS FILE. The same job is offered to five crews
// at once, and two of them can tap inside the same second. Reading the offer,
// checking nobody took it, then writing — the obvious shape — loses that race
// and hands the job to both, which means two crews drive to one address.
//
// So the win is decided by a single conditional UPDATE. `updateMany` with
// `status: "OFFERED"` in the WHERE clause compiles to
// `UPDATE ... WHERE status = 'OFFERED'` and returns how many rows it changed.
// Exactly one caller can ever see count === 1. The database arbitrates, once,
// and the loser gets a truthful message instead of an error.
//
// Unauthenticated on purpose: the token IS the credential. It is an
// unguessable uuid that only ever existed in one SMS to one crew, which is
// the same pattern as the homeowner's manage link. Requiring a login here
// would mean a crew on a roof has to remember a password to take work.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string; decline?: boolean; reason?: string };
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const offer = await prisma.dispatchOffer.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      workAmount: true,
      estimateId: true,
      workerId: true,
      estimate: { select: { leadId: true, lead: { select: { city: true, state: true } } } },
      worker: { select: { name: true } },
    },
  });
  if (!offer) return NextResponse.json({ error: "That link isn't valid." }, { status: 404 });

  if (body.decline) {
    await prisma.dispatchOffer.updateMany({
      where: { id: offer.id, status: "OFFERED" },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
        declineReason: typeof body.reason === "string" ? body.reason.slice(0, 500) : null,
      },
    });
    return NextResponse.json({ ok: true, outcome: "DECLINED" });
  }

  if (offer.status === "ACCEPTED") {
    // Their own second tap, or somebody else won. Distinguish, because
    // "you already have this job" and "you lost it" are opposite news.
    const holder = await prisma.lead.findUnique({
      where: { id: offer.estimate.leadId },
      select: { workerId: true },
    });
    if (holder?.workerId === offer.workerId) {
      return NextResponse.json({ ok: true, outcome: "ALREADY_YOURS" });
    }
    return NextResponse.json({ ok: false, outcome: "TAKEN", message: OFFER_TAKEN_MESSAGE }, { status: 409 });
  }
  if (offer.status !== "OFFERED") {
    return NextResponse.json({ ok: false, outcome: "CLOSED", message: OFFER_TAKEN_MESSAGE }, { status: 409 });
  }
  if (offer.expiresAt < new Date()) {
    await prisma.dispatchOffer.updateMany({
      where: { id: offer.id, status: "OFFERED" },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ ok: false, outcome: "EXPIRED", message: OFFER_EXPIRED_MESSAGE }, { status: 409 });
  }

  // The arbitration. Exactly one caller gets count === 1.
  const won = await prisma.dispatchOffer.updateMany({
    where: { id: offer.id, status: "OFFERED" },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  if (won.count !== 1) {
    return NextResponse.json({ ok: false, outcome: "TAKEN", message: OFFER_TAKEN_MESSAGE }, { status: 409 });
  }

  // Won. Assign the crew and close every sibling offer in one transaction —
  // a crew who taps a withdrawn offer thirty seconds later should be told
  // it is gone, not be handed a second claim on the same job.
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: offer.estimate.leadId },
      data: { workerId: offer.workerId },
    }),
    prisma.dispatchOffer.updateMany({
      where: { estimateId: offer.estimateId, status: "OFFERED" },
      data: { status: "WITHDRAWN", respondedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    outcome: "ACCEPTED",
    workAmount: offer.workAmount,
    where: [offer.estimate.lead.city, offer.estimate.lead.state].filter(Boolean).join(", "),
  });
}
