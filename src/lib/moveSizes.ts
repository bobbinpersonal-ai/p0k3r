// Plain values shared by client and server code. Deliberately doesn't import
// @prisma/client so this file is safe to use from client components — the
// string values here must match the MoveSize enum in prisma/schema.prisma.

export const MOVE_SIZE_VALUES = [
  "FEW_ITEMS",
  "STUDIO",
  "ONE_BED",
  "TWO_BED",
  "THREE_PLUS_BED",
] as const;

export type MoveSizeValue = (typeof MOVE_SIZE_VALUES)[number];

export const MOVE_SIZE_OPTIONS: {
  value: MoveSizeValue;
  label: string;
  description: string;
  estimateLow: number;
  estimateHigh: number;
}[] = [
  {
    value: "FEW_ITEMS",
    label: "A few items",
    description: "One or two big items, e.g. a couch or mattress",
    estimateLow: 79,
    estimateHigh: 129,
  },
  {
    value: "STUDIO",
    label: "Studio / dorm",
    description: "Studio apartment or single room",
    estimateLow: 149,
    estimateHigh: 219,
  },
  {
    value: "ONE_BED",
    label: "1 bedroom",
    description: "One bedroom apartment",
    estimateLow: 219,
    estimateHigh: 319,
  },
  {
    value: "TWO_BED",
    label: "2 bedroom",
    description: "Two bedroom apartment or small house",
    estimateLow: 319,
    estimateHigh: 459,
  },
  {
    value: "THREE_PLUS_BED",
    label: "3+ bedroom / house",
    description: "Larger home, may need extra movers",
    estimateLow: 459,
    estimateHigh: 699,
  },
];

export const TIME_WINDOWS = [
  "Morning (8am–11am)",
  "Midday (11am–2pm)",
  "Afternoon (2pm–5pm)",
  "Evening (5pm–8pm)",
] as const;

export function isMoveSizeValue(value: string): value is MoveSizeValue {
  return (MOVE_SIZE_VALUES as readonly string[]).includes(value);
}

// Placeholder tiers meant to get a quote on the page today. Swap these for
// numbers calibrated against real job costs (crew size, truck, distance)
// once you have a handful of completed moves to compare against.
export function getEstimateForMoveSize(moveSize: MoveSizeValue) {
  const option = MOVE_SIZE_OPTIONS.find((o) => o.value === moveSize);
  if (!option) {
    throw new Error(`Unknown move size: ${moveSize}`);
  }
  return { estimateLow: option.estimateLow, estimateHigh: option.estimateHigh };
}
