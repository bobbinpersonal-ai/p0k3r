"use client";

import { SERVICE_TYPES, type ServiceTypeValue } from "@/lib/serviceTypes";

// "What are you moving?" — the job description dispatch reads before assigning
// a crew, plus whether the customer wants a second pair of hands.
//
// Lugg's version of this step also takes photos of the items. That needs a
// file store we don't have wired up yet (see the README), so this asks for a
// written description instead — dispatch calls to confirm either way.

export type ItemsValue = {
  serviceType: ServiceTypeValue | null;
  serviceTypeOther: string;
  details: string;
  needsHelper: boolean | null;
};

export default function StepItems({
  value,
  onChange,
  helperFee,
}: {
  value: ItemsValue;
  onChange: (next: ItemsValue) => void;
  /** What an extra helper adds to this job, or null before a truck is picked. */
  helperFee: { low: number; high: number } | null;
}) {
  const set = (patch: Partial<ItemsValue>) => onChange({ ...value, ...patch });

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">What are you moving?</h2>
      <p className="mt-2 text-neutral-500">
        The more we know up front, the closer your final price lands to the estimate.
      </p>

      <fieldset className="mt-8">
        <legend className="text-sm font-semibold text-ink">What do you need help with?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SERVICE_TYPES.map((option) => {
            const isSelected = value.serviceType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => set({ serviceType: option.value })}
                aria-pressed={isSelected}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-brand bg-brand/5"
                    : "border-black/10 hover:border-brand/40"
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
      </fieldset>

      {value.serviceType === "OTHER" && (
        <div className="mt-4">
          <label htmlFor="serviceTypeOther" className="block text-sm font-semibold text-ink">
            Tell us what you need
          </label>
          <input
            id="serviceTypeOther"
            value={value.serviceTypeOther}
            onChange={(e) => set({ serviceTypeOther: e.target.value })}
            placeholder="e.g. help unloading a rental truck"
            className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="details" className="block text-sm font-semibold text-ink">
          Item description <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="details"
          rows={4}
          value={value.details}
          onChange={(e) => set({ details: e.target.value })}
          placeholder={"Sofa and cabinet\nOrder #12345\n3rd floor walk-up, no elevator"}
          className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <p className="mt-1.5 text-sm text-neutral-500">
          Stairs, elevators, tight parking, anything heavy or fragile — it all helps the crew
          show up ready.
        </p>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-ink">Need an extra helper?</legend>
        <p className="mt-1.5 text-sm text-neutral-500">
          An extra pair of hands for the whole job. Priced at what we pay them, so it
          scales with how long your move takes.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            {
              value: true,
              label: "Yes, send a helper",
              body: "Two people loading and carrying",
              // Shown on the button itself, and it's exactly what the running
              // total below will move by — the two come from the same figure.
              price: helperFee ? `+$${helperFee.low}–$${helperFee.high}` : null,
            },
            {
              value: false,
              label: "No, driver only",
              body: "I'll help load it myself",
              price: "No extra charge",
            },
          ].map((option) => {
            const isSelected = value.needsHelper === option.value;
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => set({ needsHelper: option.value })}
                aria-pressed={isSelected}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-brand bg-brand/5"
                    : "border-black/10 hover:border-brand/40"
                }`}
              >
                <span className="block font-semibold text-ink">{option.label}</span>
                <span className="mt-0.5 block text-sm text-neutral-500">{option.body}</span>
                {option.price && (
                  <span
                    className={`mt-2 block font-mono text-sm ${
                      option.value ? "font-bold text-ink" : "text-neutral-500"
                    }`}
                  >
                    {option.price}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
