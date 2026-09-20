import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { getRail } from "@/lib/regions/payments";
import { collectedFor } from "@/lib/regions/collections";
import { transferToContractor } from "@/lib/integrations/stripeConnect";

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
      requiresAdminOverride: true,
      overrideAt: true,
      lead: {
        select: {
          id: true,
          status: true,
          customerName: true,
          workerId: true,
          worker: {
            select: {
              id: true,
              name: true,
              w9OnFile: true,
              status: true,
              stripeAccountId: true,
              stripePayoutsEnabled: true,
            },
          },
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

  // The rule the agreement states, enforced — and enforced on the whole
  // contract rather than on any payment at all. A contractor who took the
  // deposit properly and then collected the balance in cash looks identical
  // to a paid job until you ask for the total.
  const money = await collectedFor(estimate.id, estimate.soldPrice);
  if (!money.paidInFull) {
    return NextResponse.json(
      {
        error:
          `${estimate.lead.customerName}'s job has collected ` +
          `$${money.collected.toLocaleString("en-US")} of ` +
          `$${money.contractValue.toLocaleString("en-US")} — ` +
          `$${money.outstanding.toLocaleString("en-US")} outstanding. Crews are paid once the ` +
          `customer has paid us in full. Every dollar goes through our system.`,
        reason: "NOT_PAID_IN_FULL",
        collected: money.collected,
        outstanding: money.outstanding,
      },
      { status: 409 },
    );
  }

  // A job flagged under the margin floor is not paid out by a form. Somebody
  // signs it off first, and the override is recorded on the estimate.
  if (estimate.requiresAdminOverride && !estimate.overrideAt) {
    return NextResponse.json(
      {
        error:
          `This job is under the margin floor and hasn't been signed off. ` +
          `Approve the override before paying anyone on it.`,
        reason: "NEEDS_MARGIN_OVERRIDE",
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

  // STRIPE goes out automatically; every other method is a record of money
  // somebody moved by hand. Refuse STRIPE up front when the crew has not
  // finished onboarding, rather than writing a payout row we then cannot
  // send — a row that says paid when nothing left is worse than an error.
  if (method === "STRIPE") {
    if (!crew.stripeAccountId || !crew.stripePayoutsEnabled) {
      return NextResponse.json(
        {
          error: `${crew.name} has not finished connecting their bank with Stripe.`,
          reason: "STRIPE_NOT_ONBOARDED",
        },
        { status: 409 },
      );
    }
  }

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
      // A hand-moved payment is already sent by the time it is recorded.
      transferStatus: method === "STRIPE" ? "PENDING" : "SENT",
    },
    select: { id: true },
  });

  if (method !== "STRIPE") {
    return NextResponse.json(
      { ok: true, id: payout.id, crew: crew.name, workAmount, commission: estimate.commission, total },
      { status: 201 },
    );
  }

  // The payout row id is the idempotency key. A retried request reuses it,
  // so Stripe returns the original transfer instead of sending a second one
  // — which is the difference between a retry and paying somebody twice.
  const transfer = await transferToContractor({
    stripeAccountId: crew.stripeAccountId!,
    amountDollars: total,
    idempotencyKey: payout.id,
    description: `${estimate.lead.customerName} — ${crew.name}`,
  });

  if (!transfer.ok) {
    await prisma.workerPayout.update({
      where: { id: payout.id },
      data: { transferStatus: "FAILED" },
    });
    return NextResponse.json(
      {
        error: `Recorded, but Stripe refused the transfer: ${transfer.error}`,
        reason: "TRANSFER_FAILED",
        retryable: transfer.retryable,
        id: payout.id,
      },
      { status: 502 },
    );
  }

  await prisma.workerPayout.update({
    where: { id: payout.id },
    data: { stripeTransferId: transfer.transferId, transferStatus: "SENT" },
  });

  return NextResponse.json(
    {
      ok: true,
      id: payout.id,
      crew: crew.name,
      workAmount,
      commission: estimate.commission,
      total,
      transferId: transfer.transferId,
    },
    { status: 201 },
  );
}
