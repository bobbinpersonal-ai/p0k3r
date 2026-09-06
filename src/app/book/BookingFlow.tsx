"use client";

import { useRef, useState } from "react";
import QuoteStep, { type QuoteResult } from "@/app/book/QuoteStep";
import BookingForm from "@/app/book/BookingForm";
import type { MoveSizeValue } from "@/lib/moveSizes";

// Two-step booking: price it, then book it.
//
// Step 1 is the map/quote experience — addresses, route, vehicle tiers.
// Step 2 is the existing details form, which keeps the addresses as a summary
// instead of asking for them again. Quote state lives here so going back to
// "Change" doesn't lose what was already typed.

export default function BookingFlow({
  initialSize,
  initialPickup,
  initialDropoff,
  city,
}: {
  initialSize?: MoveSizeValue;
  initialPickup?: string;
  initialDropoff?: string;
  city?: string;
}) {
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  if (!quote) {
    return (
      <QuoteStep
        initialPickup={initialPickup}
        initialDropoff={initialDropoff}
        initialSize={initialSize}
        onContinue={(result) => {
          setQuote(result);
          // Land the customer at the top of the details form rather than
          // wherever the tier card happened to be scrolled to.
          requestAnimationFrame(() =>
            detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          );
        }}
      />
    );
  }

  return (
    <div ref={detailsRef} className="scroll-mt-24">
      <BookingForm
        initialSize={quote.moveSize}
        city={city}
        quote={quote}
        onEditQuote={() => setQuote(null)}
      />
    </div>
  );
}
