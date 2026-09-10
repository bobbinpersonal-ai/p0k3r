"use client";

import {
  frequenciesFor,
  getYardSizeLabel,
  quoteLandscaping,
  LANDSCAPING_SERVICES,
  type FrequencyValue,
  type LandscapingServiceValue,
  type YardSizeValue,
} from "@/lib/landscaping";
import { YARD_SERVICE_ICONS } from "@/components/YardIcons";

// "What does the yard need?" — with every service priced for THIS yard.
//
// This is the payoff of asking for the address and the size first, and the
// reason the price isn't quoted anywhere earlier: by the time someone reads
// this screen, every number on it is their number, not a "from" or an average.
// Four real prices side by side is also the most honest way to sell the bigger
// jobs — someone who came for a $75 mow can see what a full cleanup on their
// own lot costs without having to ask and be sold to.
//
// The cadence choices only appear inside the service that has them (mowing),
// once it's picked. Offering "every week" against a sod install would be
// selling something nobody needs twice, and offering it before the service is
// chosen would price a decision that hasn't been made.

export default function StepYardServices({
  yardSize,
  service,
  frequency,
  onChange,
}: {
  yardSize: YardSizeValue;
  service: LandscapingServiceValue | null;
  frequency: FrequencyValue;
  onChange: (next: {
    service: LandscapingServiceValue;
    frequency: FrequencyValue;
  }) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">What does the yard need?</h2>
      <p className="mt-2 text-neutral-500">
        Every price below is for your {getYardSizeLabel(yardSize).toLowerCase()} yard — not a
        starting point, and not an average.
      </p>

      <div className="mt-8 grid gap-3">
        {LANDSCAPING_SERVICES.map((option) => {
          const Icon = YARD_SERVICE_ICONS[option.value];
          const isSelected = option.value === service;
          const quote = quoteLandscaping(
            option.value,
            yardSize,
            isSelected ? frequency : "ONE_TIME",
          );
          const cadences = frequenciesFor(option.value);

          return (
            <div
              key={option.value}
              className={`rounded-2xl border transition ${
                isSelected ? "border-brand bg-brand/5" : "border-black/10"
              }`}
            >
              <button
                type="button"
                onClick={() => onChange({ service: option.value, frequency: "ONE_TIME" })}
                aria-pressed={isSelected}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {Icon && (
                      <span className="shrink-0">
                        <Icon />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{option.label}</p>
                      <p className="mt-1 text-sm text-neutral-500">{option.description}</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-mono text-xl font-bold text-brand-cyan">
                    ${quote?.perVisit}
                  </p>
                </div>

                <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                  {option.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-sm text-neutral-500"
                    >
                      <span aria-hidden className="mt-0.5 text-brand-cyan">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                {option.materialsNote && (
                  <p className="mt-3 text-xs text-neutral-400">{option.materialsNote}</p>
                )}
              </button>

              {isSelected && cadences.length > 1 && (
                <div className="border-t border-brand/20 px-5 py-4">
                  <p className="text-sm font-semibold text-ink">How often?</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {cadences.map((cadence) => {
                      const cadenceQuote = quoteLandscaping(
                        option.value,
                        yardSize,
                        cadence.value,
                      );
                      const cadenceSelected = cadence.value === frequency;
                      return (
                        <button
                          key={cadence.value}
                          type="button"
                          onClick={() =>
                            onChange({ service: option.value, frequency: cadence.value })
                          }
                          aria-pressed={cadenceSelected}
                          className={`flex items-baseline justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            cadenceSelected
                              ? "border-brand bg-brand/10"
                              : "border-black/10 hover:border-brand/40"
                          }`}
                        >
                          <span className="text-sm text-ink">{cadence.label}</span>
                          <span className="shrink-0 font-mono text-sm font-semibold text-brand-cyan">
                            ${cadenceQuote?.perVisit}
                            {cadenceQuote?.monthlyTotal
                              ? ` · ~$${cadenceQuote.monthlyTotal}/mo`
                              : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-sm text-neutral-500">
                    Weekly and every-other-week cost less per visit — the yard never gets
                    away from us. Monthly is the same as a one-off, since by then it&apos;s
                    grown back. No contract either way.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
