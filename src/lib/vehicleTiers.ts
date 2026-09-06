// The "pick your truck" cards: what each vehicle is, who comes with it, and
// what fits in it. The money lives in @/lib/pricing, which prices these from
// crew size and the advertised hourly rates — keep this file to the facts a
// customer reads on the card.

export const VEHICLE_TIER_VALUES = ["PICKUP", "VAN", "BOX_TRUCK"] as const;
export type VehicleTierValue = (typeof VEHICLE_TIER_VALUES)[number];

export type VehicleTier = {
  value: VehicleTierValue;
  label: string;
  /** People on the job, driver included. Pricing pays 1 driver + the rest as helpers. */
  crewSize: number;
  crew: string;
  /** Short line under the name, e.g. what actually fits. */
  fits: string;
  /** Bed/box length shown on the card, matching how Lugg-style cards read. */
  dimensions: string;
};

export const VEHICLE_TIERS: VehicleTier[] = [
  {
    value: "PICKUP",
    label: "Pickup",
    crewSize: 1,
    crew: "1 mover",
    fits: "A couch, a mattress, a few boxes",
    dimensions: "6 ft bed",
  },
  {
    value: "VAN",
    label: "Cargo van",
    crewSize: 2,
    crew: "2 movers",
    fits: "Studio or a bedroom's worth",
    dimensions: "8 ft cargo",
  },
  {
    value: "BOX_TRUCK",
    label: "Box truck",
    crewSize: 2,
    crew: "2 movers",
    fits: "A full apartment or house",
    dimensions: "12–16 ft box",
  },
];

export function isVehicleTierValue(value: string): value is VehicleTierValue {
  return (VEHICLE_TIER_VALUES as readonly string[]).includes(value);
}

export function getVehicleTier(value: string): VehicleTier | undefined {
  return VEHICLE_TIERS.find((t) => t.value === value);
}
