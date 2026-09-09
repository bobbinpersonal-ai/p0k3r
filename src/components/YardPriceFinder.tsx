"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DEFAULT_FREQUENCY,
  frequenciesFor,
  LANDSCAPING_SERVICES,
  quoteLandscaping,
  YARD_SIZES,
  type FrequencyValue,
  type LandscapingServiceValue,
  type YardSizeValue,
} from "@/lib/landscaping";
import { YARD_SERVICE_ICONS } from "@/components/YardIcons";

// The hero widget: two taps and you have your price.
//
// This is the whole pitch of a flat-price yard company, so it goes above the
// fold rather than behind a "get a quote" button. Every competitor in this
// market answers "how much?" with "we'll come out and take a look," which means
// a stranger in your driveway before you know whether you can afford it. Being
// able to read the number without giving up a phone number is the product.
//
// It doesn't collect anything or submit anything — it prices, then hands the
// answers to /yard so the booking flow opens on step 3 with the first two
// already filled in.

export default function YardPriceFinder({ city }: { city?: string }) {
  const [service, setService] = useState<LandscapingServiceValue>("MOW_EDGE_BLOW");
  const [size, setSize] = useState<YardSizeValue>("MEDIUM");
  const [frequency, setFrequency] = useState<FrequencyValue>(DEFAULT_FREQUENCY);

  const cadences = frequenciesFor(service);
  const quote = quoteLandscaping(service, size, frequency);

  function pickService(value: LandscapingServiceValue) {
    setService(value);
    // A cadence chosen for mowing means nothing on a sod install.
    if (!frequenciesFor(value).some((f) => f.value === frequency)) setFrequency("ONE_TIME");
  }

  return (
    <div className="mt-8 rounded-2xl border border-black/10 bg-paper p-4 shadow-lg sm:p-5">
      <p className="text-sm font-semibold text-ink">What does the yard need?</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LANDSCAPING_SERVICES.map((option) => {
          const Icon = YARD_SERVICE_ICONS[option.value];
          const isSelected = option.value === service;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => pickService(option.value)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-black/10 hover:border-brand/40"
              }`}
            >
              {Icon && <Icon />}
              <span className="text-xs font-semibold leading-tight text-ink">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">How big?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {YARD_SIZES.map((option) => {
          const isSelected = option.value === size;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSize(option.value)}
              aria-pressed={isSelected}
              title={option.areaHint}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isSelected
                  ? "border-brand bg-brand font-semibold text-white"
                  : "border-black/10 text-ink hover:border-brand/40"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {cadences.length > 1 && (
        <>
          <p className="mt-4 text-sm font-semibold text-ink">How often?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cadences.map((option) => {
              const isSelected = option.value === frequency;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFrequency(option.value)}
                  aria-pressed={isSelected}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isSelected
                      ? "border-brand bg-brand font-semibold text-white"
                      : "border-black/10 text-ink hover:border-brand/40"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {quote && (
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-black/10 pt-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Your price
            </p>
            <p className="mt-1 text-4xl font-extrabold leading-none text-ink">
              ${quote.perVisit}
              <span className="ml-2 align-middle text-sm font-normal text-neutral-500">
                {quote.frequency.visitsPerMonth === null
                  ? "one visit"
                  : `per visit · ~$${quote.monthlyTotal}/mo`}
              </span>
            </p>
          </div>
          <Link
            href={{
              pathname: "/yard",
              query: {
                service,
                size,
                frequency,
                ...(city ? { city } : {}),
              },
            }}
            className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
          >
            Book this
          </Link>
        </div>
      )}
      <p className="mt-3 text-xs text-neutral-500">
        {/* The single most important sentence on the page. Every other yard
            company in this market quotes after a site visit, which is how a
            $75 mow becomes $180 on the doorstep. */}
        That&apos;s the price we charge, not a starting point. No site visit needed to
        find out.
        {quote?.service.materialsNote ? ` ${quote.service.materialsNote}.` : ""}
      </p>
    </div>
  );
}
