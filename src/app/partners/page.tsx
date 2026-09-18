import type { Metadata } from "next";
import Link from "next/link";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import PartnerForm from "./PartnerForm";
import { COMPANY } from "@/lib/regions/brand";
import { CHANNEL_PARTNER_PROFIT_SHARE } from "@/lib/regions/channelPartners";
import { CREW_PAID_DAYS, NEC_THRESHOLD } from "@/lib/regions/crewAgreement";
import { CONTRACTOR_OVERAGE_RATE } from "@/lib/regions/commission";
import { REGIONS } from "@/lib/regions/states";
import { TRADES } from "@/lib/regions/trades";

// Crew partner onboarding.
//
// We hold the contract with the homeowner and collect every dollar — we are
// the general contractor on the job. The contractor measures it, sells it at
// the kitchen table on our estimate, and builds it. They are paid for the
// work and keep a share of everything they sell above our price book floor.
//
// THIS PAGE DESCRIBED A DIFFERENT JOB UNTIL NOW. It promised "a set labor
// rate, paid on schedule" and "no selling required", which stopped being true
// the day contractors started measuring and closing. Recruiting somebody onto
// a promise the first job contradicts is how you lose them in week two, so
// every number here is read from the agreement and the comp module rather
// than written down a second time: see crewAgreement.ts and commission.ts.
//
// A crew reads this asking two questions, in order: what does it pay, and
// when do I actually get the money. Answer both above the fold or lose them —
// being strung out sixty days by a general contractor is the defining
// experience of this trade, and three days is the strongest thing we have.

const OVERAGE_PCT = Math.round(CONTRACTOR_OVERAGE_RATE * 100);

export const metadata: Metadata = {
  title: `Crew Partners — Booked Appointments, Paid in ${CREW_PAID_DAYS} Days | ${COMPANY.name}`,
  description:
    `We generate the homeowners and book the inspections. You measure, sell and build the job, ` +
    `and keep ${OVERAGE_PCT}% of everything you sell above our price. Paid in full within ` +
    `${CREW_PAID_DAYS} days, no retainage. Roofing, siding, fencing, gutters and painting ` +
    `across Colorado, Missouri, Kansas, Indiana and Wyoming.`,
  robots: { index: true, follow: true },
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "We generate the homeowner",
    body:
      "Our marketing, our money, our phone calls. You do not pay for a lead, you do not bid " +
      "against four other contractors, and you are not buying anyone's shared list.",
  },
  {
    step: "02",
    title: "We book the inspection",
    body:
      "Confirmed date and time, address, what they want looked at, and everyone who has to " +
      "agree to spend the money in the room. It lands in your calendar.",
  },
  {
    step: "03",
    title: "You measure it and price it",
    body:
      "On your phone, off our price book. It shows you the floor you cannot sell below and " +
      "what you make at every price above it, while you are still standing on the roof.",
  },
  {
    step: "04",
    title: "You sell it at the table",
    body:
      `Our estimate, our contract, our payment link. Sell above the floor and you keep ` +
      `${OVERAGE_PCT}% of the difference on top of the price for the work. There is no cap on it.`,
  },
  {
    step: "05",
    title: "You build it and get paid",
    body:
      `Paid in full with no retainage, within ${CREW_PAID_DAYS} days of the work being signed ` +
      `off and your lien waiver in. You never chase a homeowner for a check, because they ` +
      `never pay you — they pay us.`,
  },
];

const WHAT_WE_ASK = [
  {
    q: "A current general liability certificate",
    a:
      "The one thing we cannot move on. We tell homeowners the contractor turning up has been " +
      "checked, and that claim is worth exactly what we actually checked.",
  },
  {
    q: "Whatever your state and county require",
    a:
      "This varies more than people expect. Kansas roofers must be registered with the " +
      "Attorney General. Most Colorado Front Range cities license locally. Indiana regulates " +
      "what your contract has to say. We check the one that applies to you and we re-check it.",
  },
  {
    q: "Your baseline rate sheet",
    a:
      "Per square, per linear foot, per opening — however you price your labor. This is what " +
      "we pay you for the work, and it sets the floor in the price book you sell off, so you " +
      "are never standing in a driveway working out whether a job covers your own cost.",
  },
  {
    // On the page rather than saved for the agreement. It is a condition that
    // ends the arrangement if broken, and a contractor who finds that out
    // after signing is a contractor who feels caught rather than told.
    q: "Every dollar goes through our payment system",
    a:
      "Deposit, progress and final. You do not take cash, a check, a card or a transfer from " +
      "a homeowner, and you do not ask for anything on the side. We hold the contract, carry " +
      "the warranty and answer the phone in two years, and money collected outside that leaves " +
      "a customer paying for work nobody is answerable for. It is also what you are paid out " +
      "of. Taking payment directly ends the agreement.",
  },
  {
    q: "A W-9",
    a:
      `Standard. Anything we pay out above $${NEC_THRESHOLD} in a year needs a 1099-NEC and it ` +
      "cannot be filed without one.",
  },
  {
    q: "Two customers we can call",
    a: "We ring them. It takes ten minutes and it is most of the vetting.",
  },
];

export default function PartnersPage() {
  return (
    <>
      <NetworkHeader ctaHref="#apply" />
      <main>
        {/* The wrong-page catcher.
            
            /partner (singular) is the channel partner offer and /partners is
            this page, so anybody who hears the short link on a call and
            guesses the plural lands here — on a completely different pitch,
            for people who do the work rather than people who share a list.
            Without this they read two paragraphs about labour rates and
            leave. It sits above the hero because by the time they have
            scrolled, they have already decided we wasted their time. */}
        <div className="border-b border-brand-cyan/20 bg-brand-cyan/[0.07]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-neutral-200">
              <strong className="text-ink">Looking for the $2,000-a-job offer?</strong> That one
              pays you {Math.round(CHANNEL_PARTNER_PROFIT_SHARE * 100)}% of the profit for sharing
              your old customers. You do none of the work.
            </p>
            <Link
              href="/channel-partners"
              className="shrink-0 rounded-lg border border-brand-cyan bg-brand-cyan/15 px-4 py-1.5 text-sm font-bold text-brand-cyan hover:bg-brand-cyan/25"
            >
              Take me there →
            </Link>
          </div>
        </div>

        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Partner network · {REGIONS.map((r) => r.code).join(" · ")}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                We book it. You close it. You keep {OVERAGE_PCT}% of the upside.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                We run the marketing, take the calls and book the inspection. You measure the
                job, price it off our book on your phone, and close it at the table. You get paid
                for the work — plus {OVERAGE_PCT}% of everything you sell above our price — in
                full, within {CREW_PAID_DAYS} days.
              </p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  [
                    `${OVERAGE_PCT}% of everything above our price`,
                    "No cap. Sell it better and you make more on the same roof.",
                  ],
                  [
                    `Paid in ${CREW_PAID_DAYS} days`,
                    "In full, no retainage. The homeowner pays us, so you never chase a check.",
                  ],
                  ["No pay-per-lead", "You are not buying anything up front. Ever."],
                  ["Booked, not bought", "A confirmed time with the decision-makers there."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <dt className="text-sm font-bold text-ink">{title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-neutral-300">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0">
              <PartnerForm />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step}>
                  <p className="font-mono text-2xl font-bold text-brand-cyan">{s.step}</p>
                  <h3 className="mt-2 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Trades we route</h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              Take one or take all of them. Tell us which and we only send you that.
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

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Where we send work</h2>
            <p className="mt-2 max-w-3xl text-neutral-300">
              Five states, and a lot of it outside any city limit. Tell us your base ZIP and how
              far you&apos;ll drive and we route on that rather than on town names.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {REGIONS.map((region) => (
                <div key={region.code} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                    {region.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                    {region.markets.map((m) => m.name).join(" · ")}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-neutral-400">
                    {region.licensing.roofingRegistration
                      ? "State roofing registration required."
                      : region.licensing.localLicensingCommon
                        ? "Local licensing is the norm."
                        : "Light on licensing."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">What we ask for</h2>
            <p className="mt-2 text-neutral-300">
              Better to read it here than find out on the morning of a job.
            </p>
            <div className="mt-8 space-y-5">
              {WHAT_WE_ASK.map((item) => (
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
              Keep your crews busy without buying leads.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-200">
              Two minutes to apply, and a phone call the same day.
            </p>
            <p className="mt-6">
              <a href="#apply" className="inline-block rounded-xl bg-brand px-6 py-4 text-base font-bold text-white">
                Apply to the network
              </a>
            </p>
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
