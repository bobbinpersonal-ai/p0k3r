import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";
import { OFFER_EXPIRED_MESSAGE, OFFER_TAKEN_MESSAGE } from "@/lib/integrations/dispatch";
import OfferActions from "./OfferActions";

// What a crew sees when they tap the dispatch text.
//
// No login. The token in the URL is the credential — an unguessable uuid
// that only ever existed in one SMS to one crew. Requiring a password here
// means a roofer on a roof cannot take work, which defeats the point of
// sending it to five crews and letting the fastest win.
//
// Deliberately one screen and two buttons. Everything a crew needs to decide
// is the money, the place and the trade; anything else is asked after they
// have said yes.

export const metadata = { title: "Job offer", robots: { index: false, follow: false } };

export default async function OfferPage({ params }: { params: { token: string } }) {
  const offer = await prisma.dispatchOffer.findUnique({
    where: { token: params.token },
    select: {
      token: true,
      status: true,
      workAmount: true,
      expiresAt: true,
      worker: { select: { name: true } },
      estimate: {
        select: {
          lead: { select: { city: true, state: true, trade: true, address: true } },
        },
      },
    },
  });
  if (!offer) notFound();

  const lead = offer.estimate.lead;
  const where = [lead.city, lead.state].filter(Boolean).join(", ") || "your area";
  const expired = offer.expiresAt < new Date();
  const open = offer.status === "OFFERED" && !expired;

  const closedMessage =
    offer.status === "ACCEPTED"
      ? "You took this job. We will be in touch with the details."
      : expired
        ? OFFER_EXPIRED_MESSAGE
        : OFFER_TAKEN_MESSAGE;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        {COMPANY.name} · job offer
      </p>

      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink">
        {lead.trade ? `${lead.trade.replace(/_/g, " ").toLowerCase()} job` : "New job"} in {where}
      </h1>

      {/* The money first. It is the whole decision. */}
      <div className="mt-6 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/[0.08] p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
          Pays you
        </p>
        <p className="mt-1 text-5xl font-extrabold tracking-tight text-ink">
          ${offer.workAmount.toLocaleString("en-US")}
        </p>
        <p className="mt-2 text-sm text-neutral-300">
          Paid in full when the job is signed off. No retainage.
        </p>
      </div>

      <dl className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-400">Where</dt>
          <dd className="text-right font-semibold text-ink">{where}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-400">Offered to</dt>
          <dd className="text-right font-semibold text-ink">{offer.worker.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-400">Expires</dt>
          <dd className="text-right font-semibold text-ink">
            {offer.expiresAt.toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </dd>
        </div>
      </dl>

      {open ? (
        <>
          <OfferActions token={offer.token} />
          <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">
            We send this to a few crews at once so the homeowner is not left waiting. First to
            accept gets it. The full address comes through once it is yours.
          </p>
        </>
      ) : (
        <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm leading-relaxed text-neutral-300">
          {closedMessage}
        </p>
      )}
    </main>
  );
}
