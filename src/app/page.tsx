import type { Metadata } from "next";
import TxHeader from "@/components/tx/TxHeader";
import TxFooter from "@/components/tx/TxFooter";
import InspectionForm from "@/components/tx/InspectionForm";
import { COMPANY, PHONE_DIGITS, PROOF } from "@/lib/texas/brand";
import { TRADES } from "@/lib/texas/trades";

// The Texas landing page.
//
// It has one job at the top and one at the bottom. At the top: look like a
// company that has done this two hundred times, because most of this traffic
// is a homeowner googling us mid-phone-call to decide whether we're real. At
// the bottom: capture consent to contact, which is what turns a stranger into
// someone we may lawfully call and text.
//
// What used to be here — the California yard business — is on the
// lovemeafter-v1 branch. Its customer-facing record links (/manage/<token>
// and /agreement/<token>) are deliberately still live on this deploy: every
// California confirmation points at them, and the agreement page carries a
// statutory cancellation notice that has to stay reachable.

export const metadata: Metadata = {
  title: `Roofing, Siding & Windows in Texas | ${COMPANY.name}`,
  description:
    "Free roof inspection, a written price the same day, and a crew that shows up when we " +
    "say. Roofing, siding, windows, gutters and fence across Dallas–Fort Worth, Houston, " +
    "Austin and San Antonio.",
};

const STEPS = [
  {
    title: "We inspect, free",
    body: "Forty minutes on the roof and around the house. Photographs of everything we find.",
  },
  {
    title: "You get a number that day",
    body: "In writing, at your kitchen table. Not a range, not a callback, not a brochure.",
  },
  {
    title: "We build it",
    body: "Material on site, crew on time, and the site swept every evening before they leave.",
  },
];

const FAQ = [
  {
    q: "Do I need to be home?",
    a: "For the inspection, no — we can walk the roof and call you. For the appointment where you get the price, yes, and so does anyone else who'd be part of the decision. We'd rather do it once properly than twice.",
  },
  {
    q: "Are you licensed?",
    a: "Texas doesn't license roofing or general contractors — there is no state licence to hold, and anyone telling you they have one is telling you something odd. What we do carry is general liability insurance, city registration where we pull permits, and references in your neighbourhood. Ask for all three, from us and from anyone else you're talking to.",
  },
  {
    q: "What if my insurance denies the claim?",
    a: "Then you have a written scope and a photographed inspection, at no cost, and you decide what to do next. We'll quote the work retail if you want it done anyway.",
  },
  {
    q: "How long does a roof take?",
    a: "Most houses are a single day — tear-off in the morning, dried in by lunch, finished by evening. Bigger or steeper roofs run to two.",
  },
  {
    q: "Do you pull permits?",
    a: "Yes, where the city requires one, and it's included in the price rather than added afterwards.",
  },
  {
    q: "What happens if something's wrong afterwards?",
    a: `Call us. Workmanship is warranted for ${PROOF.workmanshipWarrantyYears} years and the shingle manufacturer warrants the material separately. We come back.`,
  },
];

export default function HomePage() {
  return (
    <>
      <TxHeader />
      <main>
        {/* Hero — form above the fold on a phone, which is where this traffic is. */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="glow-blob absolute left-1/2 top-0 h-[480px] w-[860px] -translate-x-1/2 rounded-full" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,380px)] lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Booking inspections across Texas
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                Your roof is older than your last three cars.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                Free inspection, a written price the same day, and a crew that shows up when we
                say. Roofing, siding, windows and fence across North Texas.
              </p>

              {/* Promises about how we work, not claims about how long we have
                  been working. Anything historical here has to be true and
                  evidenced before it goes on a page a homeowner reads. */}
              <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["The inspection", "Free, no obligation"],
                  ["Your price", "In writing, same day"],
                  ["Insurance paperwork", "We handle it"],
                  ["Workmanship warranty", `${PROOF.workmanshipWarrantyYears} years`],
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
        <section id="trades" className="scroll-mt-20 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">What we do</h2>
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

        {/* Storm. The highest-intent segment in Texas, and the only honest
            version of this pitch — see src/lib/texas/compliance.ts. */}
        <section id="storm" className="scroll-mt-20 border-b border-white/10 bg-surface">
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
                there&apos;s a claim worth filing, we&apos;ll meet your adjuster up there and show
                them the same damage we showed you.
              </p>
              <p>
                You pay your deductible. We bill your carrier for the rest.
              </p>
              <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-neutral-300">
                We&apos;re roofing contractors, not public insurance adjusters. We can&apos;t
                negotiate your claim for you — and anyone who offers to cover or waive your
                deductible is offering you something Texas law makes a crime. If you hear it,
                walk away, from us included.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">How it works</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
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

        {/* FAQ */}
        <section className="border-b border-white/10">
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
                Free inspection, written scope, and a price the same day. No obligation and
                nothing charged.
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
      <TxFooter />
    </>
  );
}
