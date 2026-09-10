"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import LandscapingFlow from "@/app/yard/LandscapingFlow";
import type { ServiceCatalogue } from "@/lib/landscaping";
import { MATCH_COUNT } from "@/lib/majorTrades";

// The booking flow, living in the hero instead of on its own page.
//
// It used to be a teaser card that collected an address and then navigated to
// /yard to do the actual work. Handing someone a whole new page one answer in
// is a bigger ask than it looks: the page they were reading disappears, and
// what replaces it is visibly a five-step form. Keeping it here means the
// commitment grows one question at a time, on a page they already trust.
//
// Past step one the marketing column steps aside and the form takes the full
// width. Someone who has started answering has stopped reading the pitch, and
// leaving a headline and a phone number competing for attention next to a
// half-finished form is the "overwhelming" this is meant to fix.
//
// /yard still exists and still works — city pages, ad landing URLs and the
// service cards all deep-link into it, and it's the same component either way,
// so the two can't drift apart.

export default function HeroBooking({
  city,
  source,
  intro,
  catalogue,
}: {
  catalogue: ServiceCatalogue;
  city?: string;
  source?: string;
  /** The headline and pitch, rendered by the host page's server component. */
  intro: React.ReactNode;
}) {
  const [step, setStep] = useState(1);
  const started = step > 1;

  // Stable identity: LandscapingFlow calls this from an effect keyed on the
  // callback, so a new function every render would loop.
  const handleStepChange = useCallback((next: number) => setStep(next), []);

  return (
    <div
      className={
        started
          ? "grid gap-10"
          : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-start"
      }
    >
      {/* min-w-0: the marquee inside the intro is `w-max`, and a grid track
          sizes to min-content by default — without this the column blows out
          past the viewport. See the note on the homepage hero. */}
      {!started && (
        <div key="intro" className="min-w-0">
          {intro}
        </div>
      )}

      {/* Keyed, and this matters: when the intro above stops rendering, this
          div moves from the second child slot to the first. React reconciles
          children by position unless they're keyed, so without this it gets
          matched against the intro, unmounted and remounted — which threw away
          the flow's state and bounced the customer back to step 1 the moment
          they advanced. */}
      <div key="flow" className={started ? "mx-auto w-full max-w-2xl" : "min-w-0"}>
        {/* The intro carries the page's h1, and it unmounts once the customer
            starts — which would leave the document with none. This takes over
            the role for the rest of the flow. Visually hidden because the
            step heading inside the form is already saying the same thing on
            screen; this is for the outline a screen reader builds. */}
        {started && <h1 className="sr-only">Book your yard service</h1>}
        {/* Translucent so the hero footage reads through it. The blur sits
            behind a `supports-` guard because backdrop-filter is unreliable on
            older Safari/iPadOS and this site has been bitten by that before —
            browsers without it get a more opaque panel instead. */}
        <div
          data-hero-card
          className="rounded-2xl border border-white/10 bg-paper/80 p-4 shadow-xl ring-1 ring-white/10 supports-[backdrop-filter]:bg-paper/70 supports-[backdrop-filter]:backdrop-blur-md sm:p-6"
        >
          <LandscapingFlow
            embedded
            catalogue={catalogue}
            onStepChange={handleStepChange}
            city={city}
            source={source}
          />
        </div>

        {/* The way out for work we aren't licensed to do. Kept on step one
            only: someone mid-quote doesn't need a second front door, but
            someone who has just arrived with a remodel in mind does. */}
        {!started && (
          <p className="mt-3 text-center text-xs text-neutral-300 lg:text-left">
            Kitchen, bath, roofing, tree removal or concrete?{" "}
            <Link href="/contractors" className="font-semibold text-brand-cyan hover:text-ink">
              Get {MATCH_COUNT} licensed contractor quotes
            </Link>{" "}
            — we refer that work out.
          </p>
        )}
      </div>
    </div>
  );
}
