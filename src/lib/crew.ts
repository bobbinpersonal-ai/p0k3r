// The mover roster shown during booking and on the homepage — the "here's who'd
// be driving" moment, before the customer has handed over any contact details.
//
// This is a hand-maintained list, not the `Driver` table: it's marketing copy
// about real people who work here, chosen for the vehicle and the area a
// customer just picked. Dispatch still assigns the actual crew after the
// booking lands, so the UI calls this a likely match rather than a confirmed
// one.

import type { VehicleTierValue } from "@/lib/vehicleTiers";

export type CrewMember = {
  id: string;
  /** First name, or first name + last initial the way delivery apps show one. */
  name: string;
  photo: string;
  /**
   * Optional on purpose. Some of the roster drive their own truck and some ride
   * as helpers, and inventing a vehicle for someone is the kind of detail a
   * customer repeats back on the phone. Absent means we don't publish one.
   */
  vehicle?: string;
  /**
   * Quote tiers this person can cover. Absent means unrestricted — used while
   * we don't know what someone drives, so they can still match.
   */
  tiers?: VehicleTierValue[];
  homeBase: string;
  /** Cities and regions they work, matched loosely against the booking city. */
  serviceAreas: string[];
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
    serviceAreas: ["Davis", "Woodland", "Sacramento"],
    note: "Apartments, dorms, and single big items",
  },
  {
    id: "sasha",
    name: "Sasha",
    photo: "/images/crew-sasha.jpg",
    homeBase: "San Francisco",
    serviceAreas: ["the Bay Area", "San Francisco", "Oakland"],
    note: "San Francisco and the wider Bay Area",
  },
  {
    id: "alon",
    name: "Alon",
    photo: "/images/crew-alon.jpg",
    homeBase: "San Francisco",
    serviceAreas: [
      "the Bay Area",
      "San Francisco",
      "San Jose",
      "Sacramento",
      "Stockton",
      "Modesto",
      "Davis",
      "Manteca",
      "Elk Grove",
    ],
    note: "SF and San Jose, and wherever else the day needs him",
  },
  {
    id: "willy",
    name: "Willy",
    photo: "/images/crew-willy.jpg",
    homeBase: "Fairfield",
    serviceAreas: ["Fairfield", "Davis", "Woodland", "Sacramento", "Elk Grove"],
    note: "Fairfield through Sacramento",
  },
  {
    id: "santi",
    name: "Santi",
    photo: "/images/crew-santi.jpg",
    homeBase: "Manteca",
    serviceAreas: ["Manteca", "Stockton", "Modesto"],
    note: "Manteca and Stockton",
  },
];

/** Loose match: booking cities are slugs or display names ("the Bay Area"). */
function coversCity(member: CrewMember, city: string): boolean {
  const wanted = city.toLowerCase().replace(/-/g, " ").replace(/^the\s+/, "").trim();
  if (!wanted) return false;
  return member.serviceAreas.some((area) => {
    const has = area.toLowerCase().replace(/^the\s+/, "");
    return has.includes(wanted) || wanted.includes(has);
  });
}

function coversTier(member: CrewMember, tier: VehicleTierValue | null): boolean {
  // No tier list means we haven't recorded what they drive, not that they
  // can't do the job — don't rule them out for it.
  return !tier || !member.tiers || member.tiers.includes(tier);
}

/**
 * Who'd most likely take this job.
 *
 * Area first, then vehicle: a customer in Stockton recognises a Stockton name
 * long before they think about which truck it is, and sending them the Davis
 * face makes the whole "local crew" claim ring false. Falls back through
 * area-only, then tier-only, then anyone, so the card never disappears
 * mid-booking.
 */
export function matchCrew(
  tier: VehicleTierValue | null,
  city?: string | null,
): CrewMember | null {
  if (CREW.length === 0) return null;

  if (city) {
    const local = CREW.filter((member) => coversCity(member, city));
    if (local.length > 0) {
      // Most local first, not first-on-the-roster. Someone who covers the whole
      // territory technically "covers" Stockton, but the person based in
      // Manteca is the honest answer — and the one whose name a Stockton
      // customer might actually recognise. Home base beats coverage; a shorter
      // area list beats a longer one.
      const ranked = [...local].sort((a, b) => {
        const homeA = coversCity({ ...a, serviceAreas: [a.homeBase] }, city) ? 0 : 1;
        const homeB = coversCity({ ...b, serviceAreas: [b.homeBase] }, city) ? 0 : 1;
        if (homeA !== homeB) return homeA - homeB;
        return a.serviceAreas.length - b.serviceAreas.length;
      });
      return ranked.find((member) => coversTier(member, tier)) ?? ranked[0];
    }
  }

  return CREW.find((member) => coversTier(member, tier)) ?? CREW[0];
}
