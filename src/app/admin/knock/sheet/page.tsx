import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { LICENSING_DISCLAIMER, LICENSING_DISCLAIMER_SHORT, SITE_NAME } from "@/lib/compliance";
import {
  bookableServices,
  frequenciesFor,
  quoteLandscaping,
  startingPriceFor,
  YARD_SIZES,
} from "@/lib/landscaping";
import { MAJOR_TRADE_PROJECTS } from "@/lib/majorTrades";
import QrCode from "@/components/QrCode";

// Two pages of paper: the grid we quote off, and the cards we leave behind.
//
// Printed rather than memorised because the prices move. A laminated sheet
// from three price changes ago is worse than no sheet — it quotes a number we
// have to walk back — so this renders from the same pricing module the website
// and the API use, and reprinting is the whole update process.
//
// Everything here is deliberately light-on-white despite the site being dark:
// the point of the page is the version that comes out of a printer.

export const metadata = {
  title: "Door knock price sheet",
  robots: { index: false, follow: false },
};

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://lovemeafter.com";
/** The same thing without the scheme — what goes on a card someone reads. */
const SITE_URL = SITE_ORIGIN.replace(/^https?:\/\//, "");

/** One leave-behind, four to a page. Kept as a component so the cut sheet is a map. */
function LeaveBehind({ services }: { services: ReturnType<typeof bookableServices> }) {
  return (
    <div className="flex break-inside-avoid gap-3 border border-dashed border-neutral-400 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          {SITE_NAME}
        </p>
        <p className="mt-1 text-[15px] font-extrabold leading-tight text-black">
          Your yard, handled — flat price, no walkthrough
        </p>
        <ul className="mt-2 space-y-0.5">
          {services.map((service) => (
            <li key={service.value} className="flex justify-between gap-2 text-[11px] text-neutral-700">
              <span>{service.shortLabel}</span>
              <span className="whitespace-nowrap font-bold text-black">
                from ${startingPriceFor(service.value)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] font-bold text-black">
          {SUPPORT_PHONE} · {SITE_URL}/yard
        </p>
        <p className="mt-2 text-[8px] leading-snug text-neutral-500">
          {LICENSING_DISCLAIMER_SHORT}
        </p>
      </div>
      <QrCode
        value={`${SITE_ORIGIN}/yard?source=door-knock`}
        label={`QR code to ${SITE_URL}/yard`}
        className="h-24 w-24 shrink-0 self-start"
      />
    </div>
  );
}

export default function PriceSheetPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const services = bookableServices();

  return (
    <main className="bg-white text-black print:bg-white">
      {/* Screen-only chrome. The printed sheet has no navigation on it. */}
      <div className="mx-auto max-w-4xl px-4 pt-6 print:hidden">
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          Internal · print at 100%, portrait
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">Door knock kit</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Page one is the sheet you quote from. Page two is four leave-behind cards — cut on
          the dashed lines. Reprint whenever prices change; these read live from the pricing
          module.
        </p>
      </div>

      <section className="mx-auto max-w-4xl px-4 py-6">
        <header className="flex items-baseline justify-between border-b-2 border-black pb-2">
          <h2 className="text-xl font-extrabold">{SITE_NAME} · one-time prices</h2>
          <p className="text-xs font-bold">{SUPPORT_PHONE}</p>
        </header>

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-neutral-300 bg-neutral-100 p-2 text-left">Service</th>
              {YARD_SIZES.map((size) => (
                <th key={size.value} className="border border-neutral-300 bg-neutral-100 p-2 text-left">
                  {size.label}
                  <span className="block text-[10px] font-normal text-neutral-500">
                    {size.areaHint}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.value}>
                <td className="border border-neutral-300 p-2">
                  <span className="font-bold">{service.label}</span>
                  <span className="block text-[10px] text-neutral-500">
                    {service.materialsNote ?? service.description}
                  </span>
                </td>
                {YARD_SIZES.map((size) => (
                  <td key={size.value} className="border border-neutral-300 p-2 font-bold">
                    ${quoteLandscaping(service.value, size.value, "ONE_TIME")?.perVisit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {services
          .filter((service) => service.allowsRecurring)
          .map((service) => (
            <div key={service.value} className="mt-5 break-inside-avoid">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                {service.label} — on a schedule (per visit)
              </h3>
              <table className="mt-2 w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-neutral-300 bg-neutral-100 p-2 text-left">
                      How often
                    </th>
                    {YARD_SIZES.map((size) => (
                      <th
                        key={size.value}
                        className="border border-neutral-300 bg-neutral-100 p-2 text-left"
                      >
                        {size.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frequenciesFor(service.value)
                    .filter((cadence) => cadence.value !== "ONE_TIME")
                    .map((cadence) => (
                      <tr key={cadence.value}>
                        <td className="border border-neutral-300 p-2 font-bold">
                          {cadence.label}
                        </td>
                        {YARD_SIZES.map((size) => (
                          <td key={size.value} className="border border-neutral-300 p-2">
                            ${quoteLandscaping(service.value, size.value, cadence.value)?.perVisit}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}

        <div className="mt-5 grid gap-4 break-inside-avoid sm:grid-cols-3">
          {services.map((service) => (
            <div key={service.value}>
              <h3 className="text-xs font-extrabold uppercase tracking-wide">{service.label}</h3>
              <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-700">
                {service.includes.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 break-inside-avoid border-l-4 border-black pl-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide">
            Don&apos;t quote these — take the details and we match them
          </h3>
          <p className="mt-1 text-[11px] text-neutral-700">
            {MAJOR_TRADE_PROJECTS.filter((project) => project.value !== "OTHER")
              .map((project) => project.label)
              .join(" · ")}
            . Two or three licensed, bonded and insured CSLB contractors come back to them
            directly. We never price it and never take money for it.
          </p>
        </div>

        <p className="mt-5 border-t border-neutral-300 pt-3 text-[9px] leading-snug text-neutral-600">
          <span className="font-bold">Disclaimer:</span> {LICENSING_DISCLAIMER}
        </p>
      </section>

      {/* Page two. */}
      <section className="mx-auto max-w-4xl px-4 py-6 print:break-before-page">
        <p className="mb-3 text-xs font-mono uppercase tracking-widest text-neutral-500 print:hidden">
          Leave-behinds · cut on the dashed lines
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <LeaveBehind key={i} services={services} />
          ))}
        </div>
      </section>
    </main>
  );
}
