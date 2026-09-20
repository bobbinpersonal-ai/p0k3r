import { COMPANY } from "@/lib/regions/brand";

// Offering a job to a crew.
//
// "New $4,500 fencing job in Denver. Tap to accept." The offer goes to
// several vetted crews at once and the first to tap gets it, which is the
// only version of this that works when the people you are offering to are on
// a roof and will not see the message for forty minutes.
//
// THE RACE IS THE WHOLE DESIGN PROBLEM. Two crews tapping within the same
// second must not both get the job, and the loser must be told something
// truthful rather than getting an error. That is why acceptance is a single
// conditional UPDATE against the offer's status (see /api/dispatch/accept)
// rather than a read followed by a write — the database decides, once.

/** How long a crew has before an offer lapses and we widen the net. */
export const OFFER_TTL_HOURS = 4;

/** How many crews an offer goes to at once. */
export const OFFER_FANOUT = 5;

export type DispatchOfferState = "OFFERED" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";

export type OfferableCrew = {
  id: string;
  name: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  generalLiabilityOnFile: boolean;
  insuranceExpiresAt: Date | null;
  w9OnFile: boolean;
  status: string;
};

export type CrewBlock = { crewId: string; reason: string };

/**
 * Who may be offered work, and why the rest may not.
 *
 * Returns the blocks as well as the eligible list, because "nobody is
 * available" and "everybody nearby has expired insurance" need completely
 * different responses from whoever is dispatching, and a filtered array
 * cannot tell them apart.
 *
 * Insurance is the hard gate. We tell homeowners the crew turning up has
 * been checked, and that claim is worth exactly what we actually checked.
 */
export function eligibleCrews(
  crews: readonly OfferableCrew[],
  job: { state: string | null },
  now: Date = new Date(),
): { eligible: OfferableCrew[]; blocked: CrewBlock[] } {
  const eligible: OfferableCrew[] = [];
  const blocked: CrewBlock[] = [];

  for (const c of crews) {
    if (c.status !== "ACTIVE") {
      blocked.push({ crewId: c.id, reason: `Not active (${c.status.toLowerCase()}).` });
      continue;
    }
    if (!c.generalLiabilityOnFile) {
      blocked.push({ crewId: c.id, reason: "No general liability certificate on file." });
      continue;
    }
    if (c.insuranceExpiresAt && c.insuranceExpiresAt < now) {
      blocked.push({ crewId: c.id, reason: "Insurance certificate has expired." });
      continue;
    }
    if (job.state && c.state && c.state !== job.state) {
      blocked.push({ crewId: c.id, reason: `Works ${c.state}, job is in ${job.state}.` });
      continue;
    }
    // A missing W-9 does not block the offer — it blocks the payout, which
    // is already enforced at /api/admin/crew-payouts. Refusing to offer work
    // over paperwork that can be filed while the job runs costs us the job.
    eligible.push(c);
  }

  return { eligible, blocked };
}

/**
 * The SMS a crew gets.
 *
 * The money and the place come first, because that is the entire decision
 * and it has to survive being read on a lock screen.
 */
export function offerMessage(args: {
  workAmount: number;
  trade: string;
  city: string | null;
  state: string | null;
  acceptUrl: string;
  expiresInHours?: number;
}): string {
  const where = [args.city, args.state].filter(Boolean).join(", ") || "your area";
  const hours = args.expiresInHours ?? OFFER_TTL_HOURS;
  return (
    `${COMPANY.name}: new ${args.trade.toLowerCase()} job in ${where}. ` +
    `$${args.workAmount.toLocaleString("en-US")} to you. ` +
    `Tap to accept: ${args.acceptUrl} ` +
    `(first crew to accept gets it — offer expires in ${hours}h)`
  );
}

/** When an offer made now should lapse. */
export function offerExpiry(now: Date = new Date(), hours: number = OFFER_TTL_HOURS): Date {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

/**
 * What to tell a crew who tapped a fraction too late.
 *
 * Losing a race should not read like a bug, and it should not read like a
 * rejection either — they did the right thing and we want them to tap again
 * next time.
 */
export const OFFER_TAKEN_MESSAGE =
  "Another crew took this one first. Nothing wrong with your response — we send these to " +
  "a few crews at once so the homeowner is not waiting. You are still first in line for the next.";

export const OFFER_EXPIRED_MESSAGE =
  "This offer has expired and the job has gone to someone else.";
