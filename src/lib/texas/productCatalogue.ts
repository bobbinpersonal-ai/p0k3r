// Adding a product without a deploy.
//
// The price book in trades.ts is what this business ships with. What it
// actually sells is that, plus whatever has been added or changed at
// /admin/tx/products — because signing a supplier agreement is a Tuesday, not
// a release, and a rep quoting last quarter's Owens Corning price because
// nobody redeployed is a real way to lose money.
//
// One rule survives editing and is enforced on write: a product must cost less
// than the lowest price we will sell it for. Everything else about the pricing
// is the owner's business; selling below cost is not a pricing decision, it is
// an accounting accident.

import {
  TRADES,
  getTrade,
  type Tier,
  type Trade,
  type TradeOption,
} from "@/lib/texas/trades";

export type ProductConfigInput = {
  trade: string;
  value: string;
  label: string;
  description: string;
  brand: string | null;
  line: string | null;
  tier: Tier;
  warranty: string | null;
  sellingPoints: string[];
  costPerUnit: number;
  basePerUnit: number;
  active: boolean;
  sortOrder: number;
};

export type ProductConfigRow = Omit<ProductConfigInput, "tier"> & { tier?: string | null };

const TIERS: Tier[] = ["GOOD", "BETTER", "BEST"];
export const isTier = (value: unknown): value is Tier => TIERS.includes(value as Tier);

/**
 * A stable key, derived once from the name and then never again.
 *
 * It is written onto every EstimateLine that ever quotes this product, so a
 * later rename must not change it — the line has to keep meaning what it meant
 * on the day it was signed.
 */
export function slugifyProductValue(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export type Validation =
  | { ok: true; value: ProductConfigInput }
  | { ok: false; errors: string[] };

export function validateProduct(raw: unknown): Validation {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { ok: false, errors: ["No product sent."] };
  const input = raw as Record<string, unknown>;

  const text = (key: string, label: string, max: number, required = true) => {
    const value = typeof input[key] === "string" ? (input[key] as string).trim() : "";
    if (required && !value) errors.push(`${label} is required.`);
    if (value.length > max) errors.push(`${label} is too long (max ${max}).`);
    return value;
  };

  const trade = text("trade", "Trade", 40);
  if (trade && !getTrade(trade)) {
    errors.push(`We don't carry a trade called "${trade}".`);
  }

  const label = text("label", "Product name", 120);
  const description = text("description", "Description", 300);
  const brand = text("brand", "Brand", 80, false);
  const line = text("line", "Product line", 120, false);
  const warranty = text("warranty", "Warranty", 400, false);

  const value =
    typeof input.value === "string" && input.value.trim()
      ? slugifyProductValue(input.value)
      : slugifyProductValue(label);
  if (!value) errors.push("The name must contain at least one letter or number.");

  const tier: Tier = isTier(input.tier) ? input.tier : "BETTER";

  const num = (key: string, name: string) => {
    const raw = input[key];
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${name} must be a number.`);
      return NaN;
    }
    return Math.round(value * 100) / 100;
  };
  const costPerUnit = num("costPerUnit", "Cost");
  const basePerUnit = num("basePerUnit", "Base price");

  if (Number.isFinite(costPerUnit) && Number.isFinite(basePerUnit)) {
    if (basePerUnit <= 0) {
      errors.push("Base price has to be more than nothing.");
    } else if (basePerUnit <= costPerUnit) {
      const unit = getTrade(trade)?.unit === "OPENING" ? "each" : "per unit";
      errors.push(
        `Base price ($${basePerUnit} ${unit}) has to be above cost ($${costPerUnit}). ` +
          `Every one of these sold at base would lose $${(costPerUnit - basePerUnit).toFixed(2)}.`,
      );
    }
  }

  const sellingPoints = Array.isArray(input.sellingPoints)
    ? (input.sellingPoints as unknown[])
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      trade,
      value,
      label,
      description,
      brand: brand || null,
      line: line || null,
      tier,
      warranty: warranty || null,
      sellingPoints,
      costPerUnit,
      basePerUnit,
      active: input.active !== false,
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Math.trunc(Number(input.sortOrder)) : 100,
    },
  };
}

function rowToOption(row: ProductConfigInput): TradeOption {
  return {
    value: row.value,
    label: row.label,
    description: row.description,
    brand: row.brand,
    line: row.line,
    tier: row.tier,
    warranty: row.warranty,
    sellingPoints: row.sellingPoints,
    costPerUnit: row.costPerUnit,
    basePerUnit: row.basePerUnit,
  };
}

/** The shipped price book with stored products laid over it. */
export function mergePriceBook(rows: readonly ProductConfigRow[]): Trade[] {
  const edits = new Map<string, ProductConfigInput>();
  for (const row of rows) {
    const tier: Tier = isTier(row.tier) ? row.tier : "BETTER";
    edits.set(`${row.trade}:${row.value}`, { ...row, tier } as ProductConfigInput);
  }

  return TRADES.map((trade) => {
    const options: TradeOption[] = [];

    for (const option of trade.options) {
      const key = `${trade.value}:${option.value}`;
      const edit = edits.get(key);
      if (!edit) {
        options.push(option);
        continue;
      }
      edits.delete(key);
      if (!edit.active) continue;
      options.push(rowToOption(edit));
    }

    const added = [...edits.entries()]
      .filter(([key, edit]) => key.startsWith(`${trade.value}:`) && edit.active)
      .map(([, edit]) => edit)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    for (const [key] of [...edits.entries()].filter(([k]) => k.startsWith(`${trade.value}:`))) {
      edits.delete(key);
    }

    return { ...trade, options: [...options, ...added.map(rowToOption)] };
  });
}

/** A shipped product in editable form, to seed the form the first time. */
export function seededProduct(trade: string, value: string): ProductConfigInput | null {
  const card = getTrade(trade);
  const option = card?.options.find((o) => o.value === value);
  if (!card || !option) return null;
  return {
    trade: card.value,
    value: option.value,
    label: option.label,
    description: option.description,
    brand: option.brand,
    line: option.line,
    tier: option.tier,
    warranty: option.warranty,
    sellingPoints: [...option.sellingPoints],
    costPerUnit: option.costPerUnit,
    basePerUnit: option.basePerUnit,
    active: true,
    sortOrder: 100,
  };
}

export function isSeededProduct(trade: string, value: string): boolean {
  return Boolean(getTrade(trade)?.options.some((o) => o.value === value));
}

/** Margin at base, 0–1. What the rep is building on before any overage. */
export function marginAtBase(option: { costPerUnit: number; basePerUnit: number }): number {
  if (option.basePerUnit <= 0) return 0;
  return (option.basePerUnit - option.costPerUnit) / option.basePerUnit;
}
