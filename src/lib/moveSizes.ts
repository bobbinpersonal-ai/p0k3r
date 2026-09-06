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
}[] = [
  {
    value: "FEW_ITEMS",
    label: "A few items",
    description: "One or two big items, e.g. a couch or mattress",
  },
  {
    value: "STUDIO",
    label: "Studio / dorm",
    description: "Studio apartment or single room",
  },
  {
    value: "ONE_BED",
    label: "1 bedroom",
    description: "One bedroom apartment",
  },
  {
    value: "TWO_BED",
    label: "2 bedroom",
    description: "Two bedroom apartment or small house",
  },
  {
    value: "THREE_PLUS_BED",
    label: "3+ bedroom / house",
    description: "Larger home, may need extra movers",
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
