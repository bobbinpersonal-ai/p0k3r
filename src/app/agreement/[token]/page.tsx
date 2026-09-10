import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isLandscaping } from "@/lib/serviceLines";
import {
  getFrequency,
  getLandscapingServiceLabel,
  getYardSizeLabel,
} from "@/lib/landscaping";
import { getServiceTypeLabel } from "@/lib/serviceTypes";
import { balanceAfter } from "@/lib/deposit";
import { getPaymentMethodLabel, isPaidMethod } from "@/lib/payments";
import {
  agreementTerms,
  AGREEMENT_DISCLAIMER,
  BUSINESS_ADDRESS_MISSING,
  CANCELLATION_PROXIMITY_NOTICE,
  cancellationDeadline,
  formatLegalDate,
  noticeOfCancellation,
  SELLER,
  sellerAddress,
} from "@/lib/agreement";

// The customer's copy of the contract, addressed by the same unguessable
// token as the manage page.
//
// Public on purpose: a buyer who was handed a phone on their own doorstep has
// to be able to read what they agreed to without an account, and has to be
// able to print the cancellation form and post it. Anyone who has the token
// was given it.
//
// Rendered light-on-white against the night-mode site for the same reason the
// price sheet is: this is a document, and half of its job is being paper.

export const metadata = {
  title: "Service agreement",
  robots: { index: false, follow: false },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-300 py-1.5">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </dt>
      <dd className="text-sm font-medium text-black">{children}</dd>
    </div>
  );
}

/**
 * The cancellation form itself. Two are printed: the statute requires the
 * buyer to receive two copies, so there is one to send and one to keep, and
 * printing one would make the document defective in a way nobody would
 * notice until it mattered.
 */
function CancellationForm({
  copy,
  transaction,
  deadline,
}: {
  copy: string;
  transaction: Date;
  deadline: Date;
}) {
  return (
    <div className="mt-4 break-inside-avoid border-2 border-black p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-wide">
          Notice of Cancellation
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">{copy}</span>
      </div>
      <p className="mt-1 text-[11px] text-neutral-600">
        Date of transaction: {formatLegalDate(transaction)}
      </p>
      {noticeOfCancellation(transaction, deadline).map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="mt-2 text-[11px] leading-snug text-black">
          {paragraph}
        </p>
      ))}
      <p className="mt-3 text-[11px] font-bold uppercase">I hereby cancel this transaction.</p>
      <div className="mt-4 flex gap-6">
        <div className="flex-1 border-t border-black pt-1 text-[10px] uppercase text-neutral-500">
          Date
        </div>
        <div className="flex-[2] border-t border-black pt-1 text-[10px] uppercase text-neutral-500">
          Buyer&apos;s signature
        </div>
      </div>
    </div>
  );
}

export default async function AgreementPage({ params }: { params: { token: string } }) {
  const booking = await prisma.booking.findUnique({ where: { manageToken: params.token } });
  if (!booking) notFound();

  const yard = isLandscaping(booking.serviceLine);
  const cadence = booking.frequency ? getFrequency(booking.frequency) : undefined;
  const recurring = cadence?.visitsPerMonth != null;
  const paid = isPaidMethod(booking.depositMethod);
  const deposit = paid ? (booking.depositAmount ?? 0) : 0;
  const balance = balanceAfter(booking.estimateHigh, deposit);

  // The transaction is the day the booking was taken, not the day the crew
  // comes — the cancellation clock starts when they agreed, on their step.
  const transaction = booking.createdAt;
  const deadline = cancellationDeadline(transaction);

  const service = yard
    ? getLandscapingServiceLabel(booking.landscapingService)
    : getServiceTypeLabel(booking.serviceType ?? "");

  return (
    <main className="min-h-screen bg-white text-black print:bg-white">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="print:hidden">
          <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
            Your copy · print or save this
          </p>
        </div>

        <header className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-black pb-2">
          <h1 className="text-xl font-extrabold">Service Agreement</h1>
          <p className="text-[11px] text-neutral-600">
            {SELLER.name} · {SELLER.phone}
            {SELLER.email ? ` · ${SELLER.email}` : ""}
          </p>
        </header>

        <p className="mt-2 text-[11px] text-neutral-600">
          Seller&apos;s address (where a cancellation may be sent):{" "}
          <span className={SELLER.address ? "" : "font-bold text-red-700"}>{sellerAddress()}</span>
        </p>
        {!SELLER.address && (
          <p className="mt-1 text-[11px] font-bold text-red-700 print:hidden">
            {BUSINESS_ADDRESS_MISSING}
          </p>
        )}

        <section className="mt-5 grid gap-x-8 sm:grid-cols-2">
          <dl>
            <Field label="Buyer">{booking.customerName}</Field>
            <Field label="Phone">{booking.customerPhone}</Field>
            <Field label="Property">{booking.pickupAddress}</Field>
            <Field label="Date of transaction">{formatLegalDate(transaction)}</Field>
          </dl>
          <dl>
            <Field label="Service">
              {service}
              {yard && booking.yardSize ? ` · ${getYardSizeLabel(booking.yardSize)} yard` : ""}
            </Field>
            <Field label="How often">{cadence ? cadence.label : "One visit"}</Field>
            <Field label="Scheduled">
              {formatLegalDate(booking.moveDate)} · {booking.timeWindow}
            </Field>
            <Field label="Agreement reference">{booking.id}</Field>
          </dl>
        </section>

        <section className="mt-5 border-2 border-black p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">The price</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>
                {service}
                {recurring ? ` — per visit, ${cadence?.cadence}` : ""}
              </dt>
              <dd className="font-mono font-bold">${booking.estimateHigh}</dd>
            </div>
            {paid && (
              <div className="flex justify-between">
                <dt>Deposit received ({getPaymentMethodLabel(booking.depositMethod)})</dt>
                <dd className="font-mono font-bold">−${deposit}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-black pt-1">
              <dt className="font-bold">
                {recurring ? "Due at the end of this visit" : "Due when the work is done"}
              </dt>
              <dd className="font-mono font-extrabold">${balance}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-5 space-y-3">
          {agreementTerms().map((term) => (
            <div key={term.heading} className="break-inside-avoid">
              <h2 className="text-xs font-extrabold uppercase tracking-wide">{term.heading}</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-800">{term.body}</p>
            </div>
          ))}
        </section>

        {/* Required to sit next to the signature, in bold at 10pt or larger —
            not folded into the terms above, where it is legally present and
            practically invisible. */}
        <section className="mt-5 break-inside-avoid border-2 border-black bg-neutral-100 p-4">
          <p className="text-[13px] font-bold leading-snug text-black">
            {CANCELLATION_PROXIMITY_NOTICE}
          </p>
        </section>

        <section className="mt-5 grid gap-6 break-inside-avoid sm:grid-cols-2">
          <div>
            <div className="h-10 border-b border-black" />
            <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
              Buyer — {booking.customerName}
            </p>
          </div>
          <div>
            <div className="h-10 border-b border-black" />
            <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">
              For {SELLER.name}
            </p>
          </div>
        </section>

        <p className="mt-5 border-t border-neutral-300 pt-3 text-[9px] leading-snug text-neutral-600">
          <span className="font-bold">Disclaimer:</span> {AGREEMENT_DISCLAIMER}
        </p>

        <section className="mt-6 print:break-before-page">
          <p className="text-[11px] text-neutral-600">
            Two copies of the cancellation notice follow — one to send, one to keep. You may
            cancel up to midnight on {formatLegalDate(deadline)}.
          </p>
          <CancellationForm
            copy="Copy 1 — send this one"
            transaction={transaction}
            deadline={deadline}
          />
          <CancellationForm
            copy="Copy 2 — keep this one"
            transaction={transaction}
            deadline={deadline}
          />
        </section>
      </div>
    </main>
  );
}
