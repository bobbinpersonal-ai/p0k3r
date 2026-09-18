import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPANY, PHONE_DIGITS } from "@/lib/regions/brand";
import { LIVE_SERVICES, parseServices } from "@/lib/regions/channelPartners";

// A one-page leave-behind, co-branded, printed from the browser.
//
// Deliberately outside the site's dark theme: this is ink on paper, and a page
// that prints a dark background either wastes a cartridge or comes out as
// white text on white. So it sets its own light palette inline and uses a
// print stylesheet rather than inheriting the network chrome.

export const metadata = {
  title: "Leave-behind",
  robots: { index: false, follow: false },
};

export default async function LeaveBehindPage({
  params,
}: {
  params: { token: string };
}) {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    select: { businessName: true, services: true },
  });
  if (!partner) notFound();

  const picked = parseServices(partner.services).filter((s) => s.status === "LIVE");
  const services = picked.length > 0 ? picked : LIVE_SERVICES;

  return (
    <>
      {/* Scoped to this page and its children. The site's tokens are dark and
          this sheet has to survive a printer. */}
      <style>{`
        .sheet-root { background: #ffffff; color: #17140f; min-height: 100vh; }
        @media print {
          .no-print { display: none !important; }
          .sheet-root { min-height: auto; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="sheet-root">
        <div className="mx-auto max-w-[760px] px-6 py-10">
          <div className="no-print mb-8 flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-6">
            <p className="text-sm text-neutral-600">
              Print this page, or save it as a PDF from your browser&apos;s print dialog.
            </p>
            <a
              href={`/channel-partners/${params.token}/marketing`}
              className="ml-auto text-sm font-semibold text-neutral-900 underline"
            >
              ← Back to the kit
            </a>
          </div>

          <header className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-neutral-900 pb-4">
            <p className="text-2xl font-extrabold tracking-tight">{partner.businessName}</p>
            <p className="text-sm font-semibold text-neutral-600">
              working with {COMPANY.name}
            </p>
          </header>

          <h1 className="mt-8 text-[38px] font-extrabold leading-[1.1] tracking-tight">
            We&apos;ve got the rest of the house covered.
          </h1>

          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-neutral-700">
            You already trust us with your {/* their own trade, unnamed on purpose */}work.
            We&apos;ve partnered with {COMPANY.name} so the other jobs around the house get done
            to the same standard — by a crew that&apos;s been checked, insured and stands behind
            what they build.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
            {services.map((s) => (
              <li key={s.value} className="flex gap-2 text-[15px] font-semibold">
                <span aria-hidden="true" className="text-neutral-400">
                  —
                </span>
                {s.label}
              </li>
            ))}
          </ul>

          <div className="mt-10 border-y border-neutral-300 py-6">
            <p className="text-[19px] font-bold">
              A free look at the property. A written price. No obligation.
            </p>
            <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-neutral-700">
              They&apos;ll walk the outside, photograph anything they find, and give you a real
              number in writing — whether you go ahead or not. Nothing is charged to you at any
              point for the visit.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                Call them directly
              </p>
              <p className="mt-1 font-mono text-[26px] font-bold tracking-tight">
                {COMPANY.phone}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                or {COMPANY.email} · tell them {partner.businessName} sent you
              </p>
            </div>
            <p className="max-w-[24ch] text-right text-xs leading-relaxed text-neutral-500">
              Work performed and warranted by {COMPANY.legalName}. Licensed trades — electrical,
              plumbing and HVAC — are handled by licensed specialists.
            </p>
          </div>

          <p className="no-print mt-10 text-xs text-neutral-500">
            Tip: your browser&apos;s print dialog has a &ldquo;Save as PDF&rdquo; option if you
            want to email it instead. Phone number dials as{" "}
            <a href={`tel:${PHONE_DIGITS}`} className="underline">
              {COMPANY.phone}
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
