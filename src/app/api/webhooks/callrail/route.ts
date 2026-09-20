import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  attributionLabel,
  parseCallEvent,
  verifyCallRailWebhook,
  worthALead,
} from "@/lib/integrations/callrail";

// An inbound call, attributed.
//
// A caller who rang us has plainly enquired, so the call consent window
// opens legitimately and is recorded with its source — which is what makes
// it evidence rather than a flag. See consent.ts.

export async function POST(req: NextRequest) {
  if (!verifyCallRailWebhook(req.headers.get("x-callrail-signature"))) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }

  const event = parseCallEvent(await req.json().catch(() => null));
  if (!event) return NextResponse.json({ error: "Unrecognised payload." }, { status: 400 });
  if (!event.customerPhone) return NextResponse.json({ ok: true, ignored: "no caller number" });

  const now = new Date();
  const source = attributionLabel(event);

  const existing = await prisma.lead.findFirst({
    where: { customerPhone: event.customerPhone },
    select: { id: true, source: true },
  });

  if (existing) {
    await prisma.lead.update({
      where: { id: existing.id },
      data: {
        callConsentAt: now,
        callConsentSource: "INBOUND_CALL",
        lastCalledAt: now,
        // Do not overwrite an attribution we already have — first touch is
        // the one that earned the lead, and clobbering it on every later
        // call makes every customer look like they came from a phone call.
        source: existing.source ?? source,
      },
    });
    return NextResponse.json({ ok: true, leadId: existing.id, updated: true });
  }

  if (!worthALead(event)) {
    return NextResponse.json({ ok: true, ignored: "too short or unanswered" });
  }

  const lead = await prisma.lead.create({
    data: {
      customerName: "Inbound caller",
      customerPhone: event.customerPhone,
      address: "Address to confirm on call",
      status: "NEW",
      source,
      callConsentAt: now,
      callConsentSource: "INBOUND_CALL",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, leadId: lead.id, created: true }, { status: 201 });
}
