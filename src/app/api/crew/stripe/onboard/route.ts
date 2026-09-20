import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crewFromRequest } from "@/lib/crewAuth";
import { siteOrigin } from "@/lib/siteOrigin";
import {
  createConnectOnboardingLink,
  createConnectedAccount,
  refreshPayoutsEnabled,
} from "@/lib/integrations/stripeConnect";

// A crew connecting their bank so they can be paid without a human moving
// money.
//
// POST → creates their Stripe account if they have none, then returns a
// hosted onboarding link. GET → re-reads whether Stripe will actually let
// us pay them yet.
//
// payoutsEnabled is refreshed FROM Stripe rather than trusted from our own
// column, because a crew can be restricted after onboarding and our copy
// would still say enabled — discovered at the moment a finished job fails
// to pay, which is the worst possible time.

export async function POST(req: NextRequest) {
  const crew = await crewFromRequest(req);
  if (!crew) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const worker = await prisma.worker.findUnique({
    where: { id: crew.id },
    select: { id: true, name: true, email: true, state: true, stripeAccountId: true },
  });
  if (!worker) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let accountId = worker.stripeAccountId;
  if (!accountId) {
    const created = await createConnectedAccount({
      email: worker.email,
      businessName: worker.name,
      state: worker.state,
    });
    if (!created.ok) return NextResponse.json({ error: created.error }, { status: 502 });
    accountId = created.accountId;
    await prisma.worker.update({
      where: { id: worker.id },
      data: { stripeAccountId: accountId },
    });
  }

  const origin = siteOrigin();
  const link = await createConnectOnboardingLink({
    stripeAccountId: accountId,
    returnUrl: `${origin}/crew?stripe=done`,
    refreshUrl: `${origin}/crew?stripe=retry`,
  });
  if (!link.ok) return NextResponse.json({ error: link.error }, { status: 502 });

  return NextResponse.json({ ok: true, url: link.url });
}

export async function GET(req: NextRequest) {
  const crew = await crewFromRequest(req);
  if (!crew) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const worker = await prisma.worker.findUnique({
    where: { id: crew.id },
    select: { id: true, stripeAccountId: true, stripePayoutsEnabled: true },
  });
  if (!worker?.stripeAccountId) {
    return NextResponse.json({ ok: true, connected: false, payoutsEnabled: false });
  }

  const live = await refreshPayoutsEnabled(worker.stripeAccountId);
  if (!live.ok) {
    // Fall back to the stored value rather than failing the page — Stripe
    // being briefly unreachable should not make a crew think they are not
    // set up.
    return NextResponse.json({
      ok: true,
      connected: true,
      payoutsEnabled: worker.stripePayoutsEnabled,
      stale: true,
    });
  }

  if (live.payoutsEnabled !== worker.stripePayoutsEnabled) {
    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        stripePayoutsEnabled: live.payoutsEnabled,
        ...(live.payoutsEnabled ? { stripeOnboardedAt: new Date() } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true, connected: true, payoutsEnabled: live.payoutsEnabled });
}
