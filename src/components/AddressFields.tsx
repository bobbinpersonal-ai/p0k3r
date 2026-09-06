"use client";

import { useId } from "react";
import {
  isValidZip,
  type StructuredAddress,
} from "@/lib/address";
import UseMyLocationButton from "@/components/UseMyLocationButton";

// Street / unit / city / ZIP, asked for separately.
//
// This replaced a Google-style autocomplete dropdown. Suggestions need a paid
// Places key to be any good, and the keyless ones were confidently wrong often
// enough to be worse than typing — a customer picking the wrong "Lee Ct" gets a
// quote for the wrong trip. Four short fields the customer controls beat a
// dropdown they have to distrust, and the parts go straight to the Census
// geocoder's structured endpoint, which is what makes the map pin land on the
// actual building.

export default function AddressFields({
  legend,
  icon,
  value,
  onChange,
  autoFocus,
  enableLocation = false,
}: {
  legend: string;
  icon: React.ReactNode;
  value: StructuredAddress;
  onChange: (value: StructuredAddress) => void;
  autoFocus?: boolean;
  /** Offer "use my location" to fill city and ZIP. Pickup only — see StepAddresses. */
  enableLocation?: boolean;
}) {
  const id = useId();
  const zipTouched = value.zip.trim().length > 0;
  const zipInvalid = zipTouched && !isValidZip(value.zip);

  function set(patch: Partial<StructuredAddress>) {
    onChange({ ...value, ...patch });
  }

  const fieldClass =
    "w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2.5 text-base text-ink " +
    "placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

  return (
    <fieldset className="px-4 py-4">
      <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        <span className="text-neutral-400">{icon}</span>
        {legend}
      </legend>

      <div className="mt-3 grid gap-2">
        <div>
          <label htmlFor={`${id}-street`} className="sr-only">
            {legend} street address
          </label>
          <input
            id={`${id}-street`}
            value={value.street}
            autoFocus={autoFocus}
            autoComplete="street-address"
            placeholder="Street address"
            onChange={(e) => set({ street: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <div>
            <label htmlFor={`${id}-city`} className="sr-only">
              {legend} city
            </label>
            <input
              id={`${id}-city`}
              value={value.city}
              autoComplete="address-level2"
              placeholder="City"
              onChange={(e) => set({ city: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={`${id}-zip`} className="sr-only">
              {legend} ZIP code
            </label>
            <input
              id={`${id}-zip`}
              value={value.zip}
              // Numeric keypad on phones, where most of these get typed.
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="ZIP"
              aria-invalid={zipInvalid || undefined}
              onChange={(e) => set({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
              className={`${fieldClass} ${zipInvalid ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-unit`} className="sr-only">
            {legend} apartment or unit
          </label>
          <input
            id={`${id}-unit`}
            value={value.unit}
            autoComplete="address-line2"
            placeholder="Apt / unit / gate code (optional)"
            onChange={(e) => set({ unit: e.target.value })}
            className={`${fieldClass} text-sm`}
          />
        </div>
      </div>

      {zipInvalid && (
        <p className="mt-2 text-xs text-red-600">ZIP needs to be 5 digits.</p>
      )}

      {enableLocation && (
        // Fills city and ZIP and deliberately leaves street alone: a GPS fix is
        // routinely off by a building indoors, so a street line from it would
        // be a guess wearing the costume of a fact.
        <UseMyLocationButton
          className="mt-3"
          onResolved={({ city, zip }) =>
            set({ city: city || value.city, zip: zip || value.zip })
          }
        />
      )}
    </fieldset>
  );
}
