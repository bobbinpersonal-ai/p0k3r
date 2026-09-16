import type { Metadata } from "next";
import TxHeader from "@/components/tx/TxHeader";
import TxFooter from "@/components/tx/TxFooter";
import SellForm from "./SellForm";
import { COMPANY } from "@/lib/texas/brand";
import { OVERAGE_RATE } from "@/lib/texas/commission";
import { getTrade } from "@/lib/texas/trades";

// The recruiting page. It was linked from the header and the footer and did
// not exist, so every applicant the job ad sent here hit a 404.
//
// Written to repel as much as to attract: a commission-only closer who needs a
// cheque on the 1st costs more to hire and lose than the one who never applied.

export const metadata: Metadata = {
  title: `In-Home Sales Closer — Commission Only | ${COMPANY.name}`,
  description:
    "We set the appointments. You close them. Keep 60% of everything you sell above our " +
    "base price. Roofing and exteriors across Texas. 1099, paid weekly.",
  robots: { index: true, follow: true },
};

// A worked example beats "$200k potential", and it has to be a real one from
// the real price book rather than a number chosen to look good.
const EXAMPLE = (() => {
  const duration = getTrade("ROOFING")?.options.find((o) => o.value === "OC_DURATION");
  const squares = 28;
  const base = (duration?.basePerUnit ?? 0) * squares;
  // A realistic DFW retail price for this roof, not a flattering one — around
  // $750 a square. The whole point of showing the arithmetic is that it holds
  // up, and a rep who does the sum and finds it optimistic stops reading.
  const sold = 21000;
  return {
    squares,
    base,
    sold,
    commission: Math.round((sold - base) * OVERAGE_RATE),
  };
})();

export default function SellPage() {
  return (
    <>
      <TxHeader ctaHref="#apply" />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 bg-grid-fade" />
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_minmax(0,380px)] lg:py-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                Hiring closers · DFW, Houston, Austin, San Antonio
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                We set the appointments. You close them.
              </h1>
              <p className="mt-4 text-lg text-neutral-200">
                Keep <strong className="text-ink">{Math.round(OVERAGE_RATE * 100)}%</strong> of
                everything you sell above our base price. Roofing, siding, windows, gutters,
                garage doors and fence. Paid weekly by Zelle or Apple Pay.
              </p>

              <div className="mt-8 rounded-2xl border border-brand/40 bg-brand/5 p-5">
                <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                  What that actually means
                </p>
                <p className="mt-2 text-neutral-200">
                  A {EXAMPLE.squares}-square architectural roof bases at{" "}
                  <span className="font-mono font-bold text-ink">
                    ${EXAMPLE.base.toLocaleString()}
                  </span>
                  . You see that number and you see our cost — we don&apos;t hide either. Sell it
                  at <span className="font-mono font-bold text-ink">${EXAMPLE.sold.toLocaleString()}</span>{" "}
                  and you&apos;ve made{" "}
                  <span className="font-mono font-bold text-brand-cyan">
                    ${EXAMPLE.commission.toLocaleString()}
                  </span>{" "}
                  on one appointment.
                </p>
                <p className="mt-3 text-sm text-neutral-300">
                  Reps who sit ten appointments a week and close three are making real money.
                  Reps who sit four are not. We&apos;ll tell you which one you are inside three
                  weeks.
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <SellForm />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">What we give you</h2>
              <ul className="mt-4 space-y-3 text-neutral-200">
                {[
                  "Pre-set, confirmed appointments with homeowners who agreed to see you",
                  "A pricing app that does the maths at the kitchen table — no callbacks to quote",
                  "Contracts, financing and insurance-claim support",
                  "Paid weekly on collected deposits, by Zelle or Apple Pay",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">What you bring</h2>
              <ul className="mt-4 space-y-3 text-neutral-200">
                {[
                  "Your own vehicle, phone and insurance",
                  "A ladder you're willing to climb, or the sense to know when not to",
                  "In-home or commission sales experience preferred",
                  "The ability to sit at a kitchen table for ninety minutes without checking your phone — required",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* The paragraph that raises application quality more than any other. */}
        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink">What this is not</h2>
            <p className="mt-3 text-neutral-200">
              Not a base salary. Not a desk. Not forty leads a day you have to dig up yourself.
              This is 1099 independent contractor work — you set your own hours and work your own
              appointments — and there is no draw. If you need a guaranteed cheque on the 1st,
              this isn&apos;t it, and we&apos;d rather tell you now than in week three.
            </p>
            <p className="mt-6">
              <a
                href="#apply"
                className="inline-block rounded-full bg-brand px-6 py-3 font-bold text-white hover:opacity-90"
              >
                Still interested? Apply
              </a>
            </p>
          </div>
        </section>
      </main>
      <TxFooter />
    </>
  );
}
