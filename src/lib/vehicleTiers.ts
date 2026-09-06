// Vehicle tiers for the quote step — the "pick your truck" cards, priced off
// the move size estimate plus the actual distance between the two addresses.
//
// This deliberately builds on getEstimateForMoveSize() rather than inventing a
// second pricing system: the move-size range stays the base, the tier scales it
// for crew/vehicle, and mileage past the included radius is added on top. Like
// those base numbers, the multipliers here are still placeholders — calibrate
// them against real completed jobs before leaning on them hard.

import { getEstimateForMoveSize, type MoveSizeValue } from "@/lib/moveSizes";

export const VEHICLE_TIER_VALUES = ["PICKUP", "VAN", "BOX_TRUCK"] as const;
export type VehicleTierValue = (typeof VEHICLE_TIER_VALUES)[number];

export type VehicleTier = {
  value: VehicleTierValue;
  label: string;
  crew: string;
  /** Short line under the name, e.g. what actually fits. */
  fits: string;
  /** Bed/box length shown on the card, matching how Lugg-style cards read. */
  dimensions: string;
  /** Scales the move-size estimate for crew size and vehicle capacity. */
  multiplier: number;
};

export const VEHICLE_TIERS: VehicleTier[] = [
  {
    value: "PICKUP",
    label: "Pickup",
    crew: "1 mover",
    fits: "A couch, a mattress, a few boxes",
    dimensions: "6 ft bed",
    multiplier: 0.8,
  },
  {
    value: "VAN",
    label: "Cargo van",
    crew: "2 movers",
    fits: "Studio or a bedroom's worth",
    dimensions: "8 ft cargo",
    multiplier: 1,
  },
  {
    value: "BOX_TRUCK",
    label: "Box truck",
    crew: "2 movers",
    fits: "A full apartment or house",
    dimensions: "12–16 ft box",
    multiplier: 1.3,
  },
];

/** Miles bundled into the base price before per-mile pricing kicks in. */
const INCLUDED_MILES = 5;
const PER_MILE = 2.5;

export type TierQuote = {
  tier: VehicleTier;
  low: number;
  high: number;
  mileageFee: number;
};

export function isVehicleTierValue(value: string): value is VehicleTierValue {
  return (VEHICLE_TIER_VALUES as readonly string[]).includes(value);
}

export function getVehicleTier(value: string): VehicleTier | undefined {
  return VEHICLE_TIERS.find((t) => t.value === value);
}

/**
 * Price every tier for a given move size and trip distance. Pass miles = null
 * when we don't have a route yet — the mileage component is simply left off
 * rather than guessed, so the card still shows a usable starting range.
 */
export function quoteTiers(moveSize: MoveSizeValue, miles: number | null): TierQuote[] {
  const base = getEstimateForMoveSize(moveSize);
  const billableMiles = miles === null ? 0 : Math.max(0, miles - INCLUDED_MILES);
  const mileageFee = Math.round(billableMiles * PER_MILE);

  return VEHICLE_TIERS.map((tier) => ({
    tier,
    low: Math.round(base.estimateLow * tier.multiplier) + mileageFee,
    high: Math.round(base.estimateHigh * tier.multiplier) + mileageFee,
    mileageFee,
  }));
}

export function quoteForTier(
  moveSize: MoveSizeValue,
  miles: number | null,
  tierValue: VehicleTierValue,
): TierQuote | undefined {
  return quoteTiers(moveSize, miles).find((q) => q.tier.value === tierValue);
}
