import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crewFromRequest } from "@/lib/crewAuth";
import { CONTRACTOR_TERMS, dealAt } from "@/lib/regions/commission";
import { depositFor } from "@/lib/regions/payments";
import { getRail } from "@/lib/regions/payments";
import { priceJob, type MeasuredLine } from "@/lib/regions/trades";

// A contractor selling a job at the kitchen table.
//
// Everything that decides money is computed here from the price book, not
// accepted from the phone in the contractor's hand. The client posts what was
// measured and what it sold for; the server prices it, refuses anything under
// the floor, works out the commission on the contractor's own terms, and
// writes the estimate the rest of the business reads from.
//
// The one number the client gets to choose is the sold price, and even that is
// bounded: `dealAt` returns undefined below base and this route turns that into
// a refusal. A price under the floor is the company paying for the privilege of
// doing the work, and a contractor under pressure at 8pm should not be the last
// thing standing between us and that.

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A contract this size is a typo, not a roof. */
const MAX_SOLD = 500_000;

export async function POST(req: NextRequest) {
  const crew = await crewFromRequest(req);
  if (!crew) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // No W-9, no payout — so no point letting them sell a job they cannot be
  // paid for. Told here rather than discovered three weeks later.
  if (!crew.w9OnFile) {
    return NextResponse.json(
      { error: "We need your W-9 before you can write estimates. Call the office." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const leadId = clean(body.leadId, 40);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, customerName: true, status: true, estimate: { select: { id: true } } },
  });
  if (!lead) return NextResponse.json({ error: "That job isn't in the system." }, { status: 404 });
  if (lead.estimate) {
    return NextResponse.json(
      { error: "This job already has an estimate. Ask the office to reopen it." },
      { status: 409 },
    );
  }

  // What was measured, priced against the book as it reads today.
  const rawLines: unknown[] = Array.isArray(body.lines) ? body.lines : [];
  const measured: MeasuredLine[] = rawLines
    .map((l) => {
      const line = l as Record<string, unknown>;
      return {
        trade: clean(line.trade, 40).toUpperCase(),
        option: clean(line.option, 40).toUpperCase(),
        quantity: Number(line.quantity),
      };
    })
    .filter((l) => l.trade && l.option && Number.isFinite(l.quantity) && l.quantity > 0);

  if (measured.length === 0) {
    return NextResponse.json({ error: "Nothing measured yet." }, { status: 400 });
  }

  const priced = priceJob(measured);
  if (priced.lines.length !== measured.length) {
    return NextResponse.json(
      { error: "One of those lines isn't in the price book. Refresh and try again." },
      { status: 400 },
    );
  }
  if (priced.base <= 0) {
    return NextResponse.json({ error: "That prices to nothing. Check the measurements." }, { status: 400 });
  }

  const sold = Math.round(Number(body.soldPrice));
  if (!Number.isFinite(sold) || sold <= 0 || sold > MAX_SOLD) {
    return NextResponse.json({ error: "That sold price doesn't look right." }, { status: 400 });
  }

  const deal = dealAt({ cost: priced.cost, base: priced.base }, sold, CONTRACTOR_TERMS);
  if (!deal) {
    return NextResponse.json(
      {
        error:
          `The floor on this job is $${priced.base.toLocaleString("en-US")}. ` +
          `You can sell above it, never below.`,
        base: priced.base,
      },
      { status: 400 },
    );
  }

  // The signature is what turns a quote into a contract, so it is required
  // here rather than collected later — a job sold without one is a job the
  // homeowner can walk away from after the crew has bought material.
  const signerName = clean(body.signerName, 120);
  if (!signerName) {
    return NextResponse.json({ error: "The homeowner has to sign it." }, { status: 400 });
  }

  // The payment rule, enforced rather than trusted. A contractor may record a
  // deposit taken on one of OUR rails; there is no field here for "cash" or
  // "they paid me directly", because accepting one would be the system
  // endorsing the thing the agreement forbids.
  const depositDue = depositFor(sold);
  const railValue = clean(body.depositMethod, 24).toUpperCase();
  const rail = railValue ? getRail(railValue) : undefined;
  const depositAmount = Math.round(Number(body.depositAmount) || 0);

  if (railValue && !rail) {
    return NextResponse.json(
      { error: "That isn't one of our payment methods. All money goes through the company." },
      { status: 400 },
    );
  }
  if (depositAmount > 0 && !rail) {
    return NextResponse.json(
      { error: "Say which of our payment methods took the deposit." },
      { status: 400 },
    );
  }
  if (depositAmount > sold) {
    return NextResponse.json({ error: "The deposit is more than the job." }, { status: 400 });
  }

  const estimate = await prisma.estimate.create({
    data: {
      leadId: lead.id,
      status: "SIGNED",
      jobKind: clean(body.jobKind, 20) === "INSURANCE" ? "INSURANCE" : "RETAIL",
      costTotal: priced.cost,
      baseTotal: priced.base,
      soldPrice: deal.sold,
      commission: deal.commission,
      depositAmount: depositAmount > 0 ? depositAmount : null,
      depositMethod: depositAmount > 0 && rail ? rail.value : null,
      depositPaidAt: depositAmount > 0 ? new Date() : null,
      scopeNotes: clean(body.scopeNotes, 2000) || null,
      signedAt: new Date(),
      signerName,
      lines: {
        create: priced.lines.map((l) => ({
          trade: l.trade.value,
          tradeLabel: l.trade.label,
          option: l.option.value,
          optionLabel: l.option.label,
          unit: l.trade.unit,
          quantity: l.quantity,
          costPerUnit: l.option.costPerUnit,
          basePerUnit: l.option.basePerUnit,
          cost: l.cost,
          base: l.base,
        })),
      },
    },
    select: { id: true, token: true },
  });

  // Sold, so the pipeline shows it as sold. The office does not have to be
  // told a job closed by somebody remembering to send a text.
  await prisma.lead.update({ where: { id: lead.id }, data: { status: "SOLD" } });

  return NextResponse.json(
    {
      ok: true,
      id: estimate.id,
      token: estimate.token,
      sold: deal.sold,
      base: priced.base,
      yourCommission: deal.commission,
      depositDue,
      depositTaken: depositAmount,
    },
    { status: 201 },
  );
}
