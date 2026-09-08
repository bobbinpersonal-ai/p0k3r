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
  section,
}: {
  legend: string;
  icon: React.ReactNode;
  value: StructuredAddress;
  onChange: (value: StructuredAddress) => void;
  autoFocus?: boolean;
  /** Offer "use my location" for this end. */
  enableLocation?: boolean;
  /**
   * Distinguishes this block from the other address on the same page for the
   * browser's autofill, the same way a checkout form tells shipping and
   * billing apart — see the `autoComplete` values below. Without it, filling
   * pickup from a saved address can just as easily land in drop-off too.
   */
  section: "pickup" | "dropoff";
}) {
  const id = useId();
  const zipTouched = value.zip.trim().length > 0;
  const zipInvalid = zipTouched && !isValidZip(value.zip);

  // "section-<name>" is the standard way (used by every shipping/billing form)
  // to tell the browser that two address blocks on the same page are
  // different addresses, so it doesn't autofill drop-off with the pickup one.
  const ac = (field: string) => `section-${section} ${field}`;

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
            // "address-line1", not "street-address": the latter tells the
            // browser this ONE field holds the whole address, which is why
            // iOS was dumping the full "street, city, state zip" string in
            // here instead of splitting it across the fields below.
            autoComplete={ac("address-line1")}
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
              autoComplete={ac("address-level2")}
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
              autoComplete={ac("postal-code")}
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
            autoComplete={ac("address-line2")}
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
        // Fills whatever the fix supports — house number, street, or just the
        // town — and never blanks a field the customer already typed.
        <UseMyLocationButton
          className="mt-3"
          ariaLabel={`Use my location for ${legend.toLowerCase()}`}
          onResolved={({ street, city, zip }) =>
            set({
              street: street || value.street,
              city: city || value.city,
              zip: zip || value.zip,
            })
          }
        />
      )}
    </fieldset>
  );
}
