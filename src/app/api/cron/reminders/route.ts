import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyCustomerReminder } from "@/lib/notify";
import { siteOrigin } from "@/lib/siteOrigin";

// Runs once a day (see vercel.json) and texts/emails every customer whose
// move is tomorrow. reminderSentAt is the idempotency guard — a retried or
// manually-replayed run can't double-send the same reminder.
//
// Deliberately the only scheduled job in this app: Vercel's Hobby plan caps
// cron at once a day per job, which is exactly what a day-before reminder
// wants and nowhere near enough for anything that needs finer granularity
// (e.g. "escalate an unanswered lead after 30 minutes") — that kind of thing
// belongs in the dashboard as a visual cue instead, see DispatchBoard.tsx.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // No configured secret means refuse rather than run unauthenticated — this
  // sends real texts and emails to real customers, not a read-only report.
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const tomorrowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const tomorrowEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2),
  );

  const bookings = await prisma.booking.findMany({
    where: {
      moveDate: { gte: tomorrowStart, lt: tomorrowEnd },
      status: { not: "CANCELED" },
      reminderSentAt: null,
    },
  });

  const origin = siteOrigin();
  let sent = 0;
  for (const booking of bookings) {
    const manageUrl = new URL(`/manage/${booking.manageToken}`, origin).toString();
    await notifyCustomerReminder(booking, manageUrl);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
    sent++;
  }

  return NextResponse.json({ checked: bookings.length, sent });
}
