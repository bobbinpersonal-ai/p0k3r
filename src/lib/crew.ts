// The mover roster shown during booking — the "here's who'd be driving"
// moment, before the customer has handed over any contact details.
//
// This is a hand-maintained list, not the `Driver` table: it's marketing copy
// about real people who work here, chosen for the vehicle a customer just
// picked. Dispatch still assigns the actual crew after the booking lands, so
// the UI calls this a likely match rather than a confirmed one.

import type { VehicleTierValue } from "@/lib/vehicleTiers";

export type CrewMember = {
  id: string;
  /** First name + last initial, the way delivery apps show a driver. */
  name: string;
  photo: string;
  vehicle: string;
  /** Which quote tiers this person can cover. */
  tiers: VehicleTierValue[];
  homeBase: string;
  /** Short line of credibility shown under the name. */
  note: string;
};

export const CREW: CrewMember[] = [
  {
    id: "bobbin-d",
    name: "Bobbin D.",
    photo: "/images/crew-bobbin.jpg",
    vehicle: "Dodge Ram 2500",
    tiers: ["PICKUP", "VAN"],
    homeBase: "Davis",
    note: "Founder — still runs moves himself",
  },
];

/**
 * Who'd most likely take this job. Prefers someone who drives the tier the
 * customer picked; falls back to anyone on the roster so the card never
 * disappears once a booking is in progress.
 */
export function matchCrew(tier: VehicleTierValue | null): CrewMember | null {
  if (CREW.length === 0) return null;
  if (!tier) return CREW[0];
  return CREW.find((member) => member.tiers.includes(tier)) ?? CREW[0];
}
