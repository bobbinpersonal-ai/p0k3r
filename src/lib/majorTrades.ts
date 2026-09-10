// The work we refer out instead of doing.
//
// California licenses construction. Under B&P 7048 an unlicensed person may
// take on minor work below a dollar threshold; past it — and for anything
// needing a building permit, or touching electrical, plumbing or structure —
// the job belongs to a licensed contractor. This company is not one.
//
// So these categories are not services with the price hidden. Nothing here can
// be booked, nothing is quoted, and no money changes hands: a request becomes
// a ContractorLead and goes out to independent CSLB-licensed contractors who
// contract with the customer directly. Keeping that distinction sharp in the
// data — separate table, separate route, separate words — is what stops it
// eroding the next time someone adds a feature in a hurry.

export const MAJOR_TRADE_PROJECTS = [
  {
    value: "KITCHEN_BATH",
    label: "Kitchen & Bath Remodeling",
    description: "Full or partial remodels, cabinetry, tile, fixtures",
  },
  {
    value: "TREE_WORK",
    label: "Tree Removal & Major Trimming",
    description: "Removals, large limbs, anything needing a climber or a crane",
  },
  {
    value: "HARDSCAPE",
    label: "Hardscape, Patios & Concrete",
    description: "Patios, driveways, retaining walls, pavers and slabs",
  },
  {
    value: "ROOFING_SIDING",
    label: "Roofing & Exterior Siding",
    description: "Roof repair and replacement, siding, fascia and soffits",
  },
  {
    value: "PAINTING",
    label: "Painting, Inside & Out",
    description: "Whole rooms, whole houses, cabinets and exterior repaints",
  },
  {
    value: "OTHER",
    label: "Something else",
    description: "Tell us what the project is",
  },
] as const;

/**
 * One trade we pass on, as callers get it back.
 *
 * A plain shape rather than the literal type of a row above, because this
 * list is editable: a trade added at /admin/services is as real as the ones
 * that ship here, and typing the value as a union of the shipped five would
 * make every runtime lookup lie about what it might be handed.
 */
export type MajorTradeProject = {
  value: string;
  label: string;
  description: string;
};

export type MajorTradeProjectValue = string;

/** The shipped list — the defaults an edit lays over. See serviceCatalogue.ts. */
export const BUILT_IN_MAJOR_TRADES: readonly MajorTradeProject[] = MAJOR_TRADE_PROJECTS;

export function isMajorTradeProject(
  value: string,
  projects: readonly MajorTradeProject[] = MAJOR_TRADE_PROJECTS,
): boolean {
  return projects.some((project) => project.value === value);
}

export function getMajorTradeLabel(
  value: string | null | undefined,
  projects: readonly MajorTradeProject[] = MAJOR_TRADE_PROJECTS,
): string {
  if (!value) return "";
  return projects.find((p) => p.value === value)?.label ?? value;
}

/**
 * The trade's name as it read when the customer asked for it.
 *
 * Same reasoning as bookedServiceLabel in landscaping.ts: renaming a trade
 * should change what we advertise, not what a past request says was asked
 * for.
 */
export function requestedTradeLabel(
  lead: { projectLabel?: string | null; projectType?: string | null },
  projects: readonly MajorTradeProject[] = MAJOR_TRADE_PROJECTS,
): string {
  return lead.projectLabel?.trim() || getMajorTradeLabel(lead.projectType, projects);
}

/** How many contractors a request is put in front of. Stated on the form. */
export const MATCH_COUNT = "2–3";

/**
 * The sentence that has to appear wherever this is offered.
 *
 * Not decoration: it is the difference between a referral and an unlicensed
 * bid. Anyone reading the form should finish it knowing they will be
 * contracting with someone else.
 */
export const REFERRAL_PROMISE =
  `Your request will be matched with ${MATCH_COUNT} licensed CSLB contractors in your area.`;
