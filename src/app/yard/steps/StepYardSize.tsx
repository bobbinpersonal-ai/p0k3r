"use client";

import {
  frequenciesFor,
  getLandscapingService,
  quoteLandscaping,
  YARD_SIZES,
  type FrequencyValue,
  type LandscapingServiceValue,
  type YardSizeValue,
} from "@/lib/landscaping";

// "How big, and how often?" — the step where the price appears.
//
// Size and cadence share a screen on purpose. They're the two inputs that
// decide the number, and splitting them across two screens would mean showing
// a price, then changing it a tap later. Here every size card carries its own
// live price for the cadence currently selected, so switching to "every week"
// re-prices all four at once and the discount is something the customer can
// see rather than something they're told about.
//
// The cadence row only appears for services that make sense on a schedule —
// see allowsRecurring in landscaping.ts. Offering "weekly overgrowth clearing"
// would be selling something nobody needs twice.

export default function StepYardSize({
  service,
  yardSize,
  frequency,
  onChange,
}: {
  service: LandscapingServiceValue;
  yardSize: YardSizeValue | null;
  frequency: FrequencyValue;
  onChange: (next: { yardSize: YardSizeValue | null; frequency: FrequencyValue }) => void;
}) {
  const serviceCard = getLandscapingService(service);
  const cadences = frequenciesFor(service);
  const showCadence = cadences.length > 1;
  const selected = yardSize ? quoteLandscaping(service, yardSize, frequency) : undefined;

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">How big is the yard?</h2>
      <p className="mt-2 text-neutral-500">
        Rough is fine — pick whichever sounds closest. The price you see is the price
        {serviceCard?.materialsNote ? " for the labour" : ""}, not a starting point.
      </p>

      {showCadence && (
        <>
          <p className="mt-8 text-sm font-semibold text-ink">How often?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cadences.map((cadence) => {
              const isSelected = cadence.value === frequency;
              return (
                <button
                  key={cadence.value}
                  type="button"
                  onClick={() => onChange({ yardSize, frequency: cadence.value })}
                  aria-pressed={isSelected}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isSelected
                      ? "border-brand bg-brand font-semibold text-white"
                      : "border-black/10 text-ink hover:border-brand/40"
                  }`}
                >
                  {cadence.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            {/* Said plainly rather than buried: a weekly yard is quick to cut, a
                monthly one isn't, and pretending otherwise would mean either
                overcharging the weekly customer or underpaying the crew on the
                monthly one. */}
            Weekly and every-other-week cost less per visit — the yard never gets away from
            us. Monthly is the same as a one-off, since by then it&apos;s grown back.
          </p>
        </>
      )}

      <p className="mt-8 text-sm font-semibold text-ink">Yard size</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {YARD_SIZES.map((size) => {
          const quote = quoteLandscaping(service, size.value, frequency);
          const isSelected = size.value === yardSize;
          return (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange({ yardSize: size.value, frequency })}
              aria-pressed={isSelected}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-black/10 hover:border-brand/40 hover:bg-black/[0.02]"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-ink">{size.label}</p>
                <p className="shrink-0 font-mono text-lg font-bold text-brand-cyan">
                  ${quote?.perVisit}
                </p>
              </div>
              <p className="mt-1 text-sm text-neutral-500">{size.description}</p>
              <p className="mt-2 font-mono text-xs text-neutral-400">{size.areaHint}</p>
              {quote && quote.recurringSavings > 0 && (
                <p className="mt-2 text-xs font-semibold text-brand">
                  ${quote.recurringSavings} off the ${quote.oneTimePrice} one-off
                </p>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-black/[0.03] p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            Your price
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink">
            ${selected.perVisit}
            <span className="ml-2 text-base font-normal text-neutral-500">
              {selected.frequency.visitsPerMonth === null
                ? "one visit"
                : `per visit, ${selected.frequency.cadence}`}
            </span>
          </p>
          {selected.monthlyTotal !== null && (
            <p className="mt-1 text-sm text-neutral-500">
              About ${selected.monthlyTotal} a month. Cancel any time — there&apos;s no
              contract.
            </p>
          )}
          <p className="mt-3 text-sm text-neutral-500">
            {selected.crewSize === 1 ? "One person" : `${selected.crewSize} people`}, about{" "}
            {selected.hoursLow === selected.hoursHigh
              ? selected.hoursLow
              : `${selected.hoursLow}–${selected.hoursHigh}`}{" "}
            {selected.hoursHigh === 1 ? "hour" : "hours"} of work.
            {serviceCard?.materialsNote ? ` ${serviceCard.materialsNote}.` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
