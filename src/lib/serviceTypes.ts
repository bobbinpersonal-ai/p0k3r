// What kind of help a customer is booking us for. Plain strings rather than
// a native Postgres enum — see the comment in schema.prisma. "OTHER" pairs
// with Booking.serviceTypeOther for a free-text description.

export const SERVICE_TYPES = [
  {
    value: "SINGLE_ITEM",
    label: "Single item pickup or delivery",
    description: "A couch, mattress, appliance, or one big thing",
  },
  {
    value: "APARTMENT_HOUSE",
    label: "Apartment or house move",
    description: "A full move from one place to another",
  },
  {
    value: "STORAGE",
    label: "Storage unit move",
    description: "Load up, empty out, or shuffle between units",
  },
  {
    value: "OFFICE",
    label: "Office or business move",
    description: "Desks, inventory, or equipment",
  },
  {
    value: "DONATION",
    label: "Donation drop-off",
    description: "Furniture or items headed to a donation center",
  },
  {
    value: "JUNK_REMOVAL",
    label: "Junk removal or haul-away",
    description: "Clear it out — we take it to the dump or a donation center",
  },
  {
    value: "LOADING_HELP",
    label: "Loading or unloading help",
    description: "You have the truck, pod, or trailer — we bring the muscle",
  },
  {
    value: "OTHER",
    label: "Something else",
    description: "Tell us what you need below",
  },
] as const;

export type ServiceTypeValue = (typeof SERVICE_TYPES)[number]["value"];

export function isServiceTypeValue(value: string): value is ServiceTypeValue {
  return (SERVICE_TYPES as readonly { value: string }[]).some((s) => s.value === value);
}

export function getServiceTypeLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}
