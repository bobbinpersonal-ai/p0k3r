// Server-side access to the merged catalogue.
//
// Split from serviceCatalogue.ts so that module stays importable from client
// components: the merge and the validation are pure, this touches Prisma.
//
// Every surface that shows a price or accepts a booking has to go through
// here. A page that imports the built-in catalogue directly will quietly keep
// showing yesterday's prices after an edit, which is the sort of bug nobody
// finds until a customer is holding the old number.

import { prisma } from "@/lib/prisma";
import { BUILT_IN_CATALOGUE, type ServiceCatalogue } from "@/lib/landscaping";
import { BUILT_IN_MAJOR_TRADES, type MajorTradeProject } from "@/lib/majorTrades";
import {
  builtInAsConfig,
  builtInTradeAsConfig,
  mergeCatalogue,
  mergeReferrals,
  type ServiceConfigInput,
  type ServiceConfigRow,
} from "@/lib/serviceCatalogue";

async function storedRows(): Promise<ServiceConfigRow[]> {
  return (await prisma.serviceConfig.findMany({
    orderBy: { sortOrder: "asc" },
  })) as unknown as ServiceConfigRow[];
}

export async function loadCatalogue(): Promise<ServiceCatalogue> {
  try {
    return mergeCatalogue(await storedRows());
  } catch {
    // A database that isn't reachable is a bad afternoon, not a blank price
    // list: fall back to what the code ships with rather than rendering a
    // homepage with no services on it.
    return BUILT_IN_CATALOGUE;
  }
}

/**
 * The trades we pass on, with any stored edits applied.
 *
 * Same fallback as the catalogue: an unreachable database shows the shipped
 * list rather than a page that offers to match you with nobody.
 */
export async function loadReferrals(): Promise<MajorTradeProject[]> {
  try {
    return mergeReferrals(await storedRows());
  } catch {
    return [...BUILT_IN_MAJOR_TRADES];
  }
}

/** Both, in one query, for pages that show priced and subbed-out work together. */
export async function loadEverything(): Promise<{
  catalogue: ServiceCatalogue;
  referrals: MajorTradeProject[];
}> {
  try {
    const rows = await storedRows();
    return { catalogue: mergeCatalogue(rows), referrals: mergeReferrals(rows) };
  } catch {
    return { catalogue: BUILT_IN_CATALOGUE, referrals: [...BUILT_IN_MAJOR_TRADES] };
  }
}

export type EditableService = ServiceConfigInput & { edited: boolean; builtIn: boolean };

/**
 * Every service the owner can edit: what we sell and what we pass on, in one
 * list, shipped ones first in the order they ship.
 *
 * One list on purpose — to the person adding painting, "do we do this or do
 * we hand it on?" is a property of the service, not a reason to go to a
 * different screen.
 */
export async function loadEditableServices(): Promise<EditableService[]> {
  const rows = await storedRows();
  const stored = new Map(rows.map((row) => [row.value, row]));
  const services: EditableService[] = [];

  const take = (value: string, fallback: () => ServiceConfigInput | null) => {
    const row = stored.get(value);
    stored.delete(value);
    const config = row ? (row as unknown as ServiceConfigInput) : fallback();
    if (config) services.push({ ...config, edited: Boolean(row), builtIn: true });
  };

  for (const card of BUILT_IN_CATALOGUE.services) take(card.value, () => builtInAsConfig(card.value));
  for (const trade of BUILT_IN_MAJOR_TRADES) take(trade.value, () => builtInTradeAsConfig(trade.value));

  for (const row of stored.values()) {
    services.push({ ...(row as unknown as ServiceConfigInput), edited: true, builtIn: false });
  }
  return services;
}
