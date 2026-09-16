// Server-side access to the merged price book.
//
// Split from productCatalogue.ts so that module stays importable from client
// components: the merge and the validation are pure, this touches Prisma.
//
// Every surface that shows a product or prices a job goes through here. One
// that imports TRADES directly will quietly keep quoting the rates this repo
// shipped with, which is the sort of bug nobody finds until a rep has already
// signed a customer at last quarter's number.

import { prisma } from "@/lib/prisma";
import { TRADES, type Trade } from "@/lib/regions/trades";
import {
  mergePriceBook,
  seededProduct,
  type ProductConfigInput,
  type ProductConfigRow,
} from "@/lib/regions/productCatalogue";

async function storedRows(): Promise<ProductConfigRow[]> {
  return (await prisma.productConfig.findMany({
    orderBy: { sortOrder: "asc" },
  })) as unknown as ProductConfigRow[];
}

export async function loadPriceBook(): Promise<Trade[]> {
  try {
    return mergePriceBook(await storedRows());
  } catch {
    // An unreachable database is a bad afternoon, not an empty catalogue.
    return [...TRADES];
  }
}

export type EditableProduct = ProductConfigInput & { edited: boolean; seeded: boolean };

/**
 * Every product the owner can edit, shipped ones first in the order they ship.
 *
 * A product with no stored row shows the rates this repo guessed at, which are
 * placeholders — `edited: false` is what the page uses to say so out loud.
 */
export async function loadEditableProducts(): Promise<EditableProduct[]> {
  const rows = await storedRows();
  const stored = new Map(rows.map((row) => [`${row.trade}:${row.value}`, row]));
  const products: EditableProduct[] = [];

  for (const trade of TRADES) {
    for (const option of trade.options) {
      const key = `${trade.value}:${option.value}`;
      const row = stored.get(key);
      stored.delete(key);
      const config = row
        ? (row as unknown as ProductConfigInput)
        : seededProduct(trade.value, option.value);
      if (config) products.push({ ...config, edited: Boolean(row), seeded: true });
    }
  }

  for (const row of stored.values()) {
    products.push({ ...(row as unknown as ProductConfigInput), edited: true, seeded: false });
  }

  return products;
}
