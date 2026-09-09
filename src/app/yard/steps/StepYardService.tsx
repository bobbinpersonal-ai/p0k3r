"use client";

import {
  LANDSCAPING_SERVICES,
  startingPriceFor,
  type LandscapingServiceValue,
} from "@/lib/landscaping";

// "What does the yard need?" — the first and most important question.
//
// Deliberately shows what each job includes rather than just naming it. Most
// people booking yard work have never hired anyone for it and don't know where
// "mowing" stops and "cleanup" starts; the bullets are what stop someone
// booking a $55 mow for a yard that hasn't been touched in two years, then
// being upsold on the doorstep. A price that changes on arrival is the single
// worst thing this business could be known for.

export default function StepYardService({
  value,
  onChange,
}: {
  value: LandscapingServiceValue | null;
  onChange: (value: LandscapingServiceValue) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">What does the yard need?</h2>
      <p className="mt-2 text-neutral-500">
        Pick the closest one — you can add anything else in the notes at the end.
      </p>

      <div className="mt-8 grid gap-3">
        {LANDSCAPING_SERVICES.map((service) => {
          const isSelected = service.value === value;
          return (
            <button
              key={service.value}
              type="button"
              onClick={() => onChange(service.value)}
              aria-pressed={isSelected}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-black/10 hover:border-brand/40 hover:bg-black/[0.02]"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-ink">{service.label}</p>
                <p className="shrink-0 font-mono text-sm text-brand-cyan">
                  from ${startingPriceFor(service.value)}
                </p>
              </div>
              <p className="mt-1 text-sm text-neutral-500">{service.description}</p>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {service.includes.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-sm text-neutral-500">
                    <span aria-hidden className="mt-0.5 text-brand-cyan">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              {service.materialsNote && (
                <p className="mt-3 text-xs text-neutral-400">{service.materialsNote}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
