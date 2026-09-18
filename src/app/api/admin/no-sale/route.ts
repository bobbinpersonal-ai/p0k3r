import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { getNoSaleReason } from "@/lib/regions/noSale";

// A rep filing why an appointment didn't close.
//
// Admin-gated, unlike the partner routes: this writes the record a partner
// will read as our account of what happened, and a form anybody could post to
// is not a record, it is a rumour.
//
// Upserts rather than inserts. A second visit that also fails updates the
// first note — three near-identical entries under one customer reads as
// excuses rather than as a history, and the partner is the audience.

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const leadId = clean(body.leadId, 40);
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const reason = clean(body.reason, 40).toUpperCase();
  if (!getNoSaleReason(reason)) {
    return NextResponse.json({ error: "Pick a reason from the list." }, { status: 400 });
  }

  const detail = clean(body.detail, 2000);
  if (detail.length < 10) {
    return NextResponse.json(
      { error: "Write a sentence the partner can actually read. Ten characters isn't it." },
      { status: 400 },
    );
  }

  const filedBy = clean(body.filedBy, 120);
  if (!filedBy) {
    return NextResponse.json({ error: "Put your name on it." }, { status: 400 });
  }

  const quotedRaw = Number(body.quotedAmount);
  const quotedAmount =
    Number.isFinite(quotedRaw) && quotedRaw > 0 ? Math.round(quotedRaw) : null;

  const revisitRaw = clean(body.revisitAt, 20);
  const revisitAt = revisitRaw ? new Date(revisitRaw) : null;
  if (revisitAt && Number.isNaN(revisitAt.getTime())) {
    return NextResponse.json({ error: "That revisit date doesn't parse." }, { status: 400 });
  }

  const data = {
    reason,
    detail,
    filedBy,
    quotedAmount,
    customerAcknowledged: body.customerAcknowledged === true,
    revisitAt,
  };

  const report = await prisma.noSaleReport.upsert({
    where: { leadId: lead.id },
    create: { leadId: lead.id, ...data },
    update: data,
  });

  // Filing the note is what moves the lead, so the two can never disagree —
  // a NO_SALE lead with no note, or a note on a lead still showing as sold,
  // are both states a partner would rightly ask about.
  await prisma.lead.update({ where: { id: lead.id }, data: { status: "NO_SALE" } });

  return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
}
