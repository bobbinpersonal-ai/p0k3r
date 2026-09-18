import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { JOURNEY } from "@/lib/regions/channelPartners";

// Moving a lead along the pipeline.
//
// The engine had no controls until this existed: leads arrived, and the only
// thing that could change one was the no-sale form. Everything else was a
// database edit, which means in practice nothing moved and the partner portal
// showed every referral stuck on "we're calling" forever.
//
// Statuses are validated against JOURNEY rather than against a free string,
// because the partner portal renders from the same list — a status typed here
// that JOURNEY doesn't know about renders to a partner as a raw enum.

const VALID = new Set(JOURNEY.map((s) => s.status));

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status.trim().toUpperCase() : "";
  if (!VALID.has(status)) {
    return NextResponse.json({ error: "Not a stage we recognise." }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true, noSaleReport: { select: { id: true } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  // NO_SALE is the one stage that has to come with an explanation, because a
  // partner reading their portal sees "quoted, no sale" and nothing else.
  // Filing the note is what sets it; this route won't shortcut that.
  if (status === "NO_SALE" && !lead.noSaleReport) {
    return NextResponse.json(
      { error: "File the no-sale note first — that's what sets this stage." },
      { status: 400 },
    );
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status,
      // Stamped so "how long has this been sitting" is answerable later. Only
      // on the forward move to ASSIGNED, which is when somebody picked it up.
      ...(status === "ASSIGNED" ? { assignedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ok: true, status }, { status: 200 });
}
