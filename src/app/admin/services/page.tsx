import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { loadEditableServices } from "@/lib/loadCatalogue";
import ServicesEditor from "./ServicesEditor";

export const metadata = {
  title: "Services & prices",
  robots: { index: false, follow: false },
};

export default async function ServicesPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const services = await loadEditableServices();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · catalogue
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Services &amp; prices</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-300">
        Everything this business offers, in one list. Work you <em>do</em> carries a flat
        price and shows up on the homepage, the booking flow, the door form and the printed
        sheet. Work you <em>sub out</em> carries no price and shows up on the
        licensed-contractor page instead. Saving is publishing — there is no draft.
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
