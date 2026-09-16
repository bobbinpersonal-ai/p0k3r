import type { Metadata } from "next";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import InspectionForm from "@/components/network/InspectionForm";
import TradeMarquee from "@/components/network/TradeMarquee";
import StickyHeroVideo from "@/components/network/StickyHeroVideo";
import { COMPANY, FINANCING_ENABLED, FINANCING_PARTNER, PHONE_DIGITS, PROOF } from "@/lib/regions/brand";
import { NETWORK_DISCLOSURE, NETWORK_DISCLOSURE_SHORT } from "@/lib/regions/compliance";
import { REGIONS } from "@/lib/regions/states";
import { TRADES } from "@/lib/regions/trades";

// The homeowner landing page for the partner network.
//
// The pitch changed with the model. It is no longer "we will build your roof"
// — we do not build anything. It is "we will get somebody honest onto your
// roof this week, for free, and you are under no obligation to any of them."
// That is a weaker promise on its face and a stronger one in practice,
// because the thing a homeowner is actually frightened of in this trade is
// not price. It is picking the wrong contractor.
//
// So the page sells the vetting, not the trade. Trust signals are about how
// somebody gets into the network rather than about how many roofs we have
// done, which is the correct claim to make and also the only true one.
//
// The disclosure matters as much as the pitch. A homeowner who believes we
// employ the crews has a grievance against us for work we never touched, so
// NETWORK_DISCLOSURE appears above the fold and again in the footer, from one
// constant.
//
// What used to be here — the California yard business — is on the
// lovemeafter-v1 branch. Its customer-facing record links (/manage/<token>
// and /agreement/<token>) are deliberately still live on this deploy: every
// California confirmation points at them, and the agreement page carries a
// statutory cancellation notice that has to stay reachable.

export const metadata: Metadata = {
  title: `Free Roof & Exterior Inspections | Vetted Local Contractors | ${COMPANY.name}`,
  description:
    "Free inspection, written scope, and a match with a vetted local contractor. Roofing, " +
    "siding, fencing, gutters and exterior paint across Colorado, Missouri, Kansas, Indiana " +
    "and Wyoming. No obligation.",
};

const STEPS = [
  {
    title: "Tell us what needs looking at",
    body:
      "Thirty seconds and a ZIP code. We check we actually have contractors near you before " +
      "we take anything else.",
  },
  {
    title: "A free inspection, booked",
    body:
      "Forty minutes on the roof and around the house, photographs of everything found, and a " +
      "written scope whether there is damage or not.",
  },
  {
    title: "We match you to a vetted contractor",
    body:
      "Local, independent, insured, and checked against whatever your state and county " +
      "require. You get their name before they turn up.",
  },
  {
    title: "You decide, or you don't",
    body:
      "They quote, you choose. No obligation to use them, no fee to you either way, and " +
      "nobody chases you if the answer is no.",
  },
];

const FAQ = [
  {
    q: "So do you actually do the work?",
    a:
      "No, and it matters that you know it. We are a referral network: we market, we book the " +
      "inspection, and we match you with an independent local contractor who does the work " +
      "under their own insurance and their own contract with you. We are not a party to that " +
      "contract and we never hold your money. What we are responsible for is who we put in " +
      "front of you.",
  },
  {
    q: "What does it cost me?",
    a:
      "Nothing. The inspection is free, the match is free, and you are under no obligation to " +
      "hire anyone. We are paid by the contractors in the network, not by you — which you " +
      "should know, because it is the sort of thing you would want disclosed.",
  },
  {
    q: "Do I need to be home?",
    a: "For the inspection, no — we can walk the roof and call you. For the appointment where you get the price, yes, and so does anyone else who'd be part of the decision. We'd rather do it once properly than twice.",
  },
  {
    q: "How do you check the contractors?",
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
      "what to do next. The contractor can quote the work retail if you want it done anyway. " +
      "In Colorado a denial also gives you a right to rescind a signed roofing contract and get " +
      "any deposit back.",
  },
  {
    q: "How long does a roof take?",
    a: "Most houses are a single day — tear-off in the morning, dried in by lunch, finished by evening. Bigger or steeper roofs run to two.",
  },
  {
    q: "Who pulls the permit?",
    a:
      "The contractor, where the city or county requires one, and it should be in their price " +
      "rather than added afterwards. Ask before you sign — a contractor who wants you to pull " +
      "your own permit is telling you something about their licensing.",
  },
  {
    q: "What happens if something's wrong afterwards?",
    a:
      `Call the contractor first — the warranty is theirs and every contractor in the network ` +
      `commits to at least ${PROOF.workmanshipWarrantyYears} years on workmanship before we let ` +
      `them in. Then call us, because a contractor who will not come back is a contractor we ` +
      `want out of the network, and that is the only real leverage a referral network has.`,
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
                Free inspections · {REGIONS.map((r) => r.code).join(" · ")}
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                The hard part isn&apos;t the roof. It&apos;s knowing who to let near it.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                Roofing, siding, fencing, gutters and exterior paint. We book you a free
                inspection and match you with a local contractor we&apos;ve actually checked —
                insurance, registration, and two customers we rang ourselves. You get a written
                scope either way, and you&apos;re under no obligation to anyone.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                Now booking across{" "}
                <strong className="text-neutral-300">
                  {REGIONS.slice(0, -1).map((r) => r.name).join(", ")} and{" "}
                  {REGIONS[REGIONS.length - 1].name}
                </strong>
                , including the rural counties most contractors won&apos;t drive to.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {NETWORK_DISCLOSURE_SHORT}
              </p>

              {/* What we actually do, not claims about how long we have been
                  doing it. Under the network model the product IS the vetting,
                  so the trust strip describes that rather than a build history
                  we do not have and could not evidence. */}
              <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["The inspection", "Free, no obligation"],
                  ["Every contractor", "Insured & checked"],
                  ["Costs you", "Nothing, ever"],
                  ["Minimum workmanship", `${PROOF.workmanshipWarrantyYears} years`],
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
              What we&apos;ll get looked at
            </h2>
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
                A contractor from the network climbs the roof, photographs what they find, and
                gives you a written scope. If there&apos;s a claim worth filing they&apos;ll meet
                your adjuster up there and show them the same damage they showed you.
              </p>
              <p>
                You pay your deductible. Your carrier is billed for the rest.
              </p>
              <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-neutral-300">
                Nobody in this network is a public insurance adjuster, and nobody in it will
                negotiate your claim for you — that is licensed work in most states. And anyone
                who offers to cover, waive or absorb your deductible is offering you something
                Colorado, Kansas, Missouri and Indiana all prohibit. If you hear it, walk away —
                from us included.
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
                Free inspection, a written scope, and a contractor we&apos;ve checked. No
                obligation to hire anyone and nothing charged to you at any point.
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
        <section className="border-t border-white/10 bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              How this works, plainly
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">{NETWORK_DISCLOSURE}</p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              Contractors pay us for introductions. You never do. We think you should know which
              way the money runs before you take our recommendation.
            </p>
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
