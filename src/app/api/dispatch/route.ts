import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { siteOrigin } from "@/lib/siteOrigin";
import { sendTextMessage } from "@/lib/notify";
import {
  OFFER_FANOUT,
  eligibleCrews,
  offerExpiry,
  offerMessage,
} from "@/lib/integrations/dispatch";

// Offer a job to crews.
//
// POST { estimateId, fanout? } → offers created and texted to the nearest
// eligible crews. First to tap /api/dispatch/accept gets it.
//
// The work amount is read from the estimate's cost line and never accepted
// from the caller. A dispatch amount posted by a browser is a figure
// somebody can edit, and this one becomes what a crew is owed.

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { estimateId?: string; fanout?: number };
  const estimateId = typeof body.estimateId === "string" ? body.estimateId.trim() : "";
  if (!estimateId) return NextResponse.json({ error: "Missing estimateId." }, { status: 400 });

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: {
      id: true,
      status: true,
      costTotal: true,
      requiresAdminOverride: true,
      overrideAt: true,
      lead: { select: { id: true, city: true, state: true, trade: true, workerId: true } },
      offers: { select: { id: true, status: true, workerId: true } },
    },
  });
  if (!estimate) return NextResponse.json({ error: "Estimate not found." }, { status: 404 });

  // A job that has not cleared the margin floor must not be dispatched: the
  // crew would be promised money out of a job that cannot pay everyone.
  if (estimate.requiresAdminOverride && !estimate.overrideAt) {
    return NextResponse.json(
      { error: "This job is under the margin floor and has not been signed off. Review it first." },
      { status: 409 },
    );
  }
  if (estimate.lead.workerId) {
    return NextResponse.json({ error: "This job already has a crew." }, { status: 409 });
  }
  if (estimate.offers.some((o) => o.status === "ACCEPTED")) {
    return NextResponse.json({ error: "This job has already been accepted." }, { status: 409 });
  }

  const alreadyOffered = new Set(estimate.offers.map((o) => o.workerId));

  const crews = await prisma.worker.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      phone: true,
      state: true,
      city: true,
      generalLiabilityOnFile: true,
      insuranceExpiresAt: true,
      w9OnFile: true,
      status: true,
    },
    take: 200,
  });

  const { eligible, blocked } = eligibleCrews(crews, { state: estimate.lead.state });
  const targets = eligible.filter((c) => !alreadyOffered.has(c.id) && c.phone).slice(
    0,
    Math.max(1, Math.min(Number(body.fanout) || OFFER_FANOUT, 20)),
  );

  if (targets.length === 0) {
    return NextResponse.json(
      {
        error: "No eligible crew to offer this to.",
        // Returned so the dispatcher can see it is an insurance problem
        // rather than a coverage problem — the two need different fixes.
        blocked,
      },
      { status: 409 },
    );
  }

  const expiresAt = offerExpiry();
  const trade = estimate.lead.trade ?? "home improvement";
  const origin = siteOrigin();

  const created: { crew: string; sent: boolean }[] = [];

  for (const crew of targets) {
    const offer = await prisma.dispatchOffer.create({
      data: {
        estimateId: estimate.id,
        workerId: crew.id,
        workAmount: estimate.costTotal,
        expiresAt,
      },
      select: { token: true },
    });

    const sent = await sendTextMessage(
      crew.phone!,
      offerMessage({
        workAmount: estimate.costTotal,
        trade,
        city: estimate.lead.city,
        state: estimate.lead.state,
        acceptUrl: `${origin}/crew/offer/${offer.token}`,
      }),
    );
    created.push({ crew: crew.name, sent });
  }

  return NextResponse.json(
    {
      ok: true,
      offered: created.length,
      workAmount: estimate.costTotal,
      expiresAt,
      crews: created,
      blocked,
    },
    { status: 201 },
  );
}
