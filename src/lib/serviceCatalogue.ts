// Turning stored edits into the catalogue the business actually sells.
//
// The services and prices in landscaping.ts are the defaults — what this
// company does out of the box. Everything here is about the owner changing
// that: raising a price, rewriting a description, adding a service nobody
// anticipated. Those edits live in the ServiceConfig table and this module
// lays them over the defaults.
//
// Two rules survive editing, and they are the reason this file exists rather
// than the admin page writing rows straight to the database:
//
//   1. Nothing bookable may reach the CSLB exemption limit. That isn't a
//      pricing preference, it's the edge of what an unlicensed business is
//      allowed to sell directly, and a price typed into a form at midnight
//      must not be able to cross it.
//   2. Every price has to leave the crew the hourly rate /drive advertises.
//      A price that doesn't makes the recruiting page a lie.
//
// Both are checked here, on write, and both are checked again by the
// invariant test against the shipped defaults. An edit that fails is refused
// with the number that would pass, because "invalid" on its own just makes
// someone guess.

import {
  BUILT_IN_MAJOR_TRADES,
  type MajorTradeProject,
} from "@/lib/majorTrades";
import {
  BUILT_IN_CATALOGUE,
  EXEMPTION_LIMIT,
  LANDSCAPING_CONSTANTS,
  YARD_SIZES,
  type CostRow,
  type LandscapingServiceCard,
  type ServiceCatalogue,
  type YardSizeValue,
} from "@/lib/landscaping";

const { CREW_FLOOR_HOURLY, PLATFORM_RATE } = LANDSCAPING_CONSTANTS;

/**
 * Whether we do the work or pass it on.
 *
 * The distinction is the whole compliance model, so it is a field rather than
 * an inference: a PRICED service carries a flat price and can be booked and
 * paid for here; a REFERRAL one carries no price at all, cannot be booked,
 * and goes out to licensed contractors who contract with the customer
 * directly. Painting a whole house is the second kind. Painting a fence
 * panel, under the exemption limit, could be the first.
 */
export type ServiceMode = "PRICED" | "REFERRAL";

export function isServiceMode(value: unknown): value is ServiceMode {
  return value === "PRICED" || value === "REFERRAL";
}

/** One stored edit, in the shape the admin form posts and the table holds. */
export type ServiceConfigInput = {
  value: string;
  mode: ServiceMode;
  label: string;
  shortLabel: string;
  description: string;
  includes: string[];
  excludes: string[];
  allowsRecurring: boolean;
  materialsNote: string | null;
  active: boolean;
  sortOrder: number;
  prices: Record<YardSizeValue, number>;
  cost: Record<YardSizeValue, CostRow>;
};

/** A row as it comes back from Prisma, with the JSON columns still loose. */
export type ServiceConfigRow = Omit<ServiceConfigInput, "prices" | "cost" | "mode"> & {
  mode?: string | null;
  prices: unknown;
  cost: unknown;
};

const SIZES = YARD_SIZES.map((size) => size.value);

/**
 * A stable key: uppercase, underscores, no spaces.
 *
 * It goes into Booking.landscapingService and is read back for years, so it
 * has to survive the label being renamed. Derived from the label once, on
 * creation, and then never again.
 */
export function slugifyServiceValue(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function readCostRow(raw: unknown): CostRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const hours = row.hours as Record<string, unknown> | undefined;
  if (!hours || !isFiniteNumber(hours.low) || !isFiniteNumber(hours.high)) return null;
  if (!isFiniteNumber(row.crewSize) || !isFiniteNumber(row.supplies)) return null;
  return {
    hours: { low: hours.low, high: hours.high },
    crewSize: row.crewSize,
    supplies: row.supplies,
  };
}

/**
 * The lowest price that clears the wage floor for a given cost row.
 *
 * Returned in error messages so a refusal comes with the answer: the floor is
 * checked at the slow end of the hours estimate, after supplies, on the
 * crew's share of the price.
 */
export function minimumPriceFor(cost: CostRow): number {
  const needed = CREW_FLOOR_HOURLY * cost.hours.high + cost.supplies;
  return Math.ceil(needed / (1 - PLATFORM_RATE));
}

export type Validation =
  | { ok: true; value: ServiceConfigInput }
  | { ok: false; errors: string[] };

/** Everything that has to be true before an edit is allowed to be stored. */
export function validateServiceConfig(raw: unknown): Validation {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { ok: false, errors: ["No service sent."] };
  const input = raw as Record<string, unknown>;

  const text = (key: string, label: string, max = 200) => {
    const value = typeof input[key] === "string" ? (input[key] as string).trim() : "";
    if (!value) errors.push(`${label} is required.`);
    if (value.length > max) errors.push(`${label} is too long (max ${max}).`);
    return value;
  };

  const label = text("label", "Name");
  const shortLabel = text("shortLabel", "Short name", 40);
  const description = text("description", "Description", 300);

  const value =
    typeof input.value === "string" && input.value.trim()
      ? slugifyServiceValue(input.value)
      : slugifyServiceValue(label);
  if (!value) errors.push("Name must contain at least one letter or number.");

  const list = (key: string) =>
    Array.isArray(input[key])
      ? (input[key] as unknown[])
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const mode: ServiceMode = isServiceMode(input.mode) ? input.mode : "PRICED";

  const prices = {} as Record<YardSizeValue, number>;
  const cost = {} as Record<YardSizeValue, CostRow>;
  const rawPrices = (input.prices ?? {}) as Record<string, unknown>;
  const rawCost = (input.cost ?? {}) as Record<string, unknown>;

  // Nothing below applies to work we don't do. A referral has no price to
  // check against the exemption limit and no crew to underpay — checking it
  // anyway would mean inventing an hours estimate for a job we never quote.
  for (const size of mode === "REFERRAL" ? [] : SIZES) {
    const sizeLabel = YARD_SIZES.find((s) => s.value === size)?.label ?? size;
    const price = rawPrices[size];
    if (!isFiniteNumber(price) || price < 1 || !Number.isInteger(price)) {
      errors.push(`${sizeLabel}: price must be a whole number of dollars.`);
      continue;
    }
    // Rule 1. Not negotiable — see the note at the top of this file.
    if (price >= EXEMPTION_LIMIT) {
      errors.push(
        `${sizeLabel}: $${price} is at or over the $${EXEMPTION_LIMIT.toLocaleString()} limit we may sell directly. Price it below that, or send the job to the licensed-contractor path.`,
      );
      continue;
    }

    const costRow = readCostRow(rawCost[size]);
    if (!costRow) {
      errors.push(`${sizeLabel}: hours, crew size and supplies are all required.`);
      continue;
    }
    if (costRow.hours.low <= 0 || costRow.hours.high < costRow.hours.low) {
      errors.push(`${sizeLabel}: hours must be positive, and the high end can't be lower than the low.`);
      continue;
    }
    if (costRow.crewSize < 1 || !Number.isInteger(costRow.crewSize)) {
      errors.push(`${sizeLabel}: crew size must be at least 1.`);
      continue;
    }
    if (costRow.supplies < 0) {
      errors.push(`${sizeLabel}: supplies can't be negative.`);
      continue;
    }

    // Rule 2, with the answer attached.
    const floor = minimumPriceFor(costRow);
    if (price < floor) {
      errors.push(
        `${sizeLabel}: $${price} leaves the crew under $${CREW_FLOOR_HOURLY}/hour on a ${costRow.hours.high}-hour job. $${floor} is the lowest that works.`,
      );
      continue;
    }

    prices[size] = price;
    cost[size] = costRow;
  }

  if (mode === "REFERRAL") {
    for (const size of SIZES) {
      prices[size] = 0;
      cost[size] = { hours: { low: 0, high: 0 }, crewSize: 0, supplies: 0 };
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      value,
      mode,
      label,
      shortLabel,
      description,
      includes: list("includes"),
      excludes: list("excludes"),
      allowsRecurring: input.allowsRecurring === true,
      materialsNote:
        typeof input.materialsNote === "string" && input.materialsNote.trim()
          ? input.materialsNote.trim()
          : null,
      active: input.active !== false,
      sortOrder: isFiniteNumber(input.sortOrder) ? Math.trunc(input.sortOrder) : 100,
      prices,
      cost,
    },
  };
}

/** A stored row, back in the shape the rest of the app understands. */
function rowMode(row: ServiceConfigRow): ServiceMode {
  return isServiceMode(row.mode) ? row.mode : "PRICED";
}

function rowToConfig(row: ServiceConfigRow): ServiceConfigInput | null {
  const prices = {} as Record<YardSizeValue, number>;
  const cost = {} as Record<YardSizeValue, CostRow>;
  const rawPrices = (row.prices ?? {}) as Record<string, unknown>;
  const rawCost = (row.cost ?? {}) as Record<string, unknown>;

  for (const size of SIZES) {
    const price = rawPrices[size];
    const costRow = readCostRow(rawCost[size]);
    // A row missing a size is a row we can't price, and a service that can't
    // be priced everywhere shouldn't appear anywhere.
    if (!isFiniteNumber(price) || !costRow) return null;
    prices[size] = price;
    cost[size] = costRow;
  }
  return { ...row, mode: rowMode(row), prices, cost };
}

/**
 * The defaults with the stored edits laid over them.
 *
 * Built-ins keep their shipped order unless an edit moves them; anything new
 * sorts after by sortOrder, then alphabetically, so adding a service doesn't
 * silently reshuffle the homepage.
 */
export function mergeCatalogue(rows: readonly ServiceConfigRow[]): ServiceCatalogue {
  const services: LandscapingServiceCard[] = [];
  const price: Record<string, Record<YardSizeValue, number>> = {};
  const cost: Record<string, Record<YardSizeValue, CostRow>> = {};

  const edits = new Map<string, ServiceConfigInput>();
  for (const row of rows) {
    // Work we sub out has no price and belongs on the referral list, not
    // here. A shipped service switched to REFERRAL therefore disappears from
    // the catalogue, which is exactly what switching it means.
    if (rowMode(row) === "REFERRAL") {
      edits.set(row.value, { ...(row as unknown as ServiceConfigInput), active: false });
      continue;
    }
    const config = rowToConfig(row);
    if (config) edits.set(config.value, config);
  }

  const push = (card: LandscapingServiceCard, p: Record<YardSizeValue, number>, c: Record<YardSizeValue, CostRow>) => {
    services.push(card);
    price[card.value] = p;
    cost[card.value] = c;
  };

  for (const card of BUILT_IN_CATALOGUE.services) {
    const edit = edits.get(card.value);
    if (!edit) {
      push(card, BUILT_IN_CATALOGUE.price[card.value], BUILT_IN_CATALOGUE.cost[card.value]);
      continue;
    }
    edits.delete(card.value);
    if (!edit.active) continue;
    push(configToCard(edit), edit.prices, edit.cost);
  }

  const added = [...edits.values()]
    .filter((edit) => edit.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  for (const edit of added) push(configToCard(edit), edit.prices, edit.cost);

  return { services, price, cost };
}

/**
 * The trades we pass on: the shipped list with stored edits laid over it.
 *
 * "Something else" is pinned last however the list is reordered — it is the
 * catch-all, and a catch-all in the middle of a list reads as an option
 * someone forgot to name.
 */
export function mergeReferrals(rows: readonly ServiceConfigRow[]): MajorTradeProject[] {
  const edits = new Map<string, ServiceConfigRow>();
  for (const row of rows) {
    if (rowMode(row) === "REFERRAL") edits.set(row.value, row);
  }

  const list: MajorTradeProject[] = [];
  for (const trade of BUILT_IN_MAJOR_TRADES) {
    const edit = edits.get(trade.value);
    if (!edit) {
      list.push(trade);
      continue;
    }
    edits.delete(trade.value);
    if (!edit.active) continue;
    list.push({ value: edit.value, label: edit.label, description: edit.description });
  }

  const added = [...edits.values()]
    .filter((row) => row.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((row) => ({ value: row.value, label: row.label, description: row.description }));

  const all = [...list, ...added];
  const other = all.filter((trade) => trade.value === "OTHER");
  return [...all.filter((trade) => trade.value !== "OTHER"), ...other];
}

function configToCard(config: ServiceConfigInput): LandscapingServiceCard {
  return {
    value: config.value,
    label: config.label,
    shortLabel: config.shortLabel,
    description: config.description,
    includes: config.includes,
    excludes: config.excludes,
    allowsRecurring: config.allowsRecurring,
    materialsNote: config.materialsNote,
  };
}

/**
 * A built-in, in editable form — what the admin form is seeded with the first
 * time someone opens a shipped service, so editing one price doesn't mean
 * retyping everything else.
 */
export function builtInAsConfig(value: string): ServiceConfigInput | null {
  const card = BUILT_IN_CATALOGUE.services.find((service) => service.value === value);
  if (!card) return null;
  return {
    value: card.value,
    mode: "PRICED",
    label: card.label,
    shortLabel: card.shortLabel,
    description: card.description,
    includes: [...card.includes],
    excludes: [...card.excludes],
    allowsRecurring: card.allowsRecurring,
    materialsNote: card.materialsNote,
    active: true,
    sortOrder: 100,
    prices: { ...BUILT_IN_CATALOGUE.price[value] },
    cost: { ...BUILT_IN_CATALOGUE.cost[value] },
  };
}

/** A shipped referral trade, in editable form. */
export function builtInTradeAsConfig(value: string): ServiceConfigInput | null {
  const trade = BUILT_IN_MAJOR_TRADES.find((t) => t.value === value);
  if (!trade) return null;
  const prices = {} as Record<YardSizeValue, number>;
  const cost = {} as Record<YardSizeValue, CostRow>;
  for (const size of SIZES) {
    prices[size] = 0;
    cost[size] = { hours: { low: 0, high: 0 }, crewSize: 0, supplies: 0 };
  }
  return {
    value: trade.value,
    mode: "REFERRAL",
    label: trade.label,
    shortLabel: trade.label,
    description: trade.description,
    includes: [],
    excludes: [],
    allowsRecurring: false,
    materialsNote: null,
    active: true,
    sortOrder: 100,
    prices,
    cost,
  };
}

/** Which shipped services exist, so the editor can offer to revert one. */
export function isBuiltInService(value: string): boolean {
  return (
    BUILT_IN_CATALOGUE.services.some((service) => service.value === value) ||
    BUILT_IN_MAJOR_TRADES.some((trade) => trade.value === value)
  );
}
