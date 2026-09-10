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
import { mergeCatalogue, type ServiceConfigRow } from "@/lib/serviceCatalogue";

export async function loadCatalogue(): Promise<ServiceCatalogue> {
  try {
    const rows = await prisma.serviceConfig.findMany({ orderBy: { sortOrder: "asc" } });
    return mergeCatalogue(rows as unknown as ServiceConfigRow[]);
  } catch {
    // A database that isn't reachable is a bad afternoon, not a blank price
    // list: fall back to what the code ships with rather than rendering a
    // homepage with no services on it.
    return BUILT_IN_CATALOGUE;
  }
}
