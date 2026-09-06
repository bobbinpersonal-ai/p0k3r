// What people are actually booking us for — the first question the flow asks.
//
// This used to sit at step 4, after the customer had already typed two
// addresses. That order assumed everyone arriving was moving house. Most of the
// traffic we're buying is Facebook Marketplace ads, where someone has just
// bought a couch from a stranger and wants to know, in one glance, whether we
// do that. Asking for their address first and the job last got that backwards.
//
// Each option carries what it implies, so answering this shortens everything
// after it: a "need a hand" job doesn't get asked for a drop-off address, and a
// single-item pickup doesn't get asked how many bedrooms.
//
// Values are plain strings stored on Booking.serviceType — see the comment in
// schema.prisma about native enums.

import type { DropoffMode } from "@/lib/dropoffModes";
import type { MoveSizeValue } from "@/lib/moveSizes";

export type ServiceType = {
  value: string;
  label: string;
  description: string;
  /** Where this kind of job usually ends up, preselected on the address step. */
  defaultDropoffMode: DropoffMode;
  /** Preset when the job type already tells us the scale. Null = ask. */
  defaultMoveSize: MoveSizeValue | null;
  /**
   * Shown on the first screen without expanding. The long tail is real work we
   * want, but a first screen people scan in two seconds beats a complete one
   * they read none of.
   */
  primary: boolean;
};

export const SERVICE_TYPES = [
  {
    value: "MARKETPLACE_PICKUP",
    label: "Marketplace pickup",
    description: "Bought something online — we'll go collect it",
    defaultDropoffMode: "ADDRESS",
    defaultMoveSize: "FEW_ITEMS",
    primary: true,
  },
  {
    value: "SINGLE_ITEM",
    label: "One big item",
    description: "A couch, mattress, fridge, or appliance",
    defaultDropoffMode: "ADDRESS",
    defaultMoveSize: "FEW_ITEMS",
    primary: true,
  },
  {
    value: "LOADING_HELP",
    label: "Need a hand",
    description: "Lifting, loading, or shifting things around — no truck needed",
    defaultDropoffMode: "SAME_PLACE",
    defaultMoveSize: null,
    primary: true,
  },
  {
    value: "APARTMENT_HOUSE",
    label: "Moving home",
    description: "A studio, apartment, or house",
    defaultDropoffMode: "ADDRESS",
    defaultMoveSize: null,
    primary: true,
  },
  {
    value: "JUNK_REMOVAL",
    label: "Junk or dump run",
    description: "Clear it out — we haul it away",
    defaultDropoffMode: "WE_CHOOSE",
    defaultMoveSize: null,
    primary: true,
  },
  {
    value: "DONATION",
    label: "Donation drop-off",
    description: "We take it somewhere it'll get used",
    defaultDropoffMode: "WE_CHOOSE",
    defaultMoveSize: null,
    primary: true,
  },
  {
    value: "STORAGE",
    label: "Storage unit",
    description: "Load up, empty out, or switch units",
    defaultDropoffMode: "ADDRESS",
    defaultMoveSize: null,
    primary: false,
  },
  {
    value: "OFFICE",
    label: "Office or business",
    description: "Desks, inventory, or equipment",
    defaultDropoffMode: "ADDRESS",
    defaultMoveSize: null,
    primary: false,
  },
  {
    value: "OTHER",
    label: "Something else",
    description: "Tell us what you need",
    defaultDropoffMode: "ADDRESS",
    defaultMoveSize: null,
    primary: false,
  },
] as const satisfies readonly ServiceType[];

export type ServiceTypeValue = (typeof SERVICE_TYPES)[number]["value"];

export function isServiceTypeValue(value: string): value is ServiceTypeValue {
  return SERVICE_TYPES.some((s) => s.value === value);
}

export function getServiceType(value: string): ServiceType | undefined {
  return SERVICE_TYPES.find((s) => s.value === value);
}

export function getServiceTypeLabel(value: string): string {
  return getServiceType(value)?.label ?? value;
}

/** The six on the first screen; the rest sit behind "More options". */
export const PRIMARY_SERVICE_TYPES = SERVICE_TYPES.filter((s) => s.primary);
export const SECONDARY_SERVICE_TYPES = SERVICE_TYPES.filter((s) => !s.primary);
