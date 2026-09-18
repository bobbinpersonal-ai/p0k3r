import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";
import { noSaleNote } from "@/lib/regions/noSale";

// The formal no-sale confirmation, addressed to the partner who sent us the
// customer. Printable, because a contractor who wants to put this in front of
// their own customer needs something on paper rather than a screenshot.
//
// Scoped to the partner's own token AND checked against the lead's owner: the
// token alone proves who is asking, and the ownership check proves they are
// entitled to this particular one. Either without the other leaks.
//
// Light palette set inline for the same reason as the leave-behind — the site
// is dark and this sheet has to survive a printer.

export const metadata = {
  title: "No-sale confirmation",
  robots: { index: false, follow: false },
};

export default async function NoSaleConfirmationPage({
  params,
}: {
  params: { token: string; leadId: string };
}) {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    select: { id: true, businessName: true },
  });
  if (!partner) notFound();

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    include: { noSaleReport: true },
  });
  // The ownership check. A valid token for partner A must not open partner B's
  // customer, and a lead with no report has nothing to confirm.
  if (!lead || lead.channelPartnerId !== partner.id || !lead.noSaleReport) notFound();

  const report = lead.noSaleReport;
  const note = noSaleNote({
    customerName: lead.customerName,
    address: lead.address,
    partnerName: partner.businessName,
    reason: report.reason,
    detail: report.detail,
    filedBy: report.filedBy,
    quotedAmount: report.quotedAmount,
    customerAcknowledged: report.customerAcknowledged,
    revisitAt: report.revisitAt,
    visitedAt: report.createdAt,
    companyName: COMPANY.name,
  });

  return (
    <>
      <style>{`
        .sheet-root { background: #ffffff; color: #17140f; min-height: 100vh; }
        @media print {
          .no-print { display: none !important; }
          .sheet-root { min-height: auto; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div className="sheet-root">
        <div className="mx-auto max-w-[680px] px-6 py-10">
          <div className="no-print mb-8 flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-6">
            <p className="text-sm text-neutral-600">
              Print or save as PDF from your browser.
            </p>
            <a
              href={`/channel-partners/${params.token}`}
              className="ml-auto text-sm font-semibold text-neutral-900 underline"
            >
              ← Back to your page
            </a>
          </div>

          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-neutral-900 pb-3">
            <p className="text-xl font-extrabold tracking-tight">{COMPANY.name}</p>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Appointment outcome
            </p>
          </header>

          <h1 className="mt-8 text-[30px] font-extrabold leading-tight tracking-tight">
            {note.title}
          </h1>
          <p className="mt-2 text-[15px] font-semibold text-neutral-600">{note.summary}</p>

          <div className="mt-8 space-y-3 text-[15px] leading-relaxed">
            {note.lines.map((line, i) =>
              line === "" ? (
                <div key={`gap-${i}`} aria-hidden="true" className="h-2" />
              ) : (
                <p key={`${i}-${line.slice(0, 24)}`}>{line}</p>
              ),
            )}
          </div>

          <p className="mt-10 border-t border-neutral-300 pt-4 text-xs leading-relaxed text-neutral-500">
            Issued by {COMPANY.legalName} to {partner.businessName} as the referring partner.
            This records the outcome of one appointment and is not a bill, a contract, or a
            quote. Questions about it go to {COMPANY.phone}.
          </p>
        </div>
      </div>
    </>
  );
}
