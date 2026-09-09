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

/**
 * How far from home a mover will take a job.
 *
 * 150 rather than a tighter number because the roster is explicitly fine with
 * the drive: nobody is city-bound, and the point of a home base is where
 * someone starts the day, not a fence around where they'll work. SF to
 * Sacramento is about 70 miles on its own, so at this radius most of the
 * service area is "nearby" for more than one person — that overlap is the
 * point, not a bug, since it's what lets rural addresses outside any single
 * town still land on someone real instead of falling through to nothing.
 */
export const CREW_RADIUS_MILES = 150;

/**
 * Two people the same distance from a job shouldn't always resolve to whichever
 * one happens to sit higher in the array — that's how a roster ends up with a
 * member who never appears. Anyone within this far of the closest candidate is
 * treated as equally close and the tie is spread (see rotationSeed).
 */
const TIE_BAND_MILES = 15;

/**
 * Past this many miles, the crew card stops naming a home base or a distance.
 *
 * A number is honest right up until it's alarming: "308 mi away" or "based in
 * Manteca" on a Los Angeles booking reads less like reassurance and more like
 * "is anyone actually coming?" Below this line, distance is proof the match is
 * real and local. Above it, the same number just raises a question nobody
 * needs raised before dispatch has even looked at the job — so the UI (see
 * CrewMatchCard) drops the specifics rather than the honesty: it still says
 * whether this is a confident local match or just the closest person we've
 * got (CREW_RADIUS_MILES decides that), it just stops putting a number or a
 * town name on it once the number would work against the point.
 */
export const REVEAL_DISTANCE_MILES = 80;

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
  /**
   * The same line for a yard booking, where `note` would be about moving.
   *
   * Only needed for the notes that name moving work specifically — most are
   * territories ("Fairfield through Sacramento"), which are true whichever
   * business the job belongs to. Falls back to `note` when unset.
   */
  yardNote?: string;
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
    yardNote: "Davis and Yolo County yards",
  },
  {
    id: "sasha",
    name: "Sasha",
    photo: "/images/crew-sasha.jpg",
    vehicle: "Mercedes Sprinter",
    drives: ["VAN"],
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
    yardNote: "Stockton — mowing, clearing and hauling",
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
  /**
   * True when the match is inside CREW_RADIUS_MILES — a "yes, that's genuinely
   * your local crew" match. False means this is just the closest person we've
   * got on a job further out than anyone's usual range (a Los Angeles booking,
   * say, on a five-person Central Valley roster). The card reads differently
   * for each: never claim a 380-mile trip is a snug local match.
   */
  confident: boolean;
};

/**
 * Who'd most likely take this job.
 *
 * Distance first, vehicle second, and — the part worth spelling out — distance
 * always wins over giving up on it. We're about to run ads into a lot of
 * different places, which means bookings from towns nobody on this roster
 * lives anywhere near. The old version ranked by distance only among people
 * inside CREW_RADIUS_MILES, and the moment *nobody* qualified it threw location
 * away entirely and returned the first available driver — so a booking from
 * Los Angeles would confidently show "Bobbin D., based in Davis" as if that
 * were a normal local match. That's the opposite of the system knowing its
 * service area: it's the system pretending distance doesn't exist the one time
 * it matters most.
 *
 * So this always ranks the whole roster by real distance when we have a point,
 * with no cutoff, and reports the true number every time. CREW_RADIUS_MILES
 * only decides `confident` — whether to talk about this like a normal local
 * match, or like the honest "here's the nearest person" answer it actually is.
 */
export function matchCrew(
  tier: VehicleTierValue | null,
  location?: CrewLocation,
): CrewMatch | null {
  if (CREW.length === 0) return null;

  const point = toPoint(location);
  if (point) {
    const ranked = CREW.map((member) => ({
      member,
      milesAway: haversineMiles(point, member.base),
    })).sort((a, b) => a.milesAway - b.milesAway);

    const seed = rotationSeed(point);
    // Closest first, and only then vehicle. Ranking by vehicle first meant a
    // Stockton customer booking a cargo van got shown the one van-capable
    // driver sixty miles away in Davis, which reads exactly as wrong as it
    // sounds. Among people equally close, prefer whoever can drive the tier;
    // otherwise the nearest person appears in the role they'd actually work,
    // and dispatch sources the vehicle.
    const band = ranked.filter((c) => c.milesAway <= ranked[0].milesAway + TIE_BAND_MILES);
    const driversNearby = band.filter(({ member }) => crewRole(member, tier) === "driver");
    const pool = driversNearby.length > 0 ? driversNearby : band;
    const chosen = pool[seed % pool.length];
    return {
      member: chosen.member,
      role: crewRole(chosen.member, tier),
      milesAway: chosen.milesAway,
      confident: chosen.milesAway <= (chosen.member.radiusMiles ?? CREW_RADIUS_MILES),
    };
  }

  // No location at all yet (nothing typed, nothing geocoded) — not "outside
  // the service area", just too early to know. Any driver is a fine
  // placeholder here; loadRoute() replaces this with a real ranked match the
  // moment an address resolves.
  const fallback = CREW.find((member) => crewRole(member, tier) === "driver") ?? CREW[0];
  return {
    member: fallback,
    role: crewRole(fallback, tier),
    milesAway: null,
    confident: false,
  };
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
    // No radius cutoff here either — same reasoning as matchCrew: the second
    // face offered should be whoever is actually closest, not "closest within
    // range, or else the first name in the array."
    const ranked = others
      .map((member) => ({ member, milesAway: haversineMiles(point, member.base) }))
      .sort((a, b) => a.milesAway - b.milesAway);
    // Offset the seed so the helper slot doesn't keep landing on whoever the
    // driver rotation just skipped over.
    return pickFromTieBand(ranked, rotationSeed(point) + 1).member;
  }
  return others[0];
}
