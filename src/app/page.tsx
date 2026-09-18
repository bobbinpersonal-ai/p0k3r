import type { Metadata } from "next";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import InspectionForm from "@/components/network/InspectionForm";
import TradeMarquee from "@/components/network/TradeMarquee";
import StickyHeroVideo from "@/components/network/StickyHeroVideo";
import {
  COMPANY,
  FINANCING_ENABLED,
  FINANCING_PARTNER,
  PHONE_DIGITS,
  PROOF,
  SPEED_PROMISE,
} from "@/lib/regions/brand";
import { REGIONS } from "@/lib/regions/states";
import { TRADES } from "@/lib/regions/trades";

// The homeowner landing page.
//
// We are the general contractor on every job: we hold the contract, collect
// payment, and stand behind the work. Crews on the ground are staffed today
// through vetted local contractors and over time directly by us — that
// staffing detail is internal and never surfaces in consumer copy, which
// should read the same regardless of which crew shows up. So the page sells
// the vetting and the guarantee, not a build history we don't have yet.
//
// What used to be here — the California yard business — is on the
// lovemeafter-v1 branch. Its customer-facing record links (/manage/<token>
// and /agreement/<token>) are deliberately still live on this deploy: every
// California confirmation points at them, and the agreement page carries a
// statutory cancellation notice that has to stay reachable.

export const metadata: Metadata = {
  title: `Free Home Improvement Estimate — Same-Day Callback | ${COMPANY.name}`,
  description:
    "Windows, siding, roofing, garage doors, fencing, gutters and exterior paint across Colorado, " +
    "Missouri, Kansas, Indiana and Wyoming. Free written estimate, a vetted crew, and we call you " +
    "back the same day. No obligation.",
};

const STEPS = [
  {
    title: "Tell us what needs doing",
    body:
      "Thirty seconds and a ZIP code. We check we're already working near you before we take " +
      "anything else.",
  },
  {
    title: "A free estimate, booked",
    body:
      "We walk the house, photograph everything we find, and give you a written scope and a " +
      "real number — whether it's one window or the whole exterior.",
  },
  {
    title: "We send a vetted crew",
    body:
      "Local, insured, and checked against whatever your state and county require. You get " +
      "the crew lead's name before they turn up.",
  },
  {
    title: "You decide, or you don't",
    body:
      "We quote, you choose. No obligation, no fee to you either way, and nobody chases you " +
      "if the answer is no.",
  },
];

const FAQ = [
  {
    q: "What does it cost me?",
    a:
      "Nothing to start. The estimate is free and the written scope is free, and you are " +
      "under no obligation to hire us. You only pay if you decide to go ahead with the work.",
  },
  {
    q: "Can you do more than one thing at once?",
    a:
      "That's usually the cheaper way to do it. Siding and windows share scaffolding, gutters " +
      "go on after a roof, and paint goes last — doing them together saves you a mobilisation " +
      "each time. Ask for a price on everything you're thinking about, even the parts you'd " +
      "put off; we'll tell you honestly what can wait.",
  },
  {
    q: "Do I need to be home?",
    a: "For the walk-round, no — we can look at the outside and call you. For the appointment where you get the price, yes, and so does anyone else who'd be part of the decision. We'd rather do it once properly than twice.",
  },
  {
    q: "How do you check the crews you send?",
    a:
      "Current general liability insurance, a W-9, two customers we ring ourselves, and " +
      "whatever their state or county requires — which varies more than people expect. Kansas " +
      "roofers have to be registered with the Attorney General. Most Colorado Front Range " +
      "cities license locally. Indiana dictates what a home improvement contract has to say. " +
      "We check the one that applies and we re-check it. Ask us for any of it and we will hand " +
      "it over without being chased.",
  },
  {
    q: "What if my insurance denies the claim?",
    a:
      "You still have a written scope and a photographed inspection, at no cost, and you decide " +
      "what to do next. We can quote the work retail if you want it done anyway. In Colorado a " +
      "denial also gives you a right to rescind a signed roofing contract and get any deposit " +
      "back.",
  },
  {
    q: "How long does the work take?",
    a:
      "Most roofs are a single day — tear-off in the morning, dried in by lunch, finished by " +
      "evening. Windows are usually a day for a houseful. Siding and exterior paint run three " +
      "to five days depending on the house. Gutters, fencing and a garage door are same-day " +
      "jobs. You get the real number in writing before you sign, not an optimistic one.",
  },
  {
    q: "Who pulls the permit?",
    a:
      "We do, where the city or county requires one, and it's in our price rather than added " +
      "afterwards.",
  },
  {
    q: "What happens if something's wrong afterwards?",
    a:
      `Call us. Every job carries a minimum ${PROOF.workmanshipWarrantyYears}-year workmanship ` +
      `warranty, and we come back and fix it.`,
  },
];

export default function HomePage() {
  return (
    <>
      <NetworkHeader />
      <TradeMarquee />
      <main>
        {/* Hero and trades scroll over the footage — see StickyHeroVideo.
            Neither section carries a background of its own, or the video would
            be behind a wall. */}
        <StickyHeroVideo>
        {/* The hero fills the first screen on desktop (110px is the header
            plus the marquee). Two columns make it short otherwise — barely
            650px — and the footage would be gone before anyone had finished
            reading the headline. */}
        <section className="relative">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:min-h-[calc(100svh-110px)] lg:grid-cols-[1.05fr_minmax(0,380px)] lg:items-center lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Free estimates · {REGIONS.map((r) => r.code).join(" · ")}
              </p>
              {/* Plain, not clever. Landing-page testing is consistent on this
                  — straightforward headlines naming the service and the benefit
                  beat creative ones, and headline changes alone move conversion
                  by 27–104%. The previous line here ("the hard part isn't the
                  work...") was the better sentence and the worse headline: a
                  homeowner scanning for five seconds could not tell from it
                  what we sell or what they get. */}
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                Free home improvement estimate. {SPEED_PROMISE}.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                Windows, siding, roofing, garage doors, fencing, gutters and exterior paint. We
                walk the house, put a real number in writing, and send a crew we&apos;ve actually
                checked — insurance, registration, and two customers we rang ourselves. No
                obligation either way.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Now booking across{" "}
                <strong className="text-neutral-300">
                  {REGIONS.slice(0, -1).map((r) => r.name).join(", ")} and{" "}
                  {REGIONS[REGIONS.length - 1].name}
                </strong>
                , including the rural counties most contractors won&apos;t drive to.
              </p>

              {/* What we actually do, not claims about how long we have been
                  doing it. The product is the vetting and the guarantee, so
                  the trust strip describes that rather than a build history
                  we do not have yet and could not evidence. */}
              {/* Three, not four. The guidance is consistent that a hero wants
                  a small number of trust signals readable in the first screen,
                  and the fourth here ("costs you nothing") was saying the same
                  thing as the first. */}
              <dl className="mt-8 grid grid-cols-3 gap-4">
                {[
                  ["Callback", "Same day"],
                  ["Every crew", "Insured & checked"],
                  ["Workmanship", `${PROOF.workmanshipWarrantyYears}-year warranty`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0">
              <InspectionForm />
            </div>
          </div>
        </section>

        {/* Trades */}
        <section id="trades" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              What we do
            </h2>
            <p className="mt-2 max-w-2xl text-neutral-300">
              The whole outside of the house, and any part of it on its own. One job or all of
              them — we&apos;d rather price the lot and tell you what can wait.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRADES.map((trade) => (
                <div
                  key={trade.value}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <h3 className="text-lg font-bold text-ink">{trade.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                    {trade.blurb}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Storm. The highest-intent segment in this trade, and the only honest
            version of this pitch — see src/lib/regions/compliance.ts.
            No background of its own: it is inside the pinned run, and an
            opaque one would put a wall in front of the footage. */}
        <section id="storm" className="scroll-mt-20 border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Hail &amp; wind
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Start with the inspection, not the claim.
            </h2>
            <div className="mt-5 space-y-4 text-neutral-200">
              <p>
                We climb the roof, photograph what we find, and give you a written scope. If
                there&apos;s a claim worth filing we&apos;ll meet your adjuster up there and show
                them the same damage we showed you.
              </p>
              <p>
                You pay your deductible. Your carrier is billed for the rest.
              </p>
              <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-neutral-300">
                We are not a public insurance adjuster and we will not negotiate your claim for
                you — that is licensed work in most states. And anyone who offers to cover, waive
                or absorb your deductible is offering you something Colorado, Kansas, Missouri
                and Indiana all prohibit. If you hear it, walk away — from us included.
              </p>
            </div>
          </div>
        </section>

        {FINANCING_ENABLED && (
          <section className="border-b border-white/10 bg-surface">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                Financing
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Most people do this on a monthly payment.
              </h2>
              <p className="mt-3 text-neutral-200">
                We finance through {FINANCING_PARTNER}. Your rep can run the approval at the
                kitchen table in a few minutes and tell you the monthly number before you decide
                anything. Approval and terms come from {FINANCING_PARTNER}, not from us.
              </p>
            </div>
          </section>
        )}

        {/* How it works. Inside the pinned run on purpose: it is the last
            block that travels over the footage, and three steps about crews
            turning up read better over crews turning up. */}
        <section id="how" className="scroll-mt-20 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <p className="font-mono text-2xl font-bold text-brand-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        </StickyHeroVideo>

        {/* FAQ. First section on solid ground — the sticky block's bottom
            gradient fades to bg-paper, so whatever lands under it has to be
            bg-paper too or there is a visible seam. */}
        <section className="border-b border-white/10 bg-paper">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">
              Questions people actually ask
            </h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold text-ink marker:content-none">
                    {item.q}
                    <span className="float-right text-neutral-400 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_minmax(0,380px)]">
            <div className="min-w-0">
              <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Find out what it actually costs.
              </h2>
              <p className="mt-3 text-lg text-neutral-200">
                Free estimate, a written scope, and a crew we&apos;ve checked. {SPEED_PROMISE} —
                most companies in this trade take days, and plenty never call back at all.
              </p>
              <p className="mt-6">
                <a
                  href={`tel:${PHONE_DIGITS}`}
                  className="font-mono text-lg font-bold text-brand-cyan hover:text-ink"
                >
                  Or call {COMPANY.phone}
                </a>
              </p>
            </div>
            <div className="min-w-0">
              <InspectionForm source="website-footer" id="inspection-footer" />
            </div>
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
