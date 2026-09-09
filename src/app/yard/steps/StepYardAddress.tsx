"use client";

import AddressFields from "@/components/AddressFields";
import type { StructuredAddress } from "@/lib/address";

// "Where is it?" — one address, because a yard doesn't go anywhere.
//
// The moving flow asks for two and spends real effort working out whether the
// second one is needed (see dropoffModes.ts). None of that applies here: the
// crew arrives, does the work, and leaves with the green waste. One address,
// no mode question, no route to measure — the price was already settled on the
// step before this one.

export default function StepYardAddress({
  value,
  onChange,
}: {
  value: StructuredAddress;
  onChange: (value: StructuredAddress) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Where is it?</h2>
      <p className="mt-2 text-neutral-500">
        The property address. Gate codes and parking notes go in the box on the last step.
      </p>

      <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03]">
        <AddressFields
          legend="Property address"
          section="pickup"
          icon={<PinIcon />}
          value={value}
          onChange={onChange}
          enableLocation
        />
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
