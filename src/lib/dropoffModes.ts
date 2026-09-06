// Not every job has two addresses.
//
// The booking flow started life assuming a move: pick it up here, put it down
// there, price the drive between. But a good share of the work isn't a move at
// all — a couch to Goodwill, a garage cleared to the dump, two people helping
// load a POD that's already in the driveway, a piano shifted to the other side
// of a room. Demanding a second address for those jobs asks the customer to
// invent one.
//
// The three modes below are split by what the *crew vehicle* does, because
// that's what the price hangs on:
//
//   ADDRESS     a real trip we can measure -> route it, bill the miles
//   SAME_PLACE  no trip at all             -> crew time only, zero miles
//   WE_CHOOSE   a real trip we can't measure yet, because we pick the
//               destination -> bill a typical local run so the driver isn't
//               eating the fuel and the hour it takes
//
// Collapsing the last two would mean either overcharging on-site jobs for a
// drive that never happens, or paying a driver nothing for the run to the
// dump. Both were worth the extra option.

export const DROPOFF_MODE_VALUES = ["ADDRESS", "SAME_PLACE", "WE_CHOOSE"] as const;
export type DropoffMode = (typeof DROPOFF_MODE_VALUES)[number];

export const DROPOFF_MODES: {
  value: DropoffMode;
  label: string;
  description: string;
}[] = [
  {
    value: "ADDRESS",
    label: "To another address",
    description: "A move, a delivery, a storage unit",
  },
  {
    value: "SAME_PLACE",
    label: "Stays at this address",
    description: "Loading, unloading, or shifting things around on site",
  },
  {
    value: "WE_CHOOSE",
    label: "Donation or dump — you pick",
    description: "We haul it off and find the right place for it",
  },
];

export function isDropoffMode(value: string): value is DropoffMode {
  return (DROPOFF_MODE_VALUES as readonly string[]).includes(value);
}

export function getDropoffMode(value: string): DropoffMode | undefined {
  return isDropoffMode(value) ? value : undefined;
}

/** Only one of the three needs the customer to type a second address. */
export function requiresDropoffAddress(mode: DropoffMode): boolean {
  return mode === "ADDRESS";
}

/**
 * A typical round trip to the nearest donation centre or transfer station.
 *
 * Deliberately a real distance rather than zero: someone drives it, burns the
 * fuel and spends the time, and the wage model has to see those miles or the
 * driver absorbs them. Twelve miles is a short local run across the towns we
 * serve; a dispatcher adjusts it when they confirm.
 */
export const LOCAL_RUN_MILES = 12;
const LOCAL_RUN_MINUTES = 24;

/** What the pricing model should treat the trip as, given the mode. */
export function routeForMode(
  mode: DropoffMode,
  measured: { miles: number | null; minutes: number | null },
): { miles: number | null; minutes: number | null } {
  if (mode === "SAME_PLACE") return { miles: 0, minutes: 0 };
  if (mode === "WE_CHOOSE") return { miles: LOCAL_RUN_MILES, minutes: LOCAL_RUN_MINUTES };
  return measured;
}

/** What gets written into the booking record when there's no second address. */
export function dropoffLabelForMode(mode: DropoffMode): string {
  if (mode === "SAME_PLACE") return "Same address — on-site job";
  if (mode === "WE_CHOOSE") return "Donation or dump — LoveMeAfter chooses";
  return "";
}
