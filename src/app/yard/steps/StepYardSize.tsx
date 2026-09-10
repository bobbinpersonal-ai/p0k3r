"use client";

import { YARD_SIZES, type YardSizeValue } from "@/lib/landscaping";
import type { YardEstimate } from "@/lib/parcel";

// "How big is the property?" — asked after the address, so we can take a guess at
// the answer before asking it.
//
// No prices on this step. Size is one of two things that decide the price and
// the service is the other, so showing a number here would mean showing one
// the customer hasn't finished choosing yet. They see every service priced for
// their yard on the next step instead, once both halves are known.
//
// When the parcel lookup found something (see src/lib/parcel.ts) it pre-selects
// a size and shows its working. It is always a suggestion: the estimate is a
// lot area with a hardscape deduction, not a measurement of grass, and the
// person reading it is standing in the yard. They win.

export default function StepYardSize({
  value,
  estimate,
  estimating,
  onChange,
}: {
  value: YardSizeValue | null;
  estimate: YardEstimate | null;
  estimating: boolean;
  onChange: (value: YardSizeValue) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">How big is the property?</h2>
      <p className="mt-2 text-neutral-300">
        Rough is fine — pick whichever sounds closest to the area that actually needs
        working on.
      </p>

      {estimating && (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-neutral-300">
          Checking your property records…
        </p>
      )}

      {!estimating && estimate && (
        <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3">
          <p className="text-sm text-ink">
            <span className="font-semibold">We had a look at your lot.</span>{" "}
            {estimate.county} County has it at about{" "}
            {estimate.lotSqft.toLocaleString()} sq ft, so after the house and driveway
            that&apos;s roughly{" "}
            <span className="font-semibold">
              {estimate.yardSqft.toLocaleString()} sq ft
            </span>{" "}
            of yard — a {estimate.yardSize.toLowerCase()} one.
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            {/* Said plainly rather than buried: this is a records lookup, not a
                measurement, and the customer is the one who can actually see
                the yard. Better they correct it now than the crew find out. */}
            That&apos;s from the county&apos;s records, not a measurement — change it below
            if it doesn&apos;t match what you&apos;re looking at.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {YARD_SIZES.map((size) => {
          const isSelected = size.value === value;
          const isSuggested = estimate?.yardSize === size.value;
          return (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange(size.value)}
              aria-pressed={isSelected}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-white/10 hover:border-brand/40 hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-ink">{size.label}</p>
                {isSuggested && (
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 font-mono text-xs text-brand">
                    suggested
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-300">{size.description}</p>
              <p className="mt-2 font-mono text-xs text-neutral-400">{size.areaHint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
