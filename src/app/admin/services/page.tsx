import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUILT_IN_CATALOGUE } from "@/lib/landscaping";
import { builtInAsConfig, type ServiceConfigInput, type ServiceConfigRow } from "@/lib/serviceCatalogue";
import ServicesEditor from "./ServicesEditor";

export const metadata = {
  title: "Services & prices",
  robots: { index: false, follow: false },
};

export default async function ServicesPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  // Shipped services first, in the order the code lists them, then anything
  // added here — the same order the customer sees, so the page reads like the
  // site rather than like the table behind it.
  const rows = (await prisma.serviceConfig.findMany({
    orderBy: { sortOrder: "asc" },
  })) as unknown as ServiceConfigRow[];
  const stored = new Map(rows.map((row) => [row.value, row]));
  const services: (ServiceConfigInput & { edited: boolean; builtIn: boolean })[] = [];

  for (const card of BUILT_IN_CATALOGUE.services) {
    const row = stored.get(card.value);
    stored.delete(card.value);
    const config = row ? (row as unknown as ServiceConfigInput) : builtInAsConfig(card.value);
    if (config) services.push({ ...config, edited: Boolean(row), builtIn: true });
  }
  for (const row of stored.values()) {
    services.push({ ...(row as unknown as ServiceConfigInput), edited: true, builtIn: false });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · catalogue
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Services &amp; prices</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-300">
        What this changes: the homepage, the city pages, the booking flow, the door form and the
        printed price sheet, all at once. Saving is publishing — there is no draft.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
        <Link href="/admin/knock" className="text-brand-cyan underline">
          Door knock
        </Link>
        <Link href="/admin/knock/sheet" className="text-neutral-300 underline">
          Reprint the sheet
        </Link>
        <Link href="/admin/dashboard" className="text-neutral-300 underline">
          Dispatch board
        </Link>
      </div>
      <ServicesEditor initial={services} />
    </main>
  );
}
