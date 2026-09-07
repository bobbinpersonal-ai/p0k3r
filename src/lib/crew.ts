// The mover roster shown during booking and on the homepage — the "here's who'd
// be driving" moment, before the customer has handed over any contact details.
//
// This is a hand-maintained list, not the `Driver` table: it's marketing copy
// about real people who work here, chosen for the area and the vehicle a
// customer just picked. Dispatch still assigns the actual crew after the
// booking lands, so the UI calls this a likely match rather than a confirmed
// one.

import { haversineMiles, type LatLng } from "@/lib/geo";
import { findServiceAreaPlace, SERVICE_AREA_PLACES } from "@/lib/serviceAreaPlaces";
import type { VehicleTierValue } from "@/lib/vehicleTiers";

/** How far from home a mover will take a job, unless they say otherwise. */
export const CREW_RADIUS_MILES = 75;

/**
 * Two people the same distance from a job shouldn't always resolve to whichever
 * one happens to sit higher in the array — that's how a roster ends up with a
 * member who never appears. Anyone within this far of the closest candidate is
 * treated as equally close and the tie is spread (see rotationSeed).
 */
const TIE_BAND_MILES = 15;

export type CrewMember = {
  id: string;
  /** First name, or first name + last initial the way delivery apps show one. */
  name: string;
  photo: string;
  vehicle?: string;
  /**
   * Quote tiers this person's own vehicle can cover. A pickup covers PICKUP and
   * nothing else — but that never rules them off a job, because everyone on
   * this roster will ride as the second pair of hands when the truck is
   * someone else's. See crewRole().
   */
  drives?: VehicleTierValue[];
  homeBase: string;
  /** Home base coordinates, for the radius match. */
  base: LatLng;
  /** Overrides CREW_RADIUS_MILES for someone who ranges wider than the rest. */
  radiusMiles?: number;
  /** Short line of credibility shown under the name. */
  note: string;
};

function baseOf(town: string): LatLng {
  const place = SERVICE_AREA_PLACES.find((p) => p.name === town);
  if (!place) throw new Error(`Crew home base not in the gazetteer: ${town}`);
  return { lat: place.lat, lng: place.lng };
}

export const CREW: CrewMember[] = [
  {
    id: "bobbin-d",
    name: "Bobbin D.",
    photo: "/images/crew-bobbin.jpg",
    vehicle: "Dodge Ram 2500",
    drives: ["PICKUP", "VAN"],
    homeBase: "Davis",
    base: baseOf("Davis"),
    note: "Apartments, dorms, and single big items",
  },
  {
    id: "sasha",
    name: "Sasha",
    photo: "/images/crew-sasha.jpg",
    vehicle: "Ford F-150",
    drives: ["PICKUP"],
    homeBase: "San Francisco",
    base: baseOf("San Francisco"),
    note: "San Francisco and the wider Bay Area",
  },
  {
    id: "alon",
    name: "Alon",
    photo: "/images/crew-alon.jpg",
    vehicle: "Toyota Tundra",
    drives: ["PICKUP"],
    homeBase: "San Francisco",
    base: baseOf("San Francisco"),
    // He covers SF and San Jose "plus the rest of the territory", so he ranges
    // further than the others. Distance still decides, so a wider radius only
    // means he turns up where nobody closer is available — not everywhere.
    radiusMiles: 150,
    note: "SF and San Jose, and further out when the day needs it",
  },
  {
    id: "willy",
    name: "Willy",
    photo: "/images/crew-willy.jpg",
    vehicle: "Nissan Titan",
    drives: ["PICKUP"],
    homeBase: "Fairfield",
    base: baseOf("Fairfield"),
    note: "Fairfield through Sacramento",
  },
  {
    id: "santi",
    name: "Santi",
    photo: "/images/crew-santi.jpg",
    vehicle: "Toyota Tundra",
    drives: ["PICKUP"],
    homeBase: "Manteca",
    base: baseOf("Manteca"),
    note: "Manteca and Stockton",
  },
  {
    id: "james",
    name: "James",
    photo: "/images/crew-james.jpg",
    // No vehicle recorded: James works as a helper, so `drives` is empty rather
    // than absent — absent means "we don't know yet", empty means "doesn't
    // drive for us", and only the second should keep him out of the driver slot.
    drives: [],
    homeBase: "Stockton",
    base: baseOf("Stockton"),
    note: "Stockton — second pair of hands",
  },
];

/** Where the job is: real coordinates when we have them, a town name if not. */
export type CrewLocation = LatLng | string | null | undefined;

function toPoint(location: CrewLocation): LatLng | null {
  if (!location) return null;
  if (typeof location !== "string") return location;
  const place = findServiceAreaPlace(location.replace(/-/g, " "));
  return place ? { lat: place.lat, lng: place.lng } : null;
}

/**
 * Driving their own truck, or riding along as the second pair of hands.
 *
 * Nobody is ruled off a job for having the wrong vehicle — the roster works
 * both ways, so a pickup owner on a box-truck booking is the helper.
 */
export function crewRole(member: CrewMember, tier: VehicleTierValue | null): "driver" | "helper" {
  if (!member.drives) return "driver"; // vehicle not recorded yet
  if (!member.drives.length) return "helper"; // helper-only
  if (!tier) return "driver";
  return member.drives.includes(tier) ? "driver" : "helper";
}

/**
 * A number that's stable for a given job but varies between jobs.
 *
 * Used to break distance ties. Deterministic on purpose: the same booking must
 * pick the same face on the server and on the client, or the card changes
 * identity as the page hydrates. Different bookings land on different people,
 * so the roster spreads instead of one name taking everything.
 */
function rotationSeed(point: LatLng): number {
  const key = `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Everyone within TIE_BAND_MILES of the closest, spread by the job's seed. */
function pickFromTieBand<T extends { milesAway: number }>(sorted: T[], seed: number): T {
  const band = sorted.filter((c) => c.milesAway <= sorted[0].milesAway + TIE_BAND_MILES);
  return band[seed % band.length];
}

export type CrewMatch = {
  member: CrewMember;
  role: "driver" | "helper";
  /** Distance from their home base to the job, when we could measure it. */
  milesAway: number | null;
};

/**
 * Who'd most likely take this job.
 *
 * Distance first, vehicle second. Everyone works a 75-mile radius from home, so
 * a Fairfield job finds Willy whether or not "Fairfield" was ever typed into a
 * list — and a customer shown the face of someone an hour and a half away would
 * rightly stop believing the "crew from your own area" line. Falls back to
 * anyone who can drive the tier, then to the roster, so the card never
 * disappears mid-booking.
 */
export function matchCrew(
  tier: VehicleTierValue | null,
  location?: CrewLocation,
): CrewMatch | null {
  if (CREW.length === 0) return null;

  const point = toPoint(location);
  if (point) {
    const nearby = CREW.map((member) => ({
      member,
      milesAway: haversineMiles(point, member.base),
    }))
      .filter((c) => c.milesAway <= (c.member.radiusMiles ?? CREW_RADIUS_MILES))
      .sort((a, b) => a.milesAway - b.milesAway);

    if (nearby.length > 0) {
      const seed = rotationSeed(point);
      // Closest first, and only then vehicle. Ranking by vehicle first meant a
      // Stockton customer booking a cargo van got shown the one van-capable
      // driver sixty miles away in Davis, which reads exactly as wrong as it
      // sounds. Among people equally close, prefer whoever can drive the tier;
      // otherwise the nearest person appears in the role they'd actually work,
      // and dispatch sources the vehicle.
      const band = nearby.filter(
        (c) => c.milesAway <= nearby[0].milesAway + TIE_BAND_MILES,
      );
      const driversNearby = band.filter(({ member }) => crewRole(member, tier) === "driver");
      const pool = driversNearby.length > 0 ? driversNearby : band;
      const chosen = pool[seed % pool.length];
      return {
        member: chosen.member,
        role: crewRole(chosen.member, tier),
        milesAway: chosen.milesAway,
      };
    }
  }

  const fallback = CREW.find((member) => crewRole(member, tier) === "driver") ?? CREW[0];
  return { member: fallback, role: crewRole(fallback, tier), milesAway: null };
}

/**
 * A second face for the "yes, send a helper" option — someone near the job who
 * isn't already the matched crew member.
 */
export function matchHelper(
  location?: CrewLocation,
  exclude?: string,
): CrewMember | null {
  const others = CREW.filter((member) => member.id !== exclude);
  if (others.length === 0) return null;

  const point = toPoint(location);
  if (point) {
    const nearby = others
      .map((member) => ({ member, milesAway: haversineMiles(point, member.base) }))
      .filter((c) => c.milesAway <= (c.member.radiusMiles ?? CREW_RADIUS_MILES))
      .sort((a, b) => a.milesAway - b.milesAway);
    // Offset the seed so the helper slot doesn't keep landing on whoever the
    // driver rotation just skipped over.
    if (nearby.length > 0) return pickFromTieBand(nearby, rotationSeed(point) + 1).member;
  }
  return others[0];
}
