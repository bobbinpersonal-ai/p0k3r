import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LENDER } from "@/lib/integrations/config";
import { FINANCING_MIN_AMOUNT, financingDisclosure, quote } from "@/lib/regions/financing";

// A financing quote for an estimate, plus the lender handoff.
//
// The amount is read from the signed estimate, never from the request. A
// financed amount posted by a browser is a figure somebody can edit, and it
// becomes what a homeowner is told they will pay each month.
//
// The quote comes back with its APR and term attached and the disclosure
// already composed, so a caller physically cannot render the payment on its
// own — see the Regulation Z note in src/lib/regions/financing.ts.

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { estimateId?: string; downPayment?: number };
  const estimateId = typeof body.estimateId === "string" ? body.estimateId.trim() : "";
  if (!estimateId) return NextResponse.json({ error: "Missing estimateId." }, { status: 400 });

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: {
      id: true,
      soldPrice: true,
      status: true,
      financingStatus: true,
      lead: { select: { customerName: true, customerEmail: true, customerPhone: true } },
    },
  });
  if (!estimate) return NextResponse.json({ error: "Estimate not found." }, { status: 404 });

  const down = Math.max(0, Math.min(Math.round(Number(body.downPayment) || 0), estimate.soldPrice));
  const financed = estimate.soldPrice - down;

  if (financed < FINANCING_MIN_AMOUNT) {
    return NextResponse.json({
      ok: true,
      quotable: false,
      reason: `Financing starts at $${FINANCING_MIN_AMOUNT.toLocaleString("en-US")}.`,
    });
  }

  const q = quote(financed);
  if (!q) {
    // Configured but no plan covers it, or no plans at all. Either way we do
    // not invent an APR — the homeowner gets a real figure from the lender.
    return NextResponse.json({
      ok: true,
      quotable: false,
      reason: "No plan on file covers this amount. Send them to the lender for a real figure.",
      applyUrl: applyUrlFor(estimate.id),
    });
  }

  return NextResponse.json({
    ok: true,
    quotable: true,
    financedAmount: financed,
    downPayment: down,
    monthly: q.monthly,
    apr: q.apr,
    termMonths: q.termMonths,
    totalOfPayments: q.totalOfPayments,
    // Composed server-side so it cannot be dropped by a caller rendering
    // only the parts that look good.
    disclosure: financingDisclosure(q),
    applyUrl: applyUrlFor(estimate.id),
  });
}

/** The lender's application link for this job, when one is configured. */
function applyUrlFor(estimateId: string): string | null {
  if (!LENDER.applyUrlTemplate) return null;
  return LENDER.applyUrlTemplate.replace("{estimateId}", encodeURIComponent(estimateId));
}
