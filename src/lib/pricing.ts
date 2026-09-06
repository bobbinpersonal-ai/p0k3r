// What a move costs, built up from what it costs us to do it.
//
// The old numbers were flat placeholders with a per-tier multiplier bolted on,
// so there was no way to tell whether a given quote actually paid the crew.
// This prices from the bottom up instead:
//
//     crew payout  =  (labor hours + drive time) x crew hourly rate
//                     +  vehicle allowance x miles
//     customer pays =  crew payout / (1 - platform rate)
//
// The crew rates below are not free parameters — they are what lovemeafter.com
// /drive promises applicants ($25-$32/hr driving depending on vehicle, $19/hr
// helping). If you change one, change the other, or the site is advertising a
// wage the price can't cover.

import { type MoveSizeValue } from "@/lib/moveSizes";
import { VEHICLE_TIERS, type VehicleTier, type VehicleTierValue } from "@/lib/vehicleTiers";

// --- What the crew earns -----------------------------------------------------

/** Driver hourly by vehicle, matching the /drive page's "$25-$32/hour". */
const DRIVER_HOURLY: Record<VehicleTierValue, number> = {
  PICKUP: 25,
  VAN: 28,
  BOX_TRUCK: 32,
};

/** Helper hourly, matching the /drive page's "$19/hour plus tips". */
const HELPER_HOURLY = 19;

/**
 * Helpers riding along on top of the driver, derived from the crew size shown
 * on the card. Deriving it means the price can't drift from the "2 movers" the
 * customer was promised.
 */
function helpersFor(tier: VehicleTierValue): number {
  const card = VEHICLE_TIERS.find((t) => t.value === tier);
  return Math.max(0, (card?.crewSize ?? 1) - 1);
}

/**
 * Paid to the driver per mile for fuel and wear, on top of their hourly. Higher
 * for the bigger vehicles because they drink more — a 16ft box truck is doing
 * well to see 10 mpg loaded.
 */
const VEHICLE_PER_MILE: Record<VehicleTierValue, number> = {
  PICKUP: 0.6,
  VAN: 0.7,
  BOX_TRUCK: 0.85,
};

/**
 * Drivers don't materialise at the pickup and vanish at the drop-off: they
 * drive to the job and home again. Paying the vehicle allowance on more miles
 * than the route itself is what keeps a long haul from quietly costing the
 * driver money in fuel. Time for that deadhead isn't paid hourly, which is the
 * main thing to revisit once real long-distance jobs come in.
 */
const DEADHEAD_FACTOR = 1.6;

// --- What the platform takes -------------------------------------------------

/**
 * LoveMeAfter's cut, out of which come insurance, card processing (~3%),
 * support, and marketing. Deliberately at the low end of what the on-demand
 * moving apps take — the pitch is that movers keep more and customers pay less
 * than the incumbents, and that only works if this stays modest.
 */
const PLATFORM_RATE = 0.25;

/** No job is worth dispatching below this, whatever the math says. */
const MINIMUM_PRICE = 79;

// --- How long a job takes ----------------------------------------------------

/**
 * On-site hours: carrying, loading, unloading, stairs. Drive time is added on
 * top from the real route, so these are the load/unload portion only. The range
 * is what makes the customer's quote a range.
 */
const LABOR_HOURS: Record<MoveSizeValue, { low: number; high: number }> = {
  FEW_ITEMS: { low: 0.75, high: 1.25 },
  STUDIO: { low: 1.5, high: 2.25 },
  ONE_BED: { low: 2, high: 3 },
  TWO_BED: { low: 3, high: 4.5 },
  THREE_PLUS_BED: { low: 4.5, high: 6.5 },
};

/** Surface-street average, used only when we have miles but no routed duration. */
const FALLBACK_MPH = 30;

export type PriceBreakdown = {
  /** What the customer sees. */
  low: number;
  high: number;
  /** Crew take-home at each end of the range, before tips. */
  crewPayoutLow: number;
  crewPayoutHigh: number;
  /** Platform's share at each end. */
  platformFeeLow: number;
  platformFeeHigh: number;
  /** Total paid hours (labor + drive) at each end, for the "~3-4 hrs" line. */
  hoursLow: number;
  hoursHigh: number;
  /** Combined crew rate, e.g. 47 for a driver at 28 plus a helper at 19. */
  crewHourly: number;
  /** Vehicle allowance included in the price. */
  vehicleAllowance: number;
  /** Route miles the quote was built on, null when we haven't mapped it yet. */
  miles: number | null;
};

export type TierQuote = PriceBreakdown & { tier: VehicleTier };

export function crewHourlyFor(tier: VehicleTierValue): number {
  return DRIVER_HOURLY[tier] + helpersFor(tier) * HELPER_HOURLY;
}

/**
 * Round *up* to the next $5, so quotes read like prices without ever landing
 * below what the job costs. Rounding to the nearest $5 shaves up to $2.50 off,
 * which is enough to push the crew's share under the wage it was derived from —
 * the wage is a floor, so the rounding has to go this way.
 */
function ceilToFive(value: number): number {
  return Math.ceil(value / 5) * 5;
}

export type RouteInput = {
  miles: number | null;
  /** Routed drive time. Estimated from miles when the router didn't give one. */
  minutes?: number | null;
};

export function quoteTier(
  moveSize: MoveSizeValue,
  tierValue: VehicleTierValue,
  route: RouteInput,
): PriceBreakdown {
  const labor = LABOR_HOURS[moveSize];
  const crewHourly = crewHourlyFor(tierValue);
  const miles = route.miles;

  // Drive time is paid work, so it goes into the hours, not just the mileage.
  const driveHours =
    miles === null
      ? 0
      : (route.minutes ?? (miles / FALLBACK_MPH) * 60) / 60;

  const hoursLow = labor.low + driveHours;
  const hoursHigh = labor.high + driveHours;

  const vehicleAllowance =
    miles === null ? 0 : miles * DEADHEAD_FACTOR * VEHICLE_PER_MILE[tierValue];

  const payoutLow = hoursLow * crewHourly + vehicleAllowance;
  const payoutHigh = hoursHigh * crewHourly + vehicleAllowance;

  const low = Math.max(MINIMUM_PRICE, ceilToFive(payoutLow / (1 - PLATFORM_RATE)));
  const high = Math.max(low + 5, ceilToFive(payoutHigh / (1 - PLATFORM_RATE)));

  // Report the payout implied by the price the customer actually sees, so the
  // crew's share and the platform's share always add up to the quote. Rounded
  // up for the same reason as the price: the platform absorbs the cent-level
  // rounding, never the crew.
  const crewPayoutLow = Math.ceil(low * (1 - PLATFORM_RATE));
  const crewPayoutHigh = Math.ceil(high * (1 - PLATFORM_RATE));

  return {
    low,
    high,
    crewPayoutLow,
    crewPayoutHigh,
    platformFeeLow: low - crewPayoutLow,
    platformFeeHigh: high - crewPayoutHigh,
    hoursLow,
    hoursHigh,
    crewHourly,
    vehicleAllowance: Math.round(vehicleAllowance),
    miles,
  };
}

/** Price every tier for the cards on the "pick your truck" step. */
export function quoteTiers(moveSize: MoveSizeValue, route: RouteInput): TierQuote[] {
  return VEHICLE_TIERS.map((tier) => ({
    tier,
    ...quoteTier(moveSize, tier.value, route),
  }));
}

export function quoteForTier(
  moveSize: MoveSizeValue,
  route: RouteInput,
  tierValue: VehicleTierValue,
): TierQuote | undefined {
  return quoteTiers(moveSize, route).find((q) => q.tier.value === tierValue);
}

/** Exposed for the pricing sanity table and any future admin view. */
export const PRICING_CONSTANTS = {
  DRIVER_HOURLY,
  HELPER_HOURLY,
  helpersFor,
  VEHICLE_PER_MILE,
  DEADHEAD_FACTOR,
  PLATFORM_RATE,
  MINIMUM_PRICE,
  LABOR_HOURS,
};
