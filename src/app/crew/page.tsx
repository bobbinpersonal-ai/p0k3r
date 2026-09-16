import type { Metadata } from "next";
import Link from "next/link";
import TxHeader from "@/components/tx/TxHeader";
import TxFooter from "@/components/tx/TxFooter";
import CrewForm from "./CrewForm";
import { COMPANY, MARKETS } from "@/lib/texas/brand";
import { CREW_PAID_DAYS, NEC_THRESHOLD } from "@/lib/texas/crewAgreement";
import { TRADES } from "@/lib/texas/trades";

// The other half of recruiting. /sell finds the people who sell the work;
// this finds the people who build it.
//
// A crew reads a page like this looking for one thing, and it is not the
// company's mission statement. It is whether they get paid, and when, and
// whether they will have to chase it — because getting stiffed or strung out
// for sixty days by a general contractor is the defining experience of this
// trade. So the payment terms are the headline and everything else is below
// them.
//
// The numbers come from the subcontractor agreement rather than from the copy,
// so a promise on this page cannot drift away from the contract that honours it.

export const metadata: Metadata = {
  title: `Roofing & Exterior Crews Wanted — Paid in ${CREW_PAID_DAYS} Days | ${COMPANY.name}`,
  description:
    "Subcontract crews for roofing, siding, windows, gutters, garage doors, fence and paint " +
    "across Texas. Paid within days of sign-off, no retainage, material and permit supplied.",
  robots: { index: true, follow: true },
};

const PROMISES = [
  {
    title: `Paid in ${CREW_PAID_DAYS} days`,
    body:
      "Work complete, walked and signed off, waiver signed — money sent. Zelle or Apple Cash, " +
      "same week, not next month.",
  },
  {
    title: "No retainage",
    body:
      "We do not hold back 10% until some future date. The price on the work order is the " +
      "price, paid in full.",
  },
  {
    title: "Material and permit on us",
    body:
      "Delivered to the property before you mobilise, and the permit pulled where the city " +
      "needs one. You bring labour and tools.",
  },
  {
    title: "The scope in writing first",
    body:
      "Property, scope, material, dates and price on a work order before you commit. No job " +
      "starts on a phone call and grows afterwards.",
  },
];

const HONEST = [
  {
    q: "What we need from you",
    a:
      "A certificate of general liability naming us as additional insured, and a W-9. Those " +
      "two are not negotiable — the certificate is what stands between a ladder through a " +
      `window and a bill you cannot pay, and without a W-9 we cannot file the 1099-NEC the ` +
      `IRS requires for anyone paid $${NEC_THRESHOLD} or more in a year.`,
  },
  {
    q: "Workers' compensation",
    a:
      "Texas does not require it and we do not require it either — but we will ask, and if " +
      "you do not carry it we will put that in writing in the agreement, because it means " +
      "nobody on your crew has anywhere to turn if they get hurt. That is your call to make " +
      "knowingly, not one to discover afterwards.",
  },
  {
    q: "A lien waiver with every payment",
    a:
      "Conditional when we issue the money, unconditional once it clears. It is how the " +
      "homeowner knows they will not be paying twice, and it is standard — any crew that has " +
      "worked for a real contractor has signed hundreds of them.",
  },
  {
    q: "You run your own crew",
    a:
      "Your people, your hours inside the agreed dates, your call on how the work gets done. " +
      "You are free to work for anyone else at the same time, including our competitors. We " +
      "are buying a finished roof, not your week.",
  },
];

export default function CrewPage() {
  return (
    <>
      <TxHeader ctaHref="#apply" />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,420px)] lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Crews wanted · {MARKETS.map((m) => m.name).join(" · ")}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                You finish the roof. We pay you that week.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                Subcontract crews for roofing, siding, windows, gutters, garage doors, fence and
                exterior paint across Texas. Material delivered, permit pulled, scope in writing
                before you mobilise — and no waiting sixty days for money you already earned.
              </p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {PROMISES.map((p) => (
                  <div key={p.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-sm font-bold text-ink">{p.title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-neutral-300">{p.body}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0">
              <CrewForm />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Work we put out</h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              We sell it, you build it. If you only do one of these, that is fine — say so and
              we will only call you about that.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRADES.map((trade) => (
                <div key={trade.value} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-bold text-ink">{trade.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{trade.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              What we&apos;ll ask you for
            </h2>
            <p className="mt-2 text-neutral-300">
              Better to read it here than find out on the morning of a job.
            </p>
            <div className="mt-8 space-y-5">
              {HONEST.map((item) => (
                <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-bold text-ink">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              Bring your crew. We&apos;ll keep them busy.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-200">
              Two minutes to apply, and a phone call the same day.
            </p>
            <p className="mt-6">
              <a
                href="#apply"
                className="inline-block rounded-xl bg-brand px-6 py-4 text-base font-bold text-white"
              >
                Apply to install
              </a>
            </p>
            <p className="mt-6 text-sm text-neutral-400">
              Sell instead of build?{" "}
              <Link href="/sell" className="text-brand-cyan underline">
                We&apos;re hiring closers too
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <TxFooter />
    </>
  );
}
