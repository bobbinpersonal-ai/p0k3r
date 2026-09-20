import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { siteOrigin } from "@/lib/siteOrigin";
import { COMPANY } from "@/lib/regions/brand";
import { mayEmail, maySms } from "@/lib/integrations/consent";
import { sendCampaignEmail, sendTextMessage } from "@/lib/notify";

// Re-engaging an aged list.
//
// Email first, always. CAN-SPAM needs no prior consent — honest headers, a
// real postal address and a working unsubscribe — so this is the one channel
// that can touch an imported list on day one. Every recipient is still run
// through mayEmail() so an opt-out is honoured.
//
// SMS is attempted only for records that carry real consent, which an
// imported row does not. That is not a bug in the campaign; it is the
// campaign working. The counts come back separately so whoever runs it can
// see exactly how much of the list is reachable and by what.
//
// The unsubscribe link is not decoration. A campaign email without a working
// one is the CAN-SPAM violation, and it is the only part of that statute
// that is genuinely easy to get wrong.

const MAX_PER_RUN = 500;

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    batch?: string;
    limit?: number;
    dryRun?: boolean;
  };
  const batch = typeof body.batch === "string" ? body.batch.trim() : "";
  if (!batch) return NextResponse.json({ error: "Which import batch?" }, { status: 400 });

  const limit = Math.max(1, Math.min(Number(body.limit) || MAX_PER_RUN, MAX_PER_RUN));
  const dryRun = body.dryRun !== false && body.dryRun !== undefined ? Boolean(body.dryRun) : false;

  const leads = await prisma.lead.findMany({
    where: { importBatch: batch, status: "NEW", optedOutAt: null },
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      unsubToken: true,
      optedOutAt: true,
      smsConsentAt: true,
      smsConsentSource: true,
    },
    take: limit,
  });

  const origin = siteOrigin();
  let emailed = 0;
  let texted = 0;
  const blockedSms: string[] = [];
  let noEmail = 0;

  for (const lead of leads) {
    if (lead.customerEmail && mayEmail(lead).allowed) {
      if (!dryRun) {
        const sent = await sendCampaignEmail({
          to: lead.customerEmail,
          subject: `Still thinking about work on the house?`,
          body:
            `Hi ${lead.customerName.split(" ")[0]},\n\n` +
            `You got in touch with ${COMPANY.name} a while back about work on your home. ` +
            `We are booking again in your area — roofing, siding, windows, gutters, paint and ` +
            `fence.\n\n` +
            `If it is still on your list, reply to this email and we will get you a written ` +
            `price. No obligation, no pressure, and we will not chase you.\n\n` +
            `${COMPANY.name}\n${COMPANY.phone}`,
          unsubscribeUrl: `${origin}/unsubscribe/${lead.unsubToken}`,
        });
        if (sent) emailed++;
      } else emailed++;
    } else if (!lead.customerEmail) {
      noEmail++;
    }

    // Attempted, and almost always refused for an imported row. Reported
    // rather than hidden, so nobody assumes the texts went out.
    const sms = maySms(lead);
    if (sms.allowed) {
      if (!dryRun) {
        const ok = await sendTextMessage(
          lead.customerPhone,
          `${COMPANY.name}: still want that work on the house? Reply YES for a written price, ` +
            `STOP to never hear from us again.`,
        );
        if (ok) texted++;
      } else texted++;
    } else if (blockedSms.length < 3) {
      blockedSms.push(sms.reason!);
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    batch,
    considered: leads.length,
    emailed,
    texted,
    noEmailOnFile: noEmail,
    smsBlockedBecause: blockedSms,
    next:
      "A reply to the email is an enquiry, which opens a 3-month window for a manual dial. " +
      "Work those on /admin/desk — the dialer checks consent again before showing a number.",
  });
}
