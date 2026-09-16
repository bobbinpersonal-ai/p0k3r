import type { Metadata } from "next";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import PartnerForm from "./PartnerForm";
import { COMPANY } from "@/lib/regions/brand";
import { NEC_THRESHOLD } from "@/lib/regions/crewAgreement";
import { REGIONS } from "@/lib/regions/states";
import { TRADES } from "@/lib/regions/trades";

// Contractor partner onboarding.
//
// This page used to recruit commission-only sales reps. Under the network
// model there is nothing for a rep to sell — the contractor quotes their own
// work at their own rates — so the whole secondary funnel is now one thing:
// finding local trade businesses to take the demand we generate.
//
// A contractor reads this asking two questions, in order: what does it cost me,
// and are these leads real. Answer both above the fold or lose them. Everything
// else — trade list, coverage, paperwork — is below.

export const metadata: Metadata = {
  title: `Contractor Partner Network — Exclusive Booked Appointments | ${COMPANY.name}`,
  description:
    "We generate the homeowners and book the inspections. You quote your own rates and do the " +
    "work. Roofing, siding, fencing, gutters and painting across Colorado, Missouri, Kansas, " +
    "Indiana and Wyoming.",
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
    title: "You quote your own rates",
    body:
      "You give us your baseline rate sheet so we know what you charge and can talk sensibly " +
      "to a homeowner. What you quote on the day is yours to decide — we do not set your prices.",
  },
  {
    step: "04",
    title: "You do the work, on your paper",
    body:
      "The homeowner contracts with you, under your insurance, with your warranty. We are not " +
      "a party to it and we never touch the customer's money.",
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
      "Per square, per linear foot, per opening — however you price. Not so we can mark you " +
      "up, but so we can tell a homeowner a realistic range on the phone instead of sending " +
      "you to someone whose budget is half your number.",
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
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Partner network · {REGIONS.map((r) => r.code).join(" · ")}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                We find the homeowners. You do what you&apos;re good at.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                We run the marketing, take the calls and book the inspection. You turn up to a
                confirmed appointment, quote your own rates, and contract with the homeowner
                directly. No lead fees, no bidding against three other contractors, no shared
                lists.
              </p>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ["You keep your own prices", "We never set or mark up your rates."],
                  ["You own the customer", "Your contract, your insurance, your warranty."],
                  ["No pay-per-lead", "You are not buying anything up front."],
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
