"use client";

import { useState } from "react";
import {
  PRIMARY_SERVICE_TYPES,
  SECONDARY_SERVICE_TYPES,
  type ServiceTypeValue,
} from "@/lib/serviceTypes";

// Step 1: what do you actually need?
//
// This is the first thing anyone sees, and for traffic coming off a Marketplace
// ad it's the whole pitch — someone who just bought a couch from a stranger
// needs to recognise their own errand in the first two seconds. So it's one tap,
// no typing, and the six most common jobs are visible without expanding.
//
// The answer also presets the drop-off mode and the move size, so picking
// "need a hand" means never being asked for a drop-off address.

export default function StepJob({
  value,
  otherText,
  onChange,
}: {
  value: ServiceTypeValue | null;
  otherText: string;
  onChange: (next: { serviceType: ServiceTypeValue; otherText: string }) => void;
}) {
  // Keep the long tail expanded once opened, and open automatically if the
  // customer already picked something from it (e.g. coming back a step).
  const [showAll, setShowAll] = useState(
    () => value !== null && SECONDARY_SERVICE_TYPES.some((s) => s.value === value),
  );

  const options = showAll
    ? [...PRIMARY_SERVICE_TYPES, ...SECONDARY_SERVICE_TYPES]
    : PRIMARY_SERVICE_TYPES;

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">What do you need?</h2>
      <p className="mt-2 text-neutral-500">
        Pick the closest one — you can add details in a moment.
      </p>

      <div className="mt-6 grid gap-2.5">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange({ serviceType: option.value, otherText })}
              className={`rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-black/10 bg-black/[0.02] hover:border-brand/40"
              }`}
            >
              <span className="block font-semibold text-ink">{option.label}</span>
              <span className="mt-0.5 block text-sm text-neutral-500">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {!showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm font-semibold text-brand-cyan transition hover:text-ink"
        >
          More options — storage, office, something else
        </button>
      )}

      {value === "OTHER" && (
        <div className="mt-5">
          <label htmlFor="serviceTypeOther" className="block text-sm font-semibold text-ink">
            What do you need help with?
          </label>
          <input
            id="serviceTypeOther"
            value={otherText}
            autoFocus
            onChange={(e) => onChange({ serviceType: "OTHER", otherText: e.target.value })}
            placeholder="e.g. help emptying a shed"
            className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}
    </div>
  );
}
