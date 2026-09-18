import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { channelPartnerPayout } from "@/lib/regions/channelPartners";

// Recording what a channel partner is owed on a finished job.
//
// The output side of the engine. Until this existed the payout arithmetic in
// channelPartners.ts was dead code — correct, tested by hand, and reachable
// by nothing — so a partner's ledger could only ever be filled in by someone
// editing the database.
//
// The amount is computed here rather than accepted from the client. A payout
// figure posted by a browser is a figure somebody can change in dev tools, and
// this one is a payment. The request names the lead; the server reads the
// signed estimate, runs the same function the partner page quotes, and writes
// what that returns.

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const leadId = clean(body.leadId, 40);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { estimate: true, channelPartner: { select: { id: true, businessName: true } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  if (!lead.channelPartner) {
    return NextResponse.json(
      { error: "This job didn't come from a channel partner, so there's nobody to pay." },
      { status: 400 },
    );
  }
  if (lead.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Payouts release when the job is finished. Mark it complete first." },
      { status: 400 },
    );
  }
  if (!lead.estimate) {
    return NextResponse.json(
      { error: "No estimate on this job, so there are no numbers to work the split from." },
      { status: 400 },
    );
  }

  const existing = await prisma.channelPartnerPayout.findFirst({
    where: { channelPartnerId: lead.channelPartner.id, leadId: lead.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Already paid out on this job." }, { status: 409 });
  }

  const method = clean(body.method, 40) || "ZELLE";
  const handle = clean(body.handle, 120) || null;

  // The same numbers the estimator showed the rep. grossProfit is derived
  // rather than stored so there is exactly one definition of it — see
  // src/lib/regions/commission.ts.
  const { costTotal, baseTotal, soldPrice, commission } = lead.estimate;
  const grossProfit = soldPrice - costTotal - commission;
  const payout = channelPartnerPayout({
    base: baseTotal,
    sold: soldPrice,
    grossProfit,
  });

  if (payout.total <= 0) {
    return NextResponse.json(
      { error: "This job produced nothing to share. Worth a look at how it was priced." },
      { status: 400 },
    );
  }

  const created = await prisma.channelPartnerPayout.create({
    data: {
      channelPartnerId: lead.channelPartner.id,
      leadId: lead.id,
      // CENTS — see the column comment. The calculator works in dollars.
      amount: payout.total * 100,
      method,
      handle,
      memo: `${lead.customerName} — profit split${payout.capped ? " (capped)" : ""}`,
      taxYear: new Date().getFullYear(),
    },
  });

  return NextResponse.json(
    {
      ok: true,
      id: created.id,
      total: payout.total,

      profitShare: payout.profitShare,
      companyNet: payout.companyNet,
      capped: payout.capped,
      cappedBy: payout.cappedBy,
    },
    { status: 201 },
  );
}
