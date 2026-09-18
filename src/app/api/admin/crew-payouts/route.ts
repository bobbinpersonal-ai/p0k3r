import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { getRail } from "@/lib/regions/payments";

// Paying a crew for a finished job.
//
// This is where the payment rule in the subcontractor agreement stops being a
// sentence and starts being a fact. A crew that took the homeowner's money
// directly has a job with no customer payment recorded against it, and this
// route will not pay them for it — so the conversation happens before the
// money leaves, rather than at a reconciliation three months later when it is
// somebody's word against somebody else's.
//
// The amount is bounded by the estimate's own cost line. That line is what the
// job was priced to spend on doing the work; paying more than it means the
// deal the customer signed no longer covers the deal we made with the crew,
// and that is a decision for a human and not a form field.

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const estimateId = clean(body.estimateId, 40);
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: {
      id: true,
      costTotal: true,
      soldPrice: true,
      commission: true,
      depositAmount: true,
      depositPaidAt: true,
      lead: {
        select: {
          id: true,
          status: true,
          customerName: true,
          workerId: true,
          worker: { select: { id: true, name: true, w9OnFile: true, status: true } },
        },
      },
    },
  });
  if (!estimate) return NextResponse.json({ error: "No such estimate." }, { status: 404 });

  const crew = estimate.lead.worker;
  if (!crew) {
    return NextResponse.json(
      { error: "No crew on this job, so there's nobody to pay." },
      { status: 400 },
    );
  }
  if (estimate.lead.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Crews are paid once the job is finished. Mark it complete first." },
      { status: 400 },
    );
  }

  // The rule the agreement states, enforced.
  if (!estimate.depositPaidAt || !estimate.depositAmount) {
    return NextResponse.json(
      {
        error:
          `No customer payment is recorded against ${estimate.lead.customerName}'s job. ` +
          `Every dollar goes through our system — find out what was collected and how ` +
          `before this crew is paid.`,
        reason: "NO_CUSTOMER_PAYMENT",
      },
      { status: 409 },
    );
  }

  // Same rule as everywhere else: the IRS wants a W-9 before we send money.
  if (!crew.w9OnFile) {
    return NextResponse.json(
      { error: `No W-9 on file for ${crew.name}. Nothing goes out until there is one.` },
      { status: 409 },
    );
  }

  const existing = await prisma.workerPayout.findFirst({
    where: { workerId: crew.id, estimateId: estimate.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Already paid out on this job." }, { status: 409 });
  }

  // What the office agreed for the work itself. Not derivable — the work order
  // price is a negotiation and it is not in the system — so it is passed in,
  // and bounded by the cost the job was priced to carry.
  const workAmount = Math.round(Number(body.workAmount));
  if (!Number.isFinite(workAmount) || workAmount <= 0) {
    return NextResponse.json({ error: "What is the work order for?" }, { status: 400 });
  }
  if (workAmount > estimate.costTotal) {
    return NextResponse.json(
      {
        error:
          `That is more than the $${estimate.costTotal.toLocaleString("en-US")} this job was ` +
          `priced to spend on the work. Re-price the job or agree a change order first.`,
      },
      { status: 400 },
    );
  }

  const method = clean(body.method, 24).toUpperCase() || "ZELLE";
  if (!getRail(method) && method !== "ZELLE" && method !== "APPLE_PAY") {
    return NextResponse.json({ error: "That isn't a payout method we use." }, { status: 400 });
  }

  // The crew sold it as well as built it, so their commission rides along on
  // the same payment rather than arriving separately and confusing everyone.
  const total = workAmount + estimate.commission;

  const payout = await prisma.workerPayout.create({
    data: {
      workerId: crew.id,
      estimateId: estimate.id,
      amount: total,
      method,
      handle: clean(body.handle, 120) || null,
      memo:
        `${estimate.lead.customerName} — work $${workAmount.toLocaleString("en-US")}` +
        (estimate.commission > 0
          ? ` + selling $${estimate.commission.toLocaleString("en-US")}`
          : ""),
      taxYear: new Date().getFullYear(),
    },
    select: { id: true },
  });

  return NextResponse.json(
    {
      ok: true,
      id: payout.id,
      crew: crew.name,
      workAmount,
      commission: estimate.commission,
      total,
    },
    { status: 201 },
  );
}
